import { Pressable, ViewStyle, AccessibilityRole, Platform } from 'react-native'
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated'
import type { ReactNode } from 'react'
import * as Haptics from 'expo-haptics'
import { spring } from '@/src/utils/tokens'

const AnimatedPressable = Animated.createAnimatedComponent(Pressable)

interface PressableScaleProps {
  onPress?: () => void
  scale?: number
  children: ReactNode
  disabled?: boolean
  accessibilityLabel?: string
  accessibilityRole?: AccessibilityRole
  style?: ViewStyle
}

export function PressableScale({
  onPress,
  scale = 0.97,
  children,
  disabled,
  accessibilityLabel,
  accessibilityRole,
  style,
}: PressableScaleProps) {
  const s = useSharedValue(1)
  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: s.value }],
  }))

  return (
    <AnimatedPressable
      style={[style, animStyle]}
      onPressIn={() => {
        if (!disabled) {
          if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Soft)
          s.value = withSpring(scale, spring.press)
        }
      }}
      onPressOut={() => { s.value = withSpring(1, spring.press) }}
      onPress={onPress}
      disabled={disabled}
      accessibilityLabel={accessibilityLabel}
      accessibilityRole={accessibilityRole}
    >
      {children}
    </AnimatedPressable>
  )
}
