import { useAuthStore } from '@/src/features/auth/store/authStore'
import { useStationStore } from '@/src/features/stations/store/stationStore'
import { LoginCredentials } from '@/src/shared/types'

export function useAuth() {
  const { user, token, isAuthenticated, isLoading, error, login, logout, clearError } =
    useAuthStore()

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
