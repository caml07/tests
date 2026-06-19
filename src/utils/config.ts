import { Platform } from 'react-native'

// Si estás en simulador/emulador, localhost funciona.
// Si estás en Expo Go en celu real, cambiá LOCAL_IP por la IP de tu compu.
// Para saber tu IP: Windows → ipconfig | busca "IPv4"
const LOCAL_IP = 'localhost'

const API_PORT = 3001

export const API_BASE = Platform.select({
  android: `http://${LOCAL_IP === 'localhost' ? '10.0.2.2' : LOCAL_IP}:${API_PORT}`,
  default: `http://${LOCAL_IP}:${API_PORT}`,
})
