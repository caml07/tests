import { Redirect } from 'expo-router'
import { LoginScreen } from '@/src/screens/auth/LoginScreen'
import { useAuth } from '@/src/hooks/useAuth'
import { Spinner } from '@/src/components/atoms'

export default function LoginRoute() {
  const { isAuthenticated, isHydrated } = useAuth()

  if (!isHydrated) return <Spinner fullScreen />
  if (isAuthenticated) return <Redirect href="/" />

  return <LoginScreen />
}
