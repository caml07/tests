import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { User, LoginCredentials } from '@/src/shared/types'
import { login as authLogin } from '@/src/features/auth/services/authService'
import { mmkv, zustandStorage } from '@/src/shared/services/mmkvStorage'

const SESSION_TOKEN_KEY = 'session-token'

interface PersistedAuth {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  _shouldPersist: boolean
  biometricEnabled?: boolean
}

interface AuthState extends PersistedAuth {
  isLoading: boolean
  error: string | null
  login: (cred: LoginCredentials, rememberMe?: boolean) => Promise<void>
  logout: () => Promise<void>
  clearError: () => void
  setBiometricEnabled: (v: boolean) => Promise<void>
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      _shouldPersist: false,
      biometricEnabled: false,
      isLoading: false,
      error: null,
      login: async (cred, rememberMe = false) => {
        set({ isLoading: true, error: null })
        try {
          const result = await authLogin(cred)
          if (__DEV__) console.log('[LOGIN-RESPONSE]', JSON.stringify(result))
          const { strTokenTransaccion } = result
          const usuario = cred.usuario

          if (strTokenTransaccion) mmkv.set(SESSION_TOKEN_KEY, strTokenTransaccion)
          if (usuario) mmkv.set('session-user', usuario)

          const existingBiometricToken = mmkv.getString('biometric-auth-token')
          if (existingBiometricToken) {
            mmkv.remove('biometric-auth-token')
          }

          set({ user: { id: usuario, nombre: usuario }, token: strTokenTransaccion, isAuthenticated: true, isLoading: false, _shouldPersist: rememberMe })
        } catch (e) {
          const msg = e instanceof Error ? e.message : 'Error de conexion'
          set({ error: msg, isLoading: false })
        }
      },
      logout: async () => {
        mmkv.remove(SESSION_TOKEN_KEY)
        mmkv.remove('session-user')
        mmkv.remove('biometric-auth-token')
        set({ user: null, token: null, isAuthenticated: false, _shouldPersist: false, biometricEnabled: false })
      },
      clearError: () => set({ error: null }),
      setBiometricEnabled: async (v) => {
        const { token } = get()
        if (v && token) {
          mmkv.set('biometric-auth-token', token)
        } else {
          mmkv.remove('biometric-auth-token')
        }
        set({ biometricEnabled: v })
      },
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => zustandStorage),
      partialize: (s) => ({
        biometricEnabled: s.biometricEnabled,
        ...(s.isAuthenticated && s._shouldPersist
          ? {
              user: s.user,
              token: s.token,
              isAuthenticated: s.isAuthenticated,
              _shouldPersist: true,
            }
          : {}),
      }),
    },
  ),
)
