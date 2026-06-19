import { Tabs } from 'expo-router'
import { Icon } from '@/src/components/atoms/Icon'
import Colors from '@/constants/Colors'
import { useColorScheme } from '@/components/useColorScheme'
import { CustomTabBar } from '@/src/components/organisms/CustomTabBar'

export default function TabsLayout() {
  const colorScheme = useColorScheme()
  const colors = Colors[colorScheme]

  return (
    <Tabs
      tabBar={CustomTabBar}
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textTertiary,
        headerStyle: { backgroundColor: colors.surface },
        headerTintColor: colors.text,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Estación',
          tabBarIcon: ({ color }) => (
            <Icon name="building.2.fill" tintColor={color} size={24} />
          ),
        }}
      />
      <Tabs.Screen
        name="cart"
        options={{
          title: 'Carrito',
          tabBarIcon: ({ color }) => (
            <Icon name="cart.fill" tintColor={color} size={24} />
          ),
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: 'Historial',
          tabBarIcon: ({ color }) => (
            <Icon name="clock.fill" tintColor={color} size={24} />
          ),
        }}
      />
    </Tabs>
  )
}
