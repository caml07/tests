import { openDatabaseAsync, deleteDatabaseAsync, type SQLiteDatabase, type SQLiteBindValue } from 'expo-sqlite'
import { log, warn, error as logError } from './appLogger'

let _db: SQLiteDatabase | null = null
let _opQueue: Array<() => void> = []
let _opBusy = false

export function invalidateDb(): void {
  log('DB', 'invalidateDb: resetting connection')
  _db = null
}

async function runOpQueue(): Promise<void> {
  if (_opBusy || _opQueue.length === 0) return
  _opBusy = true
  while (_opQueue.length > 0) {
    const task = _opQueue.shift()
    try {
      await task?.()
    } catch (e) {
      const msg = (e as Error)?.message ?? ''
      if (msg.includes('prepareAsync') || msg.includes('NativeDatabase') || msg.includes('NullPointerException')) {
        logError('DB', 'Native NPE detected in queue, invalidating connection', { message: msg })
        invalidateDb()
      }
    }
  }
  _opBusy = false
}

export function withDb<T>(fn: (db: SQLiteDatabase) => Promise<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    _opQueue.push(async () => {
      try {
        const db = await getDb()
        resolve(await fn(db))
      } catch (e) {
        reject(e)
      }
    })
    runOpQueue()
  })
}

export function setDb(db: SQLiteDatabase): void {
  log('DB', 'setDb called')
  _db = db
}

export async function getDb(): Promise<SQLiteDatabase> {
  if (_db) {
    log('DB', 'getDb: returning existing instance')
    return _db
  }
  log('DB', 'getDb: no instance, calling initDatabase...')
  _db = await initDatabase()
  log('DB', 'getDb: initDatabase done')
  return _db
}

export function getDbSync(): SQLiteDatabase | null {
  return _db
}

export async function initDatabase(name = 'nutricion.db'): Promise<SQLiteDatabase> {
  try {
    log('DB', `initDatabase: opening "${name}"...`)
    const db = await openDatabaseAsync(name, { useNewConnection: true })
    log('DB', 'initDatabase: open OK, enabling WAL mode...')
    await db.execAsync('PRAGMA journal_mode = WAL')
    log('DB', 'initDatabase: running migration...')
    await migrateDbIfNeeded(db)
    log('DB', 'initDatabase: migration done')
    return db
  } catch (e) {
    warn('DB', `initDatabase: first attempt failed, wiping and retrying`, (e as Error)?.message)
    await deleteDatabaseAsync(name).catch(() => {})
    log('DB', 'initDatabase: deleted old DB, retrying open...')
    const db = await openDatabaseAsync(name, { useNewConnection: true })
    await db.execAsync('PRAGMA journal_mode = WAL')
    await migrateDbIfNeeded(db)
    log('DB', 'initDatabase: retry done')
    return db
  }
}

export async function migrateDbIfNeeded(db: SQLiteDatabase) {
  const DATABASE_VERSION = 6
  const result = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version')
  const currentVersion = result?.user_version ?? 0
  log('DB', `Migration: current_version=${currentVersion}, target=${DATABASE_VERSION}`)

  if (currentVersion >= DATABASE_VERSION) { log('DB', 'Migration: already up to date'); return }

  if (currentVersion < 1) {
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS stations (
        id TEXT PRIMARY KEY NOT NULL,
        nombre TEXT NOT NULL,
        agrupacionId TEXT NOT NULL DEFAULT ''
      );
      CREATE TABLE IF NOT EXISTS patients (
        id TEXT PRIMARY KEY NOT NULL,
        nombre TEXT NOT NULL,
        stationId TEXT NOT NULL,
        habitacion TEXT NOT NULL,
        cama TEXT NOT NULL,
        dietaId TEXT NOT NULL,
        alergias TEXT NOT NULL DEFAULT '',
        notas TEXT NOT NULL DEFAULT '',
        sexo TEXT NOT NULL DEFAULT '',
        edad TEXT NOT NULL DEFAULT ''
      );
      CREATE TABLE IF NOT EXISTS dietas (
        id TEXT PRIMARY KEY NOT NULL,
        nombre TEXT NOT NULL,
        tiempos TEXT NOT NULL DEFAULT '[]',
        simbolo TEXT NOT NULL DEFAULT ''
      );
      CREATE TABLE IF NOT EXISTS comidas (
        id TEXT PRIMARY KEY NOT NULL,
        dietaId TEXT NOT NULL,
        nombre TEXT NOT NULL,
        tiempo TEXT NOT NULL,
        subcomidas TEXT NOT NULL DEFAULT '[]'
      );
      CREATE TABLE IF NOT EXISTS pedidos_queue (
        id TEXT PRIMARY KEY NOT NULL,
        items TEXT NOT NULL DEFAULT '[]',
        pacienteId TEXT NOT NULL,
        pacienteNombre TEXT NOT NULL,
        timestamp TEXT NOT NULL,
        failed_attempts INTEGER NOT NULL DEFAULT 0,
        status TEXT NOT NULL DEFAULT 'PENDING',
        next_attempt_at TEXT,
        idempotency_key TEXT
      );
      CREATE INDEX IF NOT EXISTS idx_patients_station ON patients(stationId);
      CREATE INDEX IF NOT EXISTS idx_comidas_dieta ON comidas(dietaId);
    `)
  }

  if (currentVersion < 2) {
    const cols = await db.getAllAsync<{ name: string }>(`PRAGMA table_info(pedidos_queue)`)
    const existing = new Set(cols.map(c => c.name))

    if (!existing.has('status')) {
      await db.execAsync(`ALTER TABLE pedidos_queue ADD COLUMN status TEXT NOT NULL DEFAULT 'PENDING'`)
    }
    if (!existing.has('next_attempt_at')) {
      await db.execAsync(`ALTER TABLE pedidos_queue ADD COLUMN next_attempt_at TEXT`)
    }
    if (!existing.has('idempotency_key')) {
      await db.execAsync(`ALTER TABLE pedidos_queue ADD COLUMN idempotency_key TEXT`)
    }
  }

  if (currentVersion < 3) {
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS agrupaciones (
        id TEXT PRIMARY KEY NOT NULL,
        nombre TEXT NOT NULL,
        icon TEXT NOT NULL DEFAULT ''
      );
    `)
    const stationCols = await db.getAllAsync<{ name: string }>(`PRAGMA table_info(stations)`)
    const stationExisting = new Set(stationCols.map(c => c.name))
    if (!stationExisting.has('agrupacionId')) {
      await db.execAsync(`ALTER TABLE stations ADD COLUMN agrupacionId TEXT NOT NULL DEFAULT ''`)
    }
  }

  if (currentVersion < 4) {
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS agrupaciones (
        id TEXT PRIMARY KEY NOT NULL,
        nombre TEXT NOT NULL,
        icon TEXT NOT NULL DEFAULT ''
      );
    `)
    const stationCols = await db.getAllAsync<{ name: string }>(`PRAGMA table_info(stations)`)
    const stationExisting = new Set(stationCols.map(c => c.name))
    if (!stationExisting.has('agrupacionId')) {
      await db.execAsync(`ALTER TABLE stations ADD COLUMN agrupacionId TEXT NOT NULL DEFAULT ''`)
    }
  }

  if (currentVersion < 5) {
    const patientCols = await db.getAllAsync<{ name: string }>(`PRAGMA table_info(patients)`)
    const existing = new Set(patientCols.map(c => c.name))
    if (!existing.has('sexo')) {
      await db.execAsync(`ALTER TABLE patients ADD COLUMN sexo TEXT NOT NULL DEFAULT ''`)
    }
    if (!existing.has('edad')) {
      await db.execAsync(`ALTER TABLE patients ADD COLUMN edad TEXT NOT NULL DEFAULT ''`)
    }
  }

  if (currentVersion < 6) {
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS meta (
        key TEXT PRIMARY KEY NOT NULL,
        value TEXT NOT NULL
      );
    `)
  }

  await db.execAsync(`PRAGMA user_version = ${DATABASE_VERSION}`)
}

