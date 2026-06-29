import { LoginCredentials, AuthResponse, Station, Patient, Comida, CartItem, Dieta, Order } from '@/src/shared/types'
import { API_BASE } from '@/src/shared/utils/config'
import { mmkv } from './mmkvStorage'

const REQUEST_TIMEOUT = 30000

function getToken(): string | null {
  try {
    const raw = mmkv.getString('auth-storage')
    if (!raw) return null
    return JSON.parse(raw).state.token ?? null
  } catch {
    return null
  }
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

if (__DEV__) console.log('[API] BASE_URL:', API_BASE)

export const api = {
  login: (credentials: LoginCredentials): Promise<AuthResponse> =>
    request<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    }),

  getEstaciones: () => request<Station[]>('/stations'),

  getAllPatients: () => request<Patient[]>('/patients'),

  getDietas: () => request<Dieta[]>('/dietas'),

  getComidas: () => request<Comida[]>('/comidas'),

  getPacientes: async (estacionId: string): Promise<Patient[]> => {
    const pacientes = await request<Patient[]>('/patients')
    return pacientes.filter(p => p.stationId === estacionId)
  },

  getMenu: async (dietaId: string, tiempo: string): Promise<Comida[]> => {
    const comidas = await request<Comida[]>('/comidas')
    return comidas.filter(c => c.dietaId === dietaId && c.tiempo === tiempo)
  },

  getMenuByDieta: async (dietaId: string): Promise<Comida[]> => {
    const comidas = await request<Comida[]>('/comidas')
    return comidas.filter(c => c.dietaId === dietaId)
  },

  getPatient: async (id: string): Promise<Patient | null> => {
    const pacientes = await request<Patient[]>('/patients')
    return pacientes.find(p => p.id === id) || null
  },

  getPedidos: () => request<Order[]>('/pedidos'),

  postPedido: (items: CartItem[], idempotencyKey?: string) =>
    request<Order>('/pedidos', {
      method: 'POST',
      headers: idempotencyKey ? { 'X-Idempotency-Key': idempotencyKey } as Record<string, string> : undefined,
      body: JSON.stringify({
        items,
        pacienteId: items[0]?.pacienteId ?? '',
        timestamp: new Date().toISOString(),
        status: 'sent',
      }),
    }),
}
