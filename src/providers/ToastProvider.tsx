import { createContext, useState, useCallback, useRef, type ReactNode } from 'react'
import { View, Text, StyleSheet, Platform } from 'react-native'
import Animated, { useSharedValue, useAnimatedStyle, withTiming, runOnJS } from 'react-native-reanimated'
import { Icon } from '@/src/components/atoms/Icon'
import { useColorScheme } from '@/components/useColorScheme'
import Colors from '@/constants/Colors'
import { Typography, space, BorderRadius, zIndex } from '@/src/utils/tokens'

interface ToastConfig {
  message: string
  icon?: string
  duration?: number
}

interface ToastContextValue {
  show: (config: ToastConfig) => void
}

export const ToastContext = createContext<ToastContextValue>({ show: () => {} })

const TOAST_HEIGHT = 60

export function ToastProvider({ children }: { children: ReactNode }) {
  const colorScheme = useColorScheme()
  const colors = Colors[colorScheme]
  const [message, setMessage] = useState('')
  const [icon, setIcon] = useState<string | undefined>(undefined)
  const translateY = useSharedValue(TOAST_HEIGHT)
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  const hide = useCallback(() => {
    translateY.value = withTiming(TOAST_HEIGHT, { duration: 250 })
  }, [translateY])

  const show = useCallback((config: ToastConfig) => {
    if (timerRef.current) clearTimeout(timerRef.current)
    setMessage(config.message)
    setIcon(config.icon)
    translateY.value = withTiming(0, { duration: 300 })
    timerRef.current = setTimeout(() => {
      runOnJS(hide)()
    }, config.duration || 3000)
  }, [translateY, hide])

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }))

  return (
    <ToastContext.Provider value={{ show }}>
      {children}
      <Animated.View
        style={[
          styles.toast,
          { backgroundColor: colors.card, borderColor: colors.border },
          animStyle,
        ]}
        pointerEvents="none"
      >
        {icon && <Icon name={icon} tintColor={colors.primary} size={20} />}
        <Text style={[styles.message, { color: colors.text }]} numberOfLines={2}>
          {message}
        </Text>
      </Animated.View>
    </ToastContext.Provider>
  )
}

const styles = StyleSheet.create({
  toast: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 100 : 80,
    left: space[4],
    right: space[4],
    height: TOAST_HEIGHT,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[2],
    paddingHorizontal: space[4],
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    zIndex: zIndex.toast,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
      },
      android: { elevation: 6 },
      default: {},
    }),
  },
  message: {
    ...Typography.subhead,
    flex: 1,
  },
})
