import { createContext, useState, useCallback, useRef, useMemo, type ReactNode } from 'react'
import { View, Text, StyleSheet, Platform } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import Animated, { useSharedValue, useAnimatedStyle, withTiming, withSequence, runOnJS } from 'react-native-reanimated'
import { Icon, type IconName } from '@/src/shared/atoms/Icon'
import { useColorScheme } from '@/components/useColorScheme'
import Colors from '@/constants/Colors'
import { Typography, space, BorderRadius, zIndex } from '@/src/shared/utils/tokens'

interface ToastConfig {
  message: string
  icon?: IconName
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
  const insets = useSafeAreaInsets()
  const [message, setMessage] = useState('')
  const [icon, setIcon] = useState<IconName | undefined>(undefined)
  const translateY = useSharedValue(TOAST_HEIGHT)
  const toastOpacity = useSharedValue(0)
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  const hide = useCallback(() => {
    toastOpacity.value = withTiming(0, { duration: 200 })
    translateY.value = withTiming(TOAST_HEIGHT, { duration: 200 })
  }, [toastOpacity, translateY])

  const show = useCallback((config: ToastConfig) => {
    if (timerRef.current) clearTimeout(timerRef.current)
    setMessage(config.message)
    setIcon(config.icon)
    toastOpacity.value = withTiming(1, { duration: 200 })
    translateY.value = withTiming(0, { duration: 300 })
    timerRef.current = setTimeout(() => {
      runOnJS(hide)()
    }, config.duration || 3000)
  }, [toastOpacity, translateY, hide])

  const animStyle = useAnimatedStyle(() => ({
    opacity: toastOpacity.value,
    transform: [{ translateY: translateY.value }],
  }))

  const value = useMemo(() => ({ show }), [show])

  return (
    <ToastContext.Provider value={value}>
      {children}
      <Animated.View
        style={[
          styles.toast,
          { backgroundColor: colors.card, bottom: space[4] + insets.bottom },
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
    left: space[4],
    right: space[4],
    height: TOAST_HEIGHT,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[2],
    paddingHorizontal: space[4],
    borderRadius: BorderRadius.md,
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
