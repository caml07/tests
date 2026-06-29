import { Tabs } from 'expo-router'
import { FloatingTabBar } from '@/src/shared/molecules/FloatingTabBar'

export default function TabsLayout() {
  return (
    <Tabs
      tabBar={props => <FloatingTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tabs.Screen name="index" />
    </Tabs>
  )
}