const ALLOWED_TABLES = new Set(['stations', 'patients', 'dietas', 'comidas', 'pedidos_queue', 'agrupaciones'])

function assertTableAllowed(table: string): void {
  if (!ALLOWED_TABLES.has(table)) {
    throw new Error(`Tabla no permitida: ${table}`)
  }
}

function toBindValue(v: unknown): SQLiteBindValue {
  if (v === null || v === undefined) return null
  if (Array.isArray(v) || typeof v === 'object') return JSON.stringify(v)
  if (typeof v === 'number' || typeof v === 'boolean') return v
  return String(v)
}

export function serializeArray(arr: unknown[]): string {
  return JSON.stringify(arr)
}

export function deserializeArray(val: string): unknown[] {
  try { return JSON.parse(val) } catch { return [] }
}

export async function upsertRows<T>(db: SQLiteDatabase, table: string, rows: T[]): Promise<void> {
  assertTableAllowed(table)
  if (rows.length === 0) return

  const columns = Object.keys(rows[0] as Record<string, unknown>)
  const placeholders = columns.map(() => '?').join(', ')

  for (const row of rows) {
    const r = row as Record<string, unknown>
    const values: SQLiteBindValue[] = columns.map((c) => toBindValue(r[c]))
    await db.runAsync(
      `INSERT OR REPLACE INTO ${table} (${columns.join(', ')}) VALUES (${placeholders})`,
      ...values,
    )
  }
}

export function tryDeserialize<T>(row: T): T {
  const out = { ...row } as Record<string, unknown>
  for (const key in out) {
    const val = out[key]
    if (typeof val === 'string' && (val.startsWith('[') || val.startsWith('{'))) {
      try { out[key] = JSON.parse(val) } catch {}
    }
  }
  return out as T
}

export async function getAllRows<T>(db: SQLiteDatabase, table: string, where?: string, params?: SQLiteBindValue[]): Promise<T[]> {
  assertTableAllowed(table)
  const sql = where ? `SELECT * FROM ${table} WHERE ${where}` : `SELECT * FROM ${table}`
  const rows = await db.getAllAsync<T>(sql, ...(params ?? []))
  return ((rows ?? []) as T[]).map(r => tryDeserialize(r))
}

export async function deleteWhere(db: SQLiteDatabase, table: string, where: string, params: SQLiteBindValue[]): Promise<void> {
  assertTableAllowed(table)
  await db.runAsync(`DELETE FROM ${table} WHERE ${where}`, ...params)
}

const META_TABLE = 'meta'

export async function getMetaValue(db: SQLiteDatabase, key: string): Promise<string | null> {
  const row = await db.getFirstAsync<{ value: string }>(`SELECT value FROM ${META_TABLE} WHERE key = ?`, key)
  return row?.value ?? null
}

export async function setMetaValue(db: SQLiteDatabase, key: string, value: string): Promise<void> {
  await db.runAsync(`INSERT OR REPLACE INTO ${META_TABLE} (key, value) VALUES (?, ?)`, key, value)
}