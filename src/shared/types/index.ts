export interface User {
  id: string
  nombre: string
  estaciones?: string[]
}

export interface AuthResponse {
  strTokenTransaccion: string
  strU: string
}

export interface LoginCredentials {
  usuario: string
  password: string
}

export interface Agrupacion {
  id: string
  nombre: string
  icon: string
}

export interface Station {
  id: string
  nombre: string
  agrupacionId: string
}

export interface Patient {
  id: string
  nombre: string
  stationId: string
  habitacion: string
  cama: string
  dietaId: string
  alergias: ParsedAlergia[]
  notas: string
  decPaciente?: number
  sexo?: string
  edad?: string
}

export interface ParsedAlergia {
  drug: string
  reaction: string
  raw: string
  lines: string[]
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
  createdAt: string
}

export interface Order {
  id: string
  items: CartItem[]
  pacienteId: string
  timestamp: string
  status: 'sent' | 'en_cocina' | 'local_pending'
}

export interface InterfaceResponse<T> {
  strMsg: string
  strMsgType: string
  strTokenTransaccion?: string
  intMsgError: number
  datResponse?: string
  listCenso?: T
}

export interface CensoPatient {
  decId?: number
  intCompany?: number
  intFacility?: number
  strEstacion: string
  decPaciente: number
  decCuenta: number
  strPaciente: string
  strPacienteNombresApellidos: string
  datNacimiento?: string
  strAreaServicio: string
  datAdmision?: string
  strEstadia?: string
  intEdad?: number
  intDoctor?: number
  strDoctor?: string
  intSeguro?: number
  intHabitacion: number
  intCama: number
  strSexo: string
  strSeguro?: string
  strEdad: string
  intAgrupacion: number
  strAgrupacion: string
  intAlmacen?: number
  strCeco?: string
  strInterconsultantes?: string
  bitRiesgoCaida?: boolean
  bitInfeccion?: boolean
  bitRiesgoInfeccion?: boolean
  bitAlergia?: boolean
  bitPacientesAR?: boolean
  bitPsiquiatra?: boolean
  intRecordMedico?: number
  strFacilidad?: string
  decPeso?: number
  decTalla?: number
  decSaldo?: number
  intFacturaTEMP?: number
  strMotivoConsulta: string
  strNivelTriage?: string
  strNivelTriageCOLOR?: string
  intNivelTriage?: number
  strAlergias: string
  strRiesgoCaidas?: string
  strSolicitudAlta?: string
  strPsiquiatrico?: string
  strPacienteAltoRiesgo?: string
  strRiesgoInfeccion?: string
  strInfeccioso?: string
  strNoRCP?: string
}

