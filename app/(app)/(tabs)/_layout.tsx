import { Tabs } from 'expo-router'
import { FloatingTabBar } from '@/src/shared/molecules/FloatingTabBar'
import { useResponsive } from '@/src/shared/hooks/useResponsive'

export default function TabsLayout() {
  const { isTablet } = useResponsive()

  return (
    <Tabs
      tabBar={isTablet ? () => null : props => <FloatingTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tabs.Screen name="index" />
      <Tabs.Screen name="history" />
    </Tabs>
  )
}
