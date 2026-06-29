import { useEffect } from 'react'
import { Text, StyleSheet } from 'react-native'
import Animated, { useSharedValue, useAnimatedStyle, withTiming, withSequence } from 'react-native-reanimated'
import { useNetInfo } from '@react-native-community/netinfo'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Typography, zIndex } from '@/src/shared/utils/tokens'

const BANNER_HEIGHT = 22

export function ConnectivityBanner() {
  const insets = useSafeAreaInsets()
  const netInfo = useNetInfo()
  const isLoading = netInfo.isConnected === null
  const isConnected = netInfo.isConnected ?? false
  const totalHeight = BANNER_HEIGHT + insets.top
  const translateY = useSharedValue(-totalHeight)

  const show = !isLoading && !isConnected

  useEffect(() => {
    translateY.value = show
      ? withSequence(
          withTiming(-totalHeight, { duration: 0 }),
          withTiming(0, { duration: 300 }),
        )
      : withTiming(-totalHeight, { duration: 300 })
  }, [show, translateY, totalHeight])

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }))

  if (isLoading) return null

  return (
    <Animated.View
      style={[styles.banner, { height: totalHeight, paddingTop: insets.top }, animStyle]}
      accessibilityRole="alert"
      accessibilityLiveRegion="polite"
    >
      <Text style={styles.text}>Sin conexión — los pedidos se guardarán localmente</Text>
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  banner: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(220, 38, 38, 0.9)',
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingBottom: 2,
    zIndex: zIndex.toast + 1,
  },
  text: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '600',
  },
})
