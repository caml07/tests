import type { SQLiteDatabase, SQLiteBindValue } from 'expo-sqlite'
import type { QueryClient } from '@tanstack/react-query'
import * as FileSystem from 'expo-file-system/legacy'
const FS = FileSystem as unknown as { documentDirectory: string; readAsStringAsync: Function; writeAsStringAsync: Function; EncodingType: { UTF8: string } }
import { api } from './api'
import { getAllRows, deleteWhere, getMetaValue, setMetaValue, invalidateDb } from './database'
import { log, warn, error as logError, logErrorDump } from './appLogger'
import type { Station, Patient, CartItem, Agrupacion, CensoPatient } from '@/src/shared/types'
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

interface ParsedAlergia {
  drug: string
  reaction: string
  raw: string
  lines: string[]
}

function parseAlergias(raw: string, bitAlergia?: boolean): ParsedAlergia[] {
  if (bitAlergia === false) return []
  const cleaned = stripHtml(raw).trim()
  if (!cleaned || /no refiere?/i.test(cleaned)) return []

  const result: ParsedAlergia[] = []

  // Formato estructurado: ". -Drug: Reaction. Agrega: Author - Date" (puede repetirse)
  const structuredRegex = /\.?\s*-\s*([^:]+):\s*([^.]+)\.\s*Agrega:\s*([^-]+)\s*-\s*([^.]+)/gi
  let match: RegExpExecArray | null
  let structuredCount = 0
  while ((match = structuredRegex.exec(cleaned)) !== null) {
    const drug = match[1].trim()
    const reaction = match[2].trim()
    const rawEntry = match[0].trim()
    const lines = rawEntry.split(/\.\s*/).filter(Boolean)
    result.push({ drug, reaction, raw: rawEntry, lines })
    structuredCount++
  }
  if (structuredCount > 0) return result

  // Formato parens: "Drug (Reaction)"
  const parensMatch = cleaned.match(/^(.+?)\s*\(([^)]+)\)$/)
  if (parensMatch) {
    const drug = parensMatch[1].trim()
    const reaction = parensMatch[2].trim()
    return [{ drug, reaction, raw: cleaned, lines: [cleaned] }]
  }

  // Simple: texto plano (puede tener comas, no hacemos split para no romper "Celebra, Rash")
  return [{ drug: cleaned, reaction: '', raw: cleaned, lines: [cleaned] }]
}

