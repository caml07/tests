import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { SQLiteStorage } from 'expo-sqlite/kv-store'
import type { CartItem } from '@/src/shared/types'
import { api } from '@/src/shared/services/api'

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

        try {
          const order = await api.postPedido(patientItems)
          clearByPatient(patientId)
          return { success: true, queued: order.status === 'local_pending' }
        } catch (e) {
          return { success: false, queued: false, error: e instanceof Error ? e.message : 'Error de conexión' }
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
