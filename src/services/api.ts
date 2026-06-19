import { LoginCredentials, AuthResponse, Station, Patient, Comida, CartItem, Dieta } from '@/src/types'
import { API_BASE } from '@/src/utils/config'

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.error || `Error ${res.status}`)
  }
  return res.json()
}

export const api = {
  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    const nurses = await request<Array<{ id: string; nombre: string; usuario: string; password: string; estaciones: string[] }>>('/nurses')
    const nurse = nurses.find(n => n.usuario === credentials.usuario && n.password === credentials.password)
    if (!nurse) {
      throw new Error('Usuario o contraseña incorrectos')
    }
    const token = `mock-token-${nurse.id}-${Date.now()}`
    return {
      user: { id: nurse.id, nombre: nurse.nombre, estaciones: nurse.estaciones },
      token,
    }
  },

  getEstaciones: () => request<Station[]>('/stations'),

  getDietas: () => request<Dieta[]>('/dietas'),

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

  postPedido: (items: CartItem[], token: string) =>
    request<{ ok: boolean }>('/pedidos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ items, createdAt: new Date().toISOString() }),
    }),
}
