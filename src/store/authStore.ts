import { create } from 'zustand'
import { User, LoginCredentials } from '@/src/types'
import { api } from '@/src/services/api'
import { storage } from '@/src/services/storage'

interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  isHydrated: boolean
  isLoading: boolean
  error: string | null
  login: (credentials: LoginCredentials, rememberMe?: boolean) => Promise<void>
  logout: () => Promise<void>
  hydrate: () => Promise<void>
  clearError: () => void
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  isHydrated: false,
  isLoading: false,
  error: null,

  login: async (credentials: LoginCredentials, rememberMe?: boolean) => {
    set({ isLoading: true, error: null })
    try {
      const { user, token } = await api.login(credentials)
      if (rememberMe) {
        await storage.saveAuth(token, user)
      }
      set({ user, token, isAuthenticated: true, isLoading: false })
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Error de conexión'
      set({ error: message, isLoading: false })
    }
  },

  logout: async () => {
    await storage.clearAuth()
    set({ user: null, token: null, isAuthenticated: false })
  },

  hydrate: async () => {
    try {
      const auth = await storage.getAuth()
      if (auth) {
        set({ user: auth.user, token: auth.token, isAuthenticated: true, isHydrated: true })
      } else {
        set({ isHydrated: true })
      }
    } catch {
      set({ isHydrated: true })
    }
  },

  clearError: () => set({ error: null }),
}))
