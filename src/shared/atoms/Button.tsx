import { View, Text, StyleSheet, ActivityIndicator, ViewStyle, Pressable, Platform } from 'react-native'
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated'
import * as Haptics from 'expo-haptics'
import { Icon, type IconName } from '@/src/shared/atoms/Icon'
import Colors from '@/constants/Colors'
import { useColorScheme } from '@/components/useColorScheme'
import { Typography, BorderRadius, spring, space, color } from '@/src/shared/utils/tokens'

const AnimatedPressable = Animated.createAnimatedComponent(Pressable)

type Variant = 'primary' | 'secondary' | 'ghost' | 'destructive'

interface ButtonProps {
  title: string
  icon?: IconName
  onPress: () => void
  variant?: Variant
  loading?: boolean
  disabled?: boolean
  style?: ViewStyle
  accessibilityLabel?: string
}

export function Button({
  title,
  icon: iconName,
  onPress,
  variant = 'primary',
  loading = false,
  disabled = false,
  style,
  accessibilityLabel,
}: ButtonProps) {
  const colorScheme = useColorScheme()
  const colors = Colors[colorScheme]
  const scale = useSharedValue(1)

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: disabled ? 0.5 : 1,
  }))

  const bg: Record<Variant, string> = {
    primary: colors.primary,
    secondary: colors.surfaceAlt,
    ghost: color.transparent,
    destructive: colors.error,
  }

  const textColor: Record<Variant, string> = {
    primary: colors.white,
    secondary: colors.text,
    ghost: colors.primary,
    destructive: colors.white,
  }

  return (
    <AnimatedPressable
      style={[styles.base, { backgroundColor: bg[variant], borderRadius: BorderRadius.md }, animStyle, style]}
      onPressIn={() => {
        if (!disabled) {
          if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Soft)
          scale.value = withSpring(0.96, spring.press)
        }
      }}
      onPressOut={() => { scale.value = withSpring(1, spring.press) }}
      onPress={disabled || loading ? undefined : onPress}
      disabled={disabled || loading}
      accessible
      accessibilityLabel={accessibilityLabel || title}
      accessibilityRole="button"
      accessibilityState={{ disabled: disabled || loading }}
    >
      {loading ? (
        <ActivityIndicator color={textColor[variant]} size="small" />
      ) : (
        <View style={[styles.content, iconName && { gap: space[2] }]}>
          {iconName && <Icon name={iconName} tintColor={textColor[variant]} size={20} />}
          <Text style={[styles.text, { color: textColor[variant] }]}>{title}</Text>
        </View>
      )}
    </AnimatedPressable>
  )
}

const styles = StyleSheet.create({
  base: {
    minHeight: 56,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: space[6],
    minWidth: 44,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    ...Typography.button,
  },
})
