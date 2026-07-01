import type { SQLiteDatabase, SQLiteBindValue } from 'expo-sqlite'
import type { QueryClient } from '@tanstack/react-query'
import * as FileSystem from 'expo-file-system'
const FS = FileSystem as unknown as { documentDirectory: string }
import { api } from './api'
import { getAllRows, deleteWhere } from './database'
import type { Station, Patient, CartItem, Agrupacion, CensoPatient } from '@/src/shared/types'
import { mmkv } from './mmkvStorage'

const MAX_RETRIES = 5

const AGRUPACION_ICONS: Record<number, string> = {
  1: 'cross.case',
  2: 'building.2.fill',
  3: 'person',
}

const ENTITY_MAP: Record<string, string> = {
  '&ntilde;': '\u00F1', '&Ntilde;': '\u00D1',
  '&aacute;': '\u00E1', '&Aacute;': '\u00C1',
  '&eacute;': '\u00E9', '&Eacute;': '\u00C9',
  '&iacute;': '\u00ED', '&Iacute;': '\u00CD',
  '&oacute;': '\u00F3', '&Oacute;': '\u00D3',
  '&uacute;': '\u00FA', '&Uacute;': '\u00DA',
  '&uuml;': '\u00FC', '&Uuml;': '\u00DC',
  '&iexcl;': '\u00A1', '&iquest;': '\u00BF',
  '&amp;': '&', '&lt;': '<', '&gt;': '>',
  '&quot;': '"', '&#39;': "'", '&nbsp;': ' ',
}

function decodeEntities(s: string): string {
  return s.replace(/&[a-zA-Z]+;|&#\d+;/g, m => ENTITY_MAP[m] ?? m)
}

function stripHtml(s: string): string {
  if (!s) return ''
  let result = s
    .replace(/<br\s*\/?>/gi, ' ')
    .replace(/<\/?(li|p|div|tr|td|h[1-6])\b[^>]*>/gi, ' ')
    .replace(/<[^>]*>/g, '')
  result = decodeEntities(result)
  return result.replace(/\s+/g, ' ').trim()
}

function parseAlergias(raw: string, bitAlergia?: boolean): string[] {
  if (bitAlergia === false) return []
  const cleaned = stripHtml(raw)
  if (!cleaned || cleaned.toLowerCase().includes('no refiere') || cleaned.toLowerCase().includes('no refieren')) return []
  if (cleaned.startsWith('[')) { try { return JSON.parse(cleaned) as string[] } catch {} }
  return cleaned.split(/[,;]+/).map(s => s.trim()).filter(Boolean)
}

export async function dumpDb(db: SQLiteDatabase): Promise<string> {
  const [agrupaciones, stations, patients] = await Promise.all([
    db.getAllAsync('SELECT * FROM agrupaciones'),
    db.getAllAsync('SELECT * FROM stations'),
    db.getAllAsync('SELECT * FROM patients'),
  ])
  const json = JSON.stringify({ agrupaciones, stations, patients }, null, 2)
  const path = FS.documentDirectory + 'db-dump.json'
  await FileSystem.writeAsStringAsync(path, json, { encoding: 'utf8' as any })
  if (__DEV__) console.log('[DUMP] Saved:', path, `(${json.length} bytes)`)
  return path
}

export function parseCenso(list: CensoPatient[]): { agrupaciones: Agrupacion[]; stations: Station[]; patients: Patient[] } {
  const seenAgrupaciones = new Set<number>()
  const seenStations = new Set<string>()
  const agrupaciones: Agrupacion[] = []
  const stations: Station[] = []
  const patients: Patient[] = []

  for (const p of list) {
    if (!seenAgrupaciones.has(p.intAgrupacion)) {
      seenAgrupaciones.add(p.intAgrupacion)
      agrupaciones.push({
        id: String(p.intAgrupacion),
        nombre: p.strAgrupacion,
        icon: AGRUPACION_ICONS[p.intAgrupacion] ?? 'cross.case',
      })
    }

    if (!seenStations.has(p.strAreaServicio)) {
      seenStations.add(p.strAreaServicio)
      stations.push({
        id: p.strAreaServicio,
        nombre: p.strAreaServicio,
        agrupacionId: String(p.intAgrupacion),
      })
    }

    patients.push({
      id: String(p.decCuenta),
      decPaciente: p.decPaciente,
      nombre: stripHtml(p.strPacienteNombresApellidos),
      stationId: p.strAreaServicio,
      habitacion: String(p.intHabitacion),
      cama: String(p.intCama),
      alergias: parseAlergias(p.strAlergias, p.bitAlergia),
      notas: stripHtml(p.strMotivoConsulta),
      sexo: p.strSexo || '',
      edad: p.strEdad || '',
      dietaId: '',
    })
  }

  return { agrupaciones, stations, patients }
}

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
  items: CartItem[]
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
  items: number
  failed: number
}

