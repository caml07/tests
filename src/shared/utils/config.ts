import { Platform } from 'react-native'
import Constants from 'expo-constants'

const API_PORT = 3001

// 1. EXPO_PUBLIC_API_URL env var (seteada en shell antes de npm run android)
// 2. extra.apiUrl en app.json
// 3. localhost:3001 por defecto
const devApiUrl =
  process.env.EXPO_PUBLIC_API_URL ||
  Constants.expoConfig?.extra?.apiUrl ||
  `http://localhost:${API_PORT}`

export const API_BASE = __DEV__
  ? Platform.select({
      android: devApiUrl,
      default: devApiUrl,
    }) || devApiUrl
  : 'https://api.produccion.com'

export const ASSETS_BASE = API_BASE.replace(/\/+$/, '')