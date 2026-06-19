import AsyncStorage from '@react-native-async-storage/async-storage'
import { User } from '@/src/types'

const AUTH_KEY = '@dietas:auth'

export const storage = {
  saveAuth: async (token: string, user: User): Promise<void> => {
    await AsyncStorage.setItem(AUTH_KEY, JSON.stringify({ token, user }))
  },

  getAuth: async (): Promise<{ token: string; user: User } | null> => {
    const raw = await AsyncStorage.getItem(AUTH_KEY)
    return raw ? JSON.parse(raw) : null
  },

  clearAuth: async (): Promise<void> => {
    await AsyncStorage.removeItem(AUTH_KEY)
  },
}
