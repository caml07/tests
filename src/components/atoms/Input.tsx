import { useState, useRef, useEffect } from 'react'
import { View, TextInput, Text, StyleSheet, TextInputProps } from 'react-native'
import Animated, { useSharedValue, useAnimatedStyle, withTiming, interpolateColor } from 'react-native-reanimated'
import { Icon } from '@/src/components/atoms/Icon'
import Colors from '@/constants/Colors'
import { useColorScheme } from '@/components/useColorScheme'
import { BorderRadius, Typography, space } from '@/src/utils/tokens'

interface InputProps extends TextInputProps {
  label: string
  error?: string
  leftIcon?: string
}

export function Input({ label, error, leftIcon, style, ...props }: InputProps) {
  const colorScheme = useColorScheme()
  const colors = Colors[colorScheme]
  const focusAnim = useSharedValue(0)
  const errorAnim = useSharedValue(error ? 1 : 0)
  const prevError = useRef(error)

  useEffect(() => {
    if (!!error !== !!prevError.current) {
      errorAnim.value = withTiming(error ? 1 : 0, { duration: 200 })
    }
    prevError.current = error
  }, [error, errorAnim])

  const handleFocus = () => {
    focusAnim.value = withTiming(1, { duration: 200 })
  }

  const handleBlur = () => {
    focusAnim.value = withTiming(0, { duration: 200 })
  }

  const wrapperStyle = useAnimatedStyle(() => {
    const errorColor = interpolateColor(errorAnim.value, [0, 1], [colors.border, colors.error])
    const focusColor = interpolateColor(focusAnim.value, [0, 1], [errorColor as string, colors.primary])
    return { borderColor: focusColor }
  })

  const iconColor = focusAnim.value === 1 || (props.value && props.value.length > 0)
    ? colors.primary
    : colors.textTertiary

  return (
    <View style={styles.container}>
      <Text style={[styles.label, { color: colors.textSecondary }]}>{label}</Text>
      <Animated.View style={[styles.inputWrapper, wrapperStyle]}>
        {leftIcon && (
          <View style={styles.iconSlot}>
            <Icon name={leftIcon as any} tintColor={iconColor} size={18} />
          </View>
        )}
        <TextInput
          style={[
            styles.input,
            {
              backgroundColor: colors.card,
              color: colors.text,
            },
            style,
          ]}
          placeholderTextColor={colors.textTertiary}
          accessibilityLabel={label}
          accessibilityHint={error || `Ingrese su ${label.toLowerCase()}`}
          onFocus={handleFocus}
          onBlur={handleBlur}
          {...props}
        />
      </Animated.View>
      {error ? (
        <Text
          style={[styles.error, { color: colors.error }]}
          accessibilityLiveRegion="polite"
        >
          {error}
        </Text>
      ) : null}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    gap: space[1],
  },
  label: {
    ...Typography.label,
  },
  inputWrapper: {
    borderRadius: BorderRadius.md,
    borderWidth: 1.5,
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconSlot: {
    paddingLeft: space[3],
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  input: {
    height: 52,
    ...Typography.body,
    minWidth: 44,
    borderRadius: BorderRadius.md,
    flex: 1,
  },
  error: {
    ...Typography.footnote,
    marginTop: space[0],
  },
})