export async function dumpDb(db: SQLiteDatabase): Promise<string> {
  log('DUMP', 'Starting DB dump (serialized)')
  const agrupaciones = await db.getAllAsync('SELECT * FROM agrupaciones')
  log('DUMP', `agrupaciones: ${agrupaciones.length} rows`)
  const stations = await db.getAllAsync('SELECT * FROM stations')
  log('DUMP', `stations: ${stations.length} rows`)
  const patients = await db.getAllAsync('SELECT * FROM patients')
  log('DUMP', `patients: ${patients.length} rows`)
  const json = JSON.stringify({ agrupaciones, stations, patients }, null, 2)
  const path = FS.documentDirectory + 'db-dump.json'
  await FS.writeAsStringAsync(path, json, { encoding: FS.EncodingType.UTF8 })
  log('DUMP', `DB dump saved: ${path} (${json.length} bytes)`)
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

    if (!seenStations.has(p.strEstacion)) {
      seenStations.add(p.strEstacion)
      stations.push({
        id: p.strEstacion,
        nombre: p.strEstacion,
        agrupacionId: String(p.intAgrupacion),
      })
    }

    patients.push({
      id: String(p.decCuenta),
      decPaciente: p.decPaciente,
      nombre: stripHtml(p.strPacienteNombresApellidos),
      stationId: p.strEstacion,
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
let _syncRunning = false

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
  if (_syncRunning) {
    log('SYNC', 'syncAll skipped: already running')
    return false
  }
  _syncRunning = true

  let newHash = ''
  let censoCount = 0
  let agrupaciones: Agrupacion[] = []
  let stations: Station[] = []
  let patients: Patient[] = []

  try {
    log('SYNC', 'syncAll START', { strU })

    const [censoRes] = await Promise.all([
      api.getCenso(strU),
    ])
    log('SYNC', 'API getCenso OK', { responseKeys: Object.keys(censoRes[0] || {}) })

    const list = censoRes[0].listCenso ?? []
    censoCount = list.length
    newHash = hashJSON(list)
    log('SYNC', `Raw patients from API: ${list.length}`, { hash: newHash })

    const savedHash = await getMetaValue(db, HASH_KEY)
    log('SYNC', `Hash check: saved="${savedHash}" new="${newHash}" same=${savedHash === newHash}`)

    if (savedHash === newHash) {
      log('SYNC', 'Hash match, skipping sync')
      if (queryClient) invalidateCache(queryClient)
      _syncRunning = false
      return true
    }

    log('SYNC', 'Hash mismatch, parsing censo...')
    const parsed = parseCenso(list)
    agrupaciones = parsed.agrupaciones
    stations = parsed.stations
    patients = parsed.patients
    log('SYNC', `Parsed: ${agrupaciones.length} agrupaciones, ${stations.length} stations, ${patients.length} patients`)

    const byStation = new Map<string, number>()
    for (const p of patients) byStation.set(p.stationId, (byStation.get(p.stationId) ?? 0) + 1)
    for (const s of stations) log('SYNC', `  Station ${s.nombre} → ${byStation.get(s.id) ?? 0} patients`)

    log('SYNC', 'DELETE FROM agrupaciones...')
    await db.execAsync('DELETE FROM agrupaciones')
    log('SYNC', 'DELETE FROM stations...')
    await db.execAsync('DELETE FROM stations')
    log('SYNC', 'DELETE FROM patients...')
    await db.execAsync('DELETE FROM patients')
    log('SYNC', 'All DELETEs done')

    log('SYNC', `INSERT ${agrupaciones.length} agrupaciones...`)
    for (let i = 0; i < agrupaciones.length; i++) {
      const r = agrupaciones[i]
      await db.runAsync('INSERT OR REPLACE INTO agrupaciones (id, nombre, icon) VALUES (?, ?, ?)', [val(r.id), val(r.nombre), val(r.icon)])
      if (i > 0 && i % 10 === 0) log('SYNC', `SYNC`, `  agrupaciones ${i}/${agrupaciones.length}`)
    }
    log('SYNC', `INSERT ${stations.length} stations...`)
    for (let i = 0; i < stations.length; i++) {
      const r = stations[i]
      await db.runAsync('INSERT OR REPLACE INTO stations (id, nombre, agrupacionId) VALUES (?, ?, ?)', [val(r.id), val(r.nombre), val(r.agrupacionId)])
      if (i > 0 && i % 10 === 0) log('SYNC', `  stations ${i}/${stations.length}`)
    }
    log('SYNC', `INSERT ${patients.length} patients...`)
    for (let i = 0; i < patients.length; i++) {
      const r = patients[i]
      const alergias = Array.isArray(r.alergias) ? JSON.stringify(r.alergias) : val(r.alergias)
      await db.runAsync(
        'INSERT OR REPLACE INTO patients (id, nombre, stationId, habitacion, cama, dietaId, alergias, notas, sexo, edad) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [val(r.id), val(r.nombre), val(r.stationId), val(r.habitacion), val(r.cama), val(r.dietaId), alergias, val(r.notas), val(r.sexo), val(r.edad)],
      )
      if (i > 0 && i % 10 === 0) log('SYNC', `  patients ${i}/${patients.length}`)
    }

    log('SYNC', 'Saving hash to meta...')
    await setMetaValue(db, HASH_KEY, newHash)
    log('SYNC', 'Invalidating query cache...')
    if (queryClient) invalidateCache(queryClient)
    log('SYNC', 'syncAll SUCCESS')
    dumpDb(db).catch(() => {})
    _syncRunning = false
    return true
  } catch (e) {
    logError('SYNC', 'syncAll FAILED', { error: (e as Error)?.message, hash: newHash, censo: censoCount, agrupaciones: agrupaciones.length, stations: stations.length, patients: patients.length })
    logError('SYNC', `Stack: ${(e as Error)?.stack ?? '(no stack)'}`)
    logErrorDump(db, e, { hash: newHash, censoCount, agrupaciones: agrupaciones.length, stations: stations.length, patients: patients.length })
    const path = FS.documentDirectory + 'sync-error.txt'
    try {
      await FS.writeAsStringAsync(path, `[SYNC-ERROR] ${new Date().toISOString()}\nError: ${(e as Error)?.message ?? String(e)}\nStack: ${(e as Error)?.stack ?? ''}`, { encoding: FS.EncodingType.UTF8 })
    } catch {}
    invalidateDb()
    _syncRunning = false
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