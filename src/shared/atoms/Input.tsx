import { useState, useRef, useEffect } from 'react'
import { View, TextInput, Text, StyleSheet, TextInputProps, type StyleProp, type TextStyle } from 'react-native'
import Animated, { useSharedValue, useAnimatedStyle, withTiming, interpolateColor } from 'react-native-reanimated'
import { Icon, type IconName } from '@/src/shared/atoms/Icon'
import Colors from '@/constants/Colors'
import { useColorScheme } from '@/components/useColorScheme'
import { BorderRadius, Typography, space } from '@/src/shared/utils/tokens'

interface InputProps extends TextInputProps {
  label: string
  error?: string
  leftIcon?: IconName
  inputStyle?: StyleProp<TextStyle>
}

export function Input({ label, error, leftIcon, style, inputStyle, multiline, ...props }: InputProps) {
  const colorScheme = useColorScheme()
  const colors = Colors[colorScheme]
  const [isFocused, setIsFocused] = useState(false)
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
    setIsFocused(true)
    focusAnim.value = withTiming(1, { duration: 200 })
  }

  const handleBlur = () => {
    setIsFocused(false)
    focusAnim.value = withTiming(0, { duration: 200 })
  }

  const wrapperStyle = useAnimatedStyle(() => {
    const errorColor = interpolateColor(errorAnim.value, [0, 1], [colors.surfaceAlt, colors.error])
    const focusColor = interpolateColor(focusAnim.value, [0, 1], [errorColor as string, colors.primary])
    return { borderColor: focusColor }
  })

  const iconColor = isFocused || (props.value && props.value.length > 0)
    ? colors.primary
    : colors.textTertiary

  return (
    <View style={styles.container}>
      <Text style={[styles.label, { color: colors.textSecondary }]}>{label}</Text>
      <Animated.View style={[styles.inputWrapper, { backgroundColor: colors.card }, wrapperStyle]}>
        {leftIcon && (
          <View style={styles.iconSlot}>
            <Icon name={leftIcon} tintColor={iconColor} size={18} />
          </View>
        )}
        <TextInput
          style={[
            styles.input,
            {
              color: colors.text,
              backgroundColor: 'transparent',
              ...(multiline ? { textAlignVertical: 'top' as const } : {}),
            },
            inputStyle,
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
    ...Typography.subhead,
  },
  inputWrapper: {
    borderRadius: BorderRadius.md,
    borderWidth: 1.5,
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconSlot: {
    paddingLeft: space[3],
    paddingVertical: space[3],
    justifyContent: 'center',
    alignItems: 'center',
  },
  input: {
    minHeight: 44,
    ...Typography.body,
    minWidth: 44,
    borderRadius: BorderRadius.md,
    flex: 1,
  },
  error: {
    ...Typography.footnote,
  },
})
