import type { AuthResponse, Station, Patient, Comida, CartItem, Dieta, Order, Agrupacion, InterfaceResponse, CensoPatient } from '@/src/shared/types'
import { API_BASE, STATIC_TOKEN, INTERFACE_URL, INTERFACE_SYSTEM } from '@/src/shared/utils/config'
import { mmkv } from './mmkvStorage'
import { withDb, tryDeserialize, serializeArray } from './database'
import NetInfo from '@react-native-community/netinfo'

const REQUEST_TIMEOUT = 5000

function getToken(): string | null {
  return mmkv.getString('session-token') ?? null
}

function getUser(): string | null {
  return mmkv.getString('session-user') ?? null
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const token = getToken()
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT)

  try {
    const res = await fetch(`${API_BASE}${path}`, {
      ...options,
      signal: controller.signal,
      headers: { ...headers, ...(options?.headers as Record<string, string>) },
    })
    if (!res.ok) {
      const body = await res.json().catch(() => ({}))
      throw new Error(body.error || `Error ${res.status}`)
    }
    return res.json()
  } finally {
    clearTimeout(timeout)
  }
}

async function interfaceRequest<T>(command: string, extra: Record<string, string> = {}, noAuth = false): Promise<T> {
  const token = getToken()
  const headers: Record<string, string> = { 'Content-Type': 'text/plain; charset=utf-8' }
  if (token && !noAuth) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const body = [{
    strToken: STATIC_TOKEN,
    strInterfaceMsg: command,
    ...extra,
  }]

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT)

  try {
    const res = await fetch(`${INTERFACE_URL}?strSystem=${INTERFACE_SYSTEM}`, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
      signal: controller.signal,
    })
    if (!res.ok) {
      throw new Error(`Error HTTP ${res.status}`)
    }
    const data = await res.json()
    if (data && typeof data === 'object' && !Array.isArray(data) && data.intMsgError && data.intMsgError !== 0) {
      throw new Error(data.strMsg || `Error ${data.intMsgError}`)
    }
    return data
  } finally {
    clearTimeout(timeout)
  }
}

if (__DEV__) console.log('[API] BASE_URL:', API_BASE)

export const api = {
  login: (usuario: string, password: string): Promise<AuthResponse> =>
    interfaceRequest<[AuthResponse]>('login', { strU: usuario, strP: password }, true)
      .then(([res]) => res),

  getCenso: (strU?: string): Promise<[InterfaceResponse<CensoPatient[]>]> =>
    interfaceRequest<[InterfaceResponse<CensoPatient[]>]>('censo', { strU: strU ?? getUser() ?? '', strTokenTransaccion: getToken() ?? '' }),

  getAgrupaciones: async (): Promise<Agrupacion[]> =>
    withDb(db => (db.getAllAsync<Record<string, unknown>>('SELECT * FROM agrupaciones')).then(rows => rows.map(r => tryDeserialize(r) as unknown as Agrupacion))),

  getEstaciones: async (): Promise<Station[]> =>
    withDb(db => (db.getAllAsync<Record<string, unknown>>('SELECT * FROM stations')).then(rows => rows.map(r => tryDeserialize(r) as unknown as Station))),

  getAllPatients: async (): Promise<Patient[]> =>
    withDb(db => (db.getAllAsync<Record<string, unknown>>('SELECT * FROM patients')).then(rows => rows.map(r => tryDeserialize(r) as unknown as Patient))),

  getDietas: async (): Promise<Dieta[]> =>
    withDb(db => (db.getAllAsync<Record<string, unknown>>('SELECT * FROM dietas')).then(rows => rows.map(r => tryDeserialize(r) as unknown as Dieta))),

  getComidas: async (): Promise<Comida[]> =>
    withDb(db => (db.getAllAsync<Record<string, unknown>>('SELECT * FROM comidas')).then(rows => rows.map(r => tryDeserialize(r) as unknown as Comida))),

  getPacientes: async (estacionId: string): Promise<Patient[]> =>
    withDb(db => (db.getAllAsync<Record<string, unknown>>('SELECT * FROM patients WHERE stationId = ?', estacionId)).then(rows => rows.map(r => tryDeserialize(r) as unknown as Patient))),

  getMenu: async (dietaId: string, tiempo: string): Promise<Comida[]> =>
    withDb(db => (db.getAllAsync<Record<string, unknown>>('SELECT * FROM comidas WHERE dietaId = ? AND tiempo = ?', dietaId, tiempo)).then(rows => rows.map(r => tryDeserialize(r) as unknown as Comida))),

  getMenuByDieta: async (dietaId: string): Promise<Comida[]> =>
    withDb(db => (db.getAllAsync<Record<string, unknown>>('SELECT * FROM comidas WHERE dietaId = ?', dietaId)).then(rows => rows.map(r => tryDeserialize(r) as unknown as Comida))),

  getPatient: async (id: string): Promise<Patient | null> =>
    withDb(db => (db.getFirstAsync<Record<string, unknown>>('SELECT * FROM patients WHERE id = ?', id)).then(row => row ? tryDeserialize(row) as unknown as Patient : null)),

  getPedidos: async (): Promise<Order[]> => {
    try { return await request<Order[]>('/pedidos') }
    catch {
      return withDb(db => (db.getAllAsync<Record<string, unknown>>("SELECT * FROM pedidos_queue WHERE status IN ('PENDING', 'local_pending')")).then(rows => rows.map(r => tryDeserialize(r) as unknown as Order)))
    }
  },

  postPedido: async (items: CartItem[], idempotencyKey?: string, skipQueueFallback?: boolean): Promise<Order> => {
    const netState = await NetInfo.fetch().catch(() => ({ isConnected: true } as { isConnected: boolean }))

    if (netState.isConnected) {
      try {
        return await request<Order>('/pedidos', {
          method: 'POST',
          headers: idempotencyKey ? { 'X-Idempotency-Key': idempotencyKey } as Record<string, string> : undefined,
          body: JSON.stringify({
            items,
            pacienteId: items[0]?.pacienteId ?? '',
            timestamp: new Date().toISOString(),
            status: 'sent',
          }),
        })
      } catch (e) {
        if (skipQueueFallback) throw e
      }
    } else if (skipQueueFallback) {
      throw new Error('No hay conexión de red')
    }

    return withDb(async db => {
      const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 12)
      await db.runAsync(
        `INSERT INTO pedidos_queue (id, items, pacienteId, pacienteNombre, timestamp, status, idempotency_key) VALUES (?, ?, ?, ?, ?, 'PENDING', ?)`,
        id,
        serializeArray(items),
        items[0]?.pacienteId ?? '',
        items[0]?.pacienteNombre ?? '',
        new Date().toISOString(),
        idempotencyKey ?? id,
      )
      return {
        id,
        items,
        pacienteId: items[0]?.pacienteId ?? '',
        timestamp: new Date().toISOString(),
        status: 'local_pending',
      }
    })
  },
}