import { Stack, Slot } from 'expo-router'
import { useResponsive } from '@/src/shared/hooks/useResponsive'
import { TabletHomeShell } from '@/src/features/layout/screens/TabletHomeShell'

export default function AppLayout() {
  const { isTablet } = useResponsive()

  if (isTablet) {
    return (
      <TabletHomeShell>
        <Slot />
      </TabletHomeShell>
    )
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="paciente/[stationId]" />
      <Stack.Screen name="paciente/[stationId]/[patientId]" />
    </Stack>
  )
}
