import { useEffect, useRef, useState } from 'react'
import { Animated, Platform, StyleSheet } from 'react-native'
import { Stack } from 'expo-router'
import { useFonts } from 'expo-font'
import { useAuthStore } from '@/src/store/authStore'
import { SplashScreen } from '@/src/components/organisms/SplashScreen'
import { ToastProvider } from '@/src/providers/ToastProvider'

export { ErrorBoundary } from 'expo-router'

export default function RootLayout() {
  const { isHydrated, hydrate } = useAuthStore()
  const [splashDone, setSplashDone] = useState(false)
  const splashOpacity = useRef(new Animated.Value(1)).current

  const [fontsLoaded] = useFonts({
    PlusJakartaSans: require('@/assets/fonts/PlusJakartaSans[wght].ttf'),
    'PlusJakartaSans-Italic': require('@/assets/fonts/PlusJakartaSans-Italic[wght].ttf'),
  })

  useEffect(() => {
    hydrate()
  }, [])

  useEffect(() => {
    if (isHydrated && fontsLoaded) {
      Animated.timing(splashOpacity, {
        toValue: 0,
        duration: 400,
        useNativeDriver: Platform.OS !== 'web',
      }).start(() => setSplashDone(true))
    }
  }, [isHydrated, fontsLoaded, splashOpacity])

  return (
    <ToastProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="login" />
      </Stack>
      {!splashDone && (
        <Animated.View
          style={[StyleSheet.absoluteFill, { opacity: splashOpacity, pointerEvents: splashDone ? 'none' : 'auto' }]}
        >
          <SplashScreen />
        </Animated.View>
      )}
    </ToastProvider>
  )
}

