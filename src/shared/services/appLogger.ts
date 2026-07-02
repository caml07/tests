import * as FileSystem from 'expo-file-system/legacy'

type LogLevel = 'LOG' | 'WARN' | 'ERROR'

let _lines: string[] = []
let _flushTimer: ReturnType<typeof setTimeout> | null = null
const MAX_LOG_LINES = 5000
const MAX_LOG_FILE_SIZE = 2 * 1024 * 1024 // 2MB

function ts(): string {
  return new Date().toISOString()
}

function write(level: LogLevel, tag: string, msg: string, data?: unknown, extra?: Record<string, unknown>): void {
  const dataStr = data !== undefined ? ' | data=' + JSON.stringify(data).slice(0, 2000) : ''
  const extraStr = extra !== undefined ? ' | extra=' + JSON.stringify(extra).slice(0, 2000) : ''
  const line = `[${ts()}] [${level}] [${tag}] ${msg}${dataStr}${extraStr}`
  _lines.push(line)
  console.log(line)
  scheduleFlush()
}

function scheduleFlush(): void {
  if (_flushTimer) return
  _flushTimer = setTimeout(() => {
    _flushTimer = null
    flush()
  }, 500)
}

async function flush(): Promise<void> {
  if (_lines.length === 0) return
  const batch = _lines.splice(0)
  try {
    const path = FileSystem.documentDirectory + 'app-log.txt'
    let existing = ''
    try { existing = await FileSystem.readAsStringAsync(path) } catch {}
    const all = (existing + batch.join('\n') + '\n').split('\n')
    const trimmed = all.slice(Math.max(0, all.length - MAX_LOG_LINES)).join('\n')
    await FileSystem.writeAsStringAsync(path, trimmed, { encoding: FileSystem.EncodingType.UTF8 })
  } catch {}
}

function formatError(e: unknown): { message: string; stack: string; name: string } {
  if (e instanceof Error) {
    return { message: e.message, stack: e.stack ?? '(no stack)', name: e.name }
  }
  return { message: String(e), stack: '(no stack)', name: 'UnknownError' }
}

export function log(tag: string, msg: string, data?: unknown, extra?: Record<string, unknown>): void { write('LOG', tag, msg, data, extra) }
export function warn(tag: string, msg: string, data?: unknown, extra?: Record<string, unknown>): void { write('WARN', tag, msg, data, extra) }
export function error(tag: string, msg: string, data?: unknown, extra?: Record<string, unknown>): void { write('ERROR', tag, msg, data, extra) }

export async function logErrorDump(db: unknown, e: unknown, context: Record<string, unknown>): Promise<void> {
  const err = formatError(e)
  write('ERROR', 'SYNC', `Error: ${err.message}`, context)
  write('ERROR', 'SYNC', `Stack: ${err.stack}`)
  write('ERROR', 'SYNC', `Error type: ${err.name}`)
  
  // Write detailed crash dump
  try {
    const path = FileSystem.documentDirectory + 'app-log.txt'
    const content = await FileSystem.readAsStringAsync(path)
    const crashPath = FileSystem.documentDirectory + 'crash-dump.txt'
    const header = `=== CRASH DUMP ${new Date().toISOString()} ===\n`
    const contextStr = `\n=== Context: ${JSON.stringify(context, null, 2)} ===\n`
    const errorDetails = `\n=== Error Details ===\nMessage: ${err.message}\nStack: ${err.stack}\nType: ${err.name}\n`
    await FileSystem.writeAsStringAsync(crashPath, header + contextStr + errorDetails + content, { encoding: FileSystem.EncodingType.UTF8 })
  } catch {}

  // Also write DB state if possible
  try {
    const dbStatePath = FileSystem.documentDirectory + 'db-state-dump.json'
    if (db && typeof db === 'object' && 'getAllAsync' in db) {
      const dbRef = db as { getAllAsync: Function }
      const [agrupaciones, stations, patients, meta, pedidos] = await Promise.allSettled([
        dbRef.getAllAsync('SELECT * FROM agrupaciones'),
        dbRef.getAllAsync('SELECT * FROM stations'),
        dbRef.getAllAsync('SELECT * FROM patients'),
        dbRef.getAllAsync('SELECT * FROM meta'),
        dbRef.getAllAsync('SELECT * FROM pedidos_queue'),
      ])
      const state = {
        timestamp: new Date().toISOString(),
        agrupaciones: agrupaciones.status === 'fulfilled' ? agrupaciones.value.length : 'ERROR',
        stations: stations.status === 'fulfilled' ? stations.value.length : 'ERROR',
        patients: patients.status === 'fulfilled' ? patients.value.length : 'ERROR',
        meta: meta.status === 'fulfilled' ? meta.value : 'ERROR',
        pedidos_queue: pedidos.status === 'fulfilled' ? pedidos.value.length : 'ERROR',
      }
      await FileSystem.writeAsStringAsync(dbStatePath, JSON.stringify(state, null, 2), { encoding: FileSystem.EncodingType.UTF8 })
    }
  } catch {}
}

export async function flushLogs(): Promise<void> {
  await flush()
}

export async function getLogPath(): Promise<string> {
  return FileSystem.documentDirectory + 'app-log.txt'
}