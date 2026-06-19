import { useEffect } from 'react'
import Animated, { useAnimatedStyle, useSharedValue, withRepeat, withTiming, interpolate } from 'react-native-reanimated'
import { useColorScheme } from '@/components/useColorScheme'
import Colors from '@/constants/Colors'
import { radius } from '@/src/utils/tokens'

interface SkeletonProps {
  width: number | `${number}%`
  height: number
  borderRadius?: number
}

export function Skeleton({ width, height, borderRadius = radius.sm }: SkeletonProps) {
  const colorScheme = useColorScheme()
  const colors = Colors[colorScheme]
  const opacity = useSharedValue(0.3)

  useEffect(() => {
    opacity.value = withRepeat(
      withTiming(0.8, { duration: 900 }),
      -1,
      true,
    )
  }, [])

  const animStyle = useAnimatedStyle(() => ({
    opacity: interpolate(opacity.value, [0.3, 0.8], [0.3, 0.8]),
  }))

  return (
    <Animated.View
      style={[
        animStyle,
        {
          width,
          height,
          borderRadius,
          backgroundColor: colors.surfaceAlt,
        },
      ]}
    />
  )
}
