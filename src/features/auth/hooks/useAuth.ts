import { useShallow } from 'zustand/react/shallow'
import { useAuthStore } from '@/src/features/auth/store/authStore'
import { useStationStore } from '@/src/features/stations/store/stationStore'
import { LoginCredentials } from '@/src/shared/types'

export function useAuth() {
  const { user, token, isAuthenticated, isLoading, error, login, logout, clearError } =
    useAuthStore(
      useShallow((s) => ({
        user: s.user,
        token: s.token,
        isAuthenticated: s.isAuthenticated,
        isLoading: s.isLoading,
        error: s.error,
        login: s.login,
        logout: s.logout,
        clearError: s.clearError,
      }))
    )

  const handleLogout = async () => {
    await logout()
    useStationStore.getState().clearSelection()
  }

  return {
    user,
    token,
    isAuthenticated,
    isLoading,
    error,
    login: (credentials: LoginCredentials, rememberMe?: boolean) => login(credentials, rememberMe),
    logout: handleLogout,
    clearError,
  }
}
