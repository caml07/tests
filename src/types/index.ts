export interface User {
  id: string
  nombre: string
  estaciones: string[]
}

export interface AuthResponse {
  user: User
  token: string
}

export interface LoginCredentials {
  usuario: string
  password: string
}

export interface Station {
  id: string
  nombre: string
}

export interface Patient {
  id: string
  nombre: string
  stationId: string
  habitacion: string
  cama: string
  dietaId: string
  alergias: string[]
  notas: string
}

export interface Dieta {
  id: string
  nombre: string
  tiempos: string[]
  simbolo: string
}

export interface Comida {
  id: string
  dietaId: string
  nombre: string
  tiempo: string
  subcomidas: Subcomida[]
}

export interface Subcomida {
  id: string
  nombre: string
  descripcion: string
  ingredientes: Ingrediente[]
}

export interface Ingrediente {
  id: string
  nombre: string
  descripcion: string
}

export interface CartItem {
  id: string
  comidaId: string
  comidaNombre: string
  pacienteId: string
  pacienteNombre: string
  flagHoy: boolean
  nota: string
}

export interface Order {
  id: string
  items: CartItem[]
  pacienteId: string
  timestamp: string
  status: 'sent' | 'delivered'
}

export type Tiempo = 'D' | 'A' | 'M' | 'C'
