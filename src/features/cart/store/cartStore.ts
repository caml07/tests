import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { SQLiteStorage } from 'expo-sqlite/kv-store'
import NetInfo from '@react-native-community/netinfo'
import type { CartItem } from '@/src/shared/types'
import { api } from '@/src/shared/services/api'
import { getDb, serializeArray } from '@/src/shared/services/database'

function uid(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 12)
}

interface SubmitResult {
  success: boolean
  queued: boolean
  error?: string
}

interface CartState {
  items: CartItem[]
  addItem: (item: Omit<CartItem, 'id' | 'createdAt'>) => void
  removeItem: (itemId: string) => void
  clearCart: () => void
  clearByPatient: (patientId: string) => void
  clearStaleItems: () => void
  submitOrder: (patientId: string, patientNombre: string) => Promise<SubmitResult>
}

function startOfToday(): number {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  return d.getTime()
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (item) =>
        set((state) => ({
          items: [
            { ...item, createdAt: new Date().toISOString(), id: uid() },
            ...state.items,
          ],
        })),

      removeItem: (itemId) =>
        set((state) => ({
          items: state.items.filter((i) => i.id !== itemId),
        })),

      clearCart: () => set({ items: [] }),

      clearByPatient: (patientId) =>
        set((state) => ({
          items: state.items.filter((i) => i.pacienteId !== patientId),
        })),

      clearStaleItems: () => {
        const today = startOfToday()
        set((state) => ({
          items: state.items.filter((i) => {
            if (!i.createdAt) return false
            return new Date(i.createdAt).getTime() >= today
          }),
        }))
      },

      submitOrder: async (patientId, patientNombre) => {
        const { items, clearByPatient } = get()
        const patientItems = items.filter((i) => i.pacienteId === patientId)
        if (patientItems.length === 0) return { success: false, queued: false, error: 'Carrito vacío' }

        const netState = await NetInfo.fetch().catch(() => ({ isConnected: false }))
        const isOnline = process.env.EXPO_PUBLIC_FORCE_OFFLINE === 'true' ? false : (netState.isConnected ?? false)

        if (isOnline) {
          try {
            await api.postPedido(patientItems)
            clearByPatient(patientId)
            return { success: true, queued: false }
          } catch (e) {
            return { success: false, queued: false, error: e instanceof Error ? e.message : 'Error de conexión' }
          }
        }

        try {
          const db = await getDb()
          const idempotencyKey = uid()
          await db.runAsync(
            `INSERT INTO pedidos_queue (id, items, pacienteId, pacienteNombre, timestamp, status, idempotency_key) VALUES (?, ?, ?, ?, ?, 'PENDING', ?)`,
            uid(),
            serializeArray(patientItems),
            patientId,
            patientNombre,
            new Date().toISOString(),
            idempotencyKey,
          )
          clearByPatient(patientId)
          return { success: true, queued: true }
        } catch (e) {
          return { success: false, queued: false, error: e instanceof Error ? e.message : 'Error al guardar localmente' }
        }
      },
    }),
    {
      name: 'dietas-cart-storage',
      storage: createJSONStorage(() => new SQLiteStorage('dietas-cart-db')),
      onRehydrateStorage: () => (state) => {
        state?.clearStaleItems()
      },
    },
  ),
)

export function getCartCountByPatient(patientId: string): number {
  return useCartStore.getState().items.filter((i) => i.pacienteId === patientId).length
}

export function getCartItemsByPatient(patientId: string): CartItem[] {
  return useCartStore.getState().items.filter((i) => i.pacienteId === patientId)
}
