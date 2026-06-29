import type { SQLiteDatabase, SQLiteBindValue } from 'expo-sqlite'
import type { QueryClient } from '@tanstack/react-query'
import { api } from './api'
import { upsertRows, getAllRows, deleteWhere, serializeArray } from './database'
import type { Station, Patient, Dieta, Comida, CartItem } from '@/src/shared/types'

const MAX_RETRIES = 5

let pendingListeners: Array<() => void> = []

export function subscribePendingUpdates(listener: () => void) {
  pendingListeners.push(listener)
  return () => {
    pendingListeners = pendingListeners.filter(l => l !== listener)
  }
}

function notifyPendingUpdate() {
  pendingListeners.forEach(l => l())
}

interface QueueEntry {
  id: string
  items: string
  pacienteId: string
  pacienteNombre: string
  timestamp: string
  failed_attempts: number
  status: string
  next_attempt_at: string | null
  idempotency_key: string | null
}

export interface SyncResult {
  ok: number
  failed: number
}

function bind(v: unknown): SQLiteBindValue {
  return v as SQLiteBindValue
}

export async function syncAll(db: SQLiteDatabase, queryClient?: QueryClient): Promise<boolean> {
  try {
    const [stations, patients, dietas, comidas] = await Promise.all([
      api.getEstaciones(),
      api.getAllPatients(),
      api.getDietas(),
      api.getComidas(),
    ])

    await Promise.all([
      upsertRows(db, 'stations', stations),
      upsertRows(db, 'patients', patients),
      upsertRows(db, 'dietas', dietas.map((d) => ({ ...d, tiempos: serializeArray(d.tiempos) }))),
      upsertRows(db, 'comidas', comidas.map((c) => ({ ...c, subcomidas: serializeArray(c.subcomidas) }))),
    ])

    // Poblar el query cache para que funcione offline-first
    if (queryClient) {
      queryClient.setQueryData(['stations'], stations)
      queryClient.setQueryData(['dietas'], dietas)
      queryClient.setQueryData(['comidas'], comidas)
      // Los pacientes se consultan por estación; seteamos el prefijo
      const patientsByStation = new Map<string, Patient[]>()
      for (const p of patients) {
        const arr = patientsByStation.get(p.stationId)
        if (arr) arr.push(p)
        else patientsByStation.set(p.stationId, [p])
      }
      for (const [stationId, pts] of patientsByStation) {
        queryClient.setQueryData(['pacientes', stationId], pts)
      }
    }

    return true
  } catch {
    return false
  }
}

export async function flushQueue(db: SQLiteDatabase): Promise<SyncResult> {
  const now = new Date().toISOString()

  const queue = await getAllRows<QueueEntry>(
    db,
    'pedidos_queue',
    "status = 'PENDING' AND (next_attempt_at IS NULL OR next_attempt_at <= ?)",
    [bind(now)],
  )

  if (queue.length === 0) return { ok: 0, failed: 0 }

  const ids = queue.map((e) => e.id)
  const placeholders = ids.map(() => '?').join(', ')
  await db.runAsync(
    `UPDATE pedidos_queue SET status = 'IN_FLIGHT' WHERE id IN (${placeholders})`,
    ...ids.map(bind),
  )

  const results = await Promise.allSettled(
    queue.map(async (entry) => {
      try {
        const items: CartItem[] = JSON.parse(entry.items)
        await api.postPedido(items, entry.idempotency_key ?? undefined)
        await deleteWhere(db, 'pedidos_queue', 'id = ?', [bind(entry.id)])
        return 'ok' as const
      } catch {
        const attempts = entry.failed_attempts + 1

        if (attempts >= MAX_RETRIES) {
          await db.runAsync(
            "UPDATE pedidos_queue SET status = 'DEAD_LETTER', failed_attempts = ? WHERE id = ?",
            bind(attempts),
            bind(entry.id),
          )
        } else {
          const backoff = Math.min(1000 * 2 ** attempts, 60000)
          const nextAttemptAt = new Date(Date.now() + backoff).toISOString()
          await db.runAsync(
            "UPDATE pedidos_queue SET status = 'PENDING', failed_attempts = ?, next_attempt_at = ? WHERE id = ?",
            bind(attempts),
            bind(nextAttemptAt),
            bind(entry.id),
          )
        }
        return 'fail' as const
      }
    }),
  )

  let ok = 0
  let failed = 0
  for (const result of results) {
    if (result.status === 'fulfilled' && result.value === 'ok') {
      ok++
    } else {
      failed++
    }
  }

  notifyPendingUpdate()

  return { ok, failed }
}

export async function getDeadLetterItems(db: SQLiteDatabase): Promise<QueueEntry[]> {
  return getAllRows<QueueEntry>(db, 'pedidos_queue', "status = 'DEAD_LETTER'")
}

export async function getPendingItems(db: SQLiteDatabase): Promise<QueueEntry[]> {
  const now = new Date().toISOString()
  return getAllRows<QueueEntry>(
    db,
    'pedidos_queue',
    "status IN ('PENDING', 'IN_FLIGHT')",
  )
}

export async function retryDeadLetterItem(db: SQLiteDatabase, id: string): Promise<void> {
  await db.runAsync(
    "UPDATE pedidos_queue SET status = 'PENDING', failed_attempts = 0, next_attempt_at = NULL WHERE id = ?",
    bind(id),
  )
}

export async function discardDeadLetterItem(db: SQLiteDatabase, id: string): Promise<void> {
  await deleteWhere(db, 'pedidos_queue', 'id = ?', [bind(id)])
}
