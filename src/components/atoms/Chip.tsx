import { Text, StyleSheet, Pressable, Platform } from 'react-native'
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated'
import * as Haptics from 'expo-haptics'
import { useColorScheme } from '@/components/useColorScheme'
import Colors from '@/constants/Colors'
import { Typography, BorderRadius, space, spring } from '@/src/utils/tokens'

const AnimatedPressable = Animated.createAnimatedComponent(Pressable)

interface ChipProps {
  label: string
  selected?: boolean
  onPress?: () => void
}

export function Chip({ label, selected = false, onPress }: ChipProps) {
  const colorScheme = useColorScheme()
  const colors = Colors[colorScheme]
  const scale = useSharedValue(1)

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }))

  return (
    <AnimatedPressable
      style={[
        styles.chip,
        {
          backgroundColor: selected ? colors.primary : colors.card,
          borderColor: selected ? colors.primary : colors.border,
        },
        animStyle,
      ]}
      onPressIn={() => {
        if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Soft)
        scale.value = withSpring(0.95, spring.press)
      }}
      onPressOut={() => { scale.value = withSpring(1, spring.press) }}
      onPress={onPress}
    >
      <Text
        style={[
          styles.label,
          { color: selected ? colors.white : colors.textSecondary },
        ]}
      >
        {label}
      </Text>
    </AnimatedPressable>
  )
}

const styles = StyleSheet.create({
  chip: {
    minHeight: 36,
    paddingHorizontal: space[4],
    borderRadius: BorderRadius.full,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    ...Typography.subhead,
    fontWeight: '600',
  },
})
