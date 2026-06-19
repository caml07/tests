import { Redirect, Stack } from 'expo-router'
import { useAuth } from '@/src/hooks/useAuth'
import { Spinner } from '@/src/components/atoms'

export default function AppLayout() {
  const { isAuthenticated, isHydrated } = useAuth()

  if (!isHydrated) return <Spinner fullScreen />
  if (!isAuthenticated) return <Redirect href="/login" />

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
    </Stack>
  )
}