function bind(v: unknown): SQLiteBindValue {
  return v as SQLiteBindValue
}

const HASH_KEY = 'censoHash'

function val(v: unknown): string {
  return v == null ? '' : String(v)
}

function hashJSON(arr: unknown[]): string {
  const s = JSON.stringify(arr)
  let h = 0
  for (let i = 0; i < s.length; i++) h = ((h << 5) - h + s.charCodeAt(i)) | 0
  return h.toString(36)
}

function invalidateCache(queryClient: QueryClient) {
  queryClient.invalidateQueries({ queryKey: ['pacientes'] })
  queryClient.invalidateQueries({ queryKey: ['agrupaciones'] })
  queryClient.invalidateQueries({ queryKey: ['stations'] })
  queryClient.invalidateQueries({ queryKey: ['patients'] })
}

export async function syncAll(db: SQLiteDatabase, queryClient?: QueryClient, strU?: string): Promise<boolean> {
  try {
    const [censoRes] = await Promise.all([
      api.getCenso(strU),
    ])

    const list = censoRes[0].listCenso ?? []
    const newHash = hashJSON(list)
    if (mmkv.getString(HASH_KEY) === newHash) {
      if (queryClient) invalidateCache(queryClient)
      return true
    }

    const { agrupaciones, stations, patients } = parseCenso(list)

    if (__DEV__) {
      console.log('[SYNC] ─── CENSO DUMP ───')
      console.log('[SYNC] Raw patients from API:', list.length)
      console.log('[SYNC] Parsed agrupaciones:', agrupaciones.length)
      console.log('[SYNC] Parsed stations:', stations.length)
      console.log('[SYNC] Parsed patients:', patients.length)
      const byStation = new Map<string, number>()
      for (const p of patients) byStation.set(p.stationId, (byStation.get(p.stationId) ?? 0) + 1)
      for (const s of stations) console.log('[SYNC]   Station', s.nombre, '→', byStation.get(s.id) ?? 0, 'patients')
      console.log('[SYNC] ────────────────')
    }

    await db.runAsync('DELETE FROM agrupaciones')
    for (const r of agrupaciones) {
      await db.runAsync('INSERT OR REPLACE INTO agrupaciones (id, nombre, icon) VALUES (?, ?, ?)', val(r.id), val(r.nombre), val(r.icon))
    }
    await db.runAsync('DELETE FROM stations')
    for (const r of stations) {
      await db.runAsync('INSERT OR REPLACE INTO stations (id, nombre, agrupacionId) VALUES (?, ?, ?)', val(r.id), val(r.nombre), val(r.agrupacionId))
    }
    await db.runAsync('DELETE FROM patients')
    for (const r of patients) {
      const alergias = Array.isArray(r.alergias) ? JSON.stringify(r.alergias) : val(r.alergias)
      await db.runAsync(
        'INSERT OR REPLACE INTO patients (id, nombre, stationId, habitacion, cama, dietaId, alergias, notas, sexo, edad) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        val(r.id), val(r.nombre), val(r.stationId), val(r.habitacion), val(r.cama), val(r.dietaId), alergias, val(r.notas), val(r.sexo), val(r.edad),
      )
    }

    mmkv.set(HASH_KEY, newHash)
    if (queryClient) invalidateCache(queryClient)
    if (__DEV__) dumpDb(db).catch(() => {})
    return true
  } catch (e) {
    if (__DEV__) console.warn('[SYNC] syncAll failed:', e)
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

  if (queue.length === 0) return { ok: 0, items: 0, failed: 0 }

  const ids = queue.map((e) => e.id)
  const placeholders = ids.map(() => '?').join(', ')
  await db.runAsync(
    `UPDATE pedidos_queue SET status = 'IN_FLIGHT' WHERE id IN (${placeholders})`,
    ...ids.map(bind),
  )

  const results = await Promise.allSettled(
    queue.map(async (entry) => {
      try {
        await api.postPedido(entry.items, entry.idempotency_key ?? undefined, true)
        await deleteWhere(db, 'pedidos_queue', 'id = ?', [bind(entry.id)])
        return 'ok' as const
      } catch (e) {
        if (__DEV__) console.error('[flushQueue]', (e as Error)?.message)
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
  let items = 0
  let failed = 0
  for (let i = 0; i < results.length; i++) {
    if (results[i].status === 'fulfilled' && (results[i] as PromiseFulfilledResult<'ok' | 'fail'>).value === 'ok') {
      ok++
      items += queue[i].items.length
    } else {
      failed++
    }
  }

  notifyPendingUpdate()

  return { ok, items, failed }
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
