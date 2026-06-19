import { useAuthStore } from '@/src/store/authStore'
import { LoginCredentials } from '@/src/types'

export function useAuth() {
  const { user, token, isAuthenticated, isHydrated, isLoading, error, login, logout, clearError } =
    useAuthStore()

  return {
    user,
    token,
    isAuthenticated,
    isHydrated,
    isLoading,
    error,
    login: (credentials: LoginCredentials, rememberMe?: boolean) => login(credentials, rememberMe),
    logout,
    clearError,
  }
}
