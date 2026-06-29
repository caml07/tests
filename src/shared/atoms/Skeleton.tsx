import { useEffect } from 'react'
import Animated, { useAnimatedStyle, useSharedValue, withRepeat, withTiming, cancelAnimation } from 'react-native-reanimated'
import { useColorScheme } from '@/components/useColorScheme'
import Colors from '@/constants/Colors'
import { radius } from '@/src/shared/utils/tokens'

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
      withTiming(0.4, { duration: 1000 }),
      -1,
      true,
    )
    return () => cancelAnimation(opacity)
  }, [])

  const animStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
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
