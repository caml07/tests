import { openDatabaseAsync, deleteDatabaseAsync, type SQLiteDatabase, type SQLiteBindValue } from 'expo-sqlite'

let _db: SQLiteDatabase | null = null

export function setDb(db: SQLiteDatabase): void {
  _db = db
}

export async function getDb(): Promise<SQLiteDatabase> {
  if (_db) return _db
  _db = await initDatabase()
  return _db
}

export function getDbSync(): SQLiteDatabase | null {
  return _db
}

export async function initDatabase(name = 'nutricion.db'): Promise<SQLiteDatabase> {
  try {
    const db = await openDatabaseAsync(name)
    await migrateDbIfNeeded(db)
    return db
  } catch {
    if (__DEV__) console.warn('[DB] Init failed, wiping database and retrying...')
    await deleteDatabaseAsync(name).catch(() => {})
    const db = await openDatabaseAsync(name)
    await migrateDbIfNeeded(db)
    return db
  }
}

export async function migrateDbIfNeeded(db: SQLiteDatabase) {
  const DATABASE_VERSION = 6
  const result = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version')
  const currentVersion = result?.user_version ?? 0

  if (currentVersion >= DATABASE_VERSION) return

  // v0 → v1: schema inicial
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
        alergias TEXT NOT NULL DEFAULT '[]',
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

  // v1 → v2: columnas faltantes en pedidos_queue
  if (currentVersion < 2) {
    const cols = await db.getAllAsync<{ name: string }>(
      `PRAGMA table_info(pedidos_queue)`
    )
    const existing = new Set(cols.map(c => c.name))

    if (!existing.has('status')) {
      await db.execAsync(
        `ALTER TABLE pedidos_queue ADD COLUMN status TEXT NOT NULL DEFAULT 'PENDING'`
      )
    }
    if (!existing.has('next_attempt_at')) {
      await db.execAsync(
        `ALTER TABLE pedidos_queue ADD COLUMN next_attempt_at TEXT`
      )
    }
    if (!existing.has('idempotency_key')) {
      await db.execAsync(
        `ALTER TABLE pedidos_queue ADD COLUMN idempotency_key TEXT`
      )
    }
  }

  // v2 → v3: tabla agrupaciones + agrupacionId en stations
  if (currentVersion < 3) {
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS agrupaciones (
        id TEXT PRIMARY KEY NOT NULL,
        nombre TEXT NOT NULL,
        icon TEXT NOT NULL DEFAULT ''
      );
    `)
    const stationCols = await db.getAllAsync<{ name: string }>(
      `PRAGMA table_info(stations)`
    )
    const stationExisting = new Set(stationCols.map(c => c.name))
    if (!stationExisting.has('agrupacionId')) {
      await db.execAsync(
        `ALTER TABLE stations ADD COLUMN agrupacionId TEXT NOT NULL DEFAULT ''`
      )
    }
  }

  // v3 → v4: regenerar agrupaciones para BDs que se quedaron sin tabla por migración buggy
  if (currentVersion < 4) {
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS agrupaciones (
        id TEXT PRIMARY KEY NOT NULL,
        nombre TEXT NOT NULL,
        icon TEXT NOT NULL DEFAULT ''
      );
    `)
    const stationCols = await db.getAllAsync<{ name: string }>(
      `PRAGMA table_info(stations)`
    )
    const stationExisting = new Set(stationCols.map(c => c.name))
    if (!stationExisting.has('agrupacionId')) {
      await db.execAsync(
        `ALTER TABLE stations ADD COLUMN agrupacionId TEXT NOT NULL DEFAULT ''`
      )
    }
  }

  // v4 → v5: sexo y edad en patients
  if (currentVersion < 5) {
    const patientCols = await db.getAllAsync<{ name: string }>(
      `PRAGMA table_info(patients)`
    )
    const existing = new Set(patientCols.map(c => c.name))
    if (!existing.has('sexo')) {
      await db.execAsync(
        `ALTER TABLE patients ADD COLUMN sexo TEXT NOT NULL DEFAULT ''`
      )
    }
    if (!existing.has('edad')) {
      await db.execAsync(
        `ALTER TABLE patients ADD COLUMN edad TEXT NOT NULL DEFAULT ''`
      )
    }
  }

  // v5 → v6: tabla meta para sync state (censoHash, etc.)
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
