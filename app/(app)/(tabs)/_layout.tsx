import { Tabs } from 'expo-router'
import { FloatingTabBar } from '@/src/shared/molecules/FloatingTabBar'
import { useResponsive } from '@/src/shared/hooks/useResponsive'

export default function TabsLayout() {
  const { isTablet } = useResponsive()

  return (
    <Tabs
      tabBar={props => <FloatingTabBar {...props} />}
      screenOptions={{
        headerShown: false,
        ...(isTablet ? { tabBarStyle: { display: 'none' as const } } : {}),
      }}
    >
      <Tabs.Screen name="index" />
    </Tabs>
  )
}
