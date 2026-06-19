import { Modal, View, Text, Pressable, StyleSheet, Platform } from 'react-native'
import * as Haptics from 'expo-haptics'
import { Icon } from '@/src/components/atoms/Icon'
import { Gesture, GestureDetector } from 'react-native-gesture-handler'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  runOnJS,
} from 'react-native-reanimated'
import { useColorScheme } from '@/components/useColorScheme'
import Colors from '@/constants/Colors'
import { space, Typography, BorderRadius, zIndex, spring, color } from '@/src/utils/tokens'

interface BottomSheetProps {
  visible: boolean
  title: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  destructive?: boolean
  onConfirm?: () => void
  onCancel?: () => void
}

const SHEET_HEIGHT = 280

export function BottomSheet({
  visible,
  title,
  message,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  destructive,
  onConfirm,
  onCancel,
}: BottomSheetProps) {
  const colorScheme = useColorScheme()
  const colors = Colors[colorScheme]
  const translateY = useSharedValue(SHEET_HEIGHT)

  const closeSheet = (callback?: () => void) => {
    translateY.value = withSpring(SHEET_HEIGHT, spring.gentle)
    if (callback) {
      setTimeout(() => runOnJS(callback)(), 200)
    }
  }

  const gesture = Gesture.Pan()
    .onBegin(() => {
      if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Soft)
    })
    .onChange((e) => {
      if (e.translationY > 0) {
        translateY.value = e.translationY
      }
    })
    .onEnd((e) => {
      if (e.translationY > 100) {
        translateY.value = withSpring(SHEET_HEIGHT, spring.gentle)
        if (onCancel) runOnJS(onCancel)()
      } else {
        translateY.value = withSpring(0, spring.gentle)
      }
    })

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }))

  const overlayStyle = useAnimatedStyle(() => ({
    opacity: 1 - (translateY.value / SHEET_HEIGHT),
  }))

  return (
    <Modal transparent visible={visible} animationType="none" onRequestClose={onCancel}>
      <Animated.View style={[styles.overlay, { backgroundColor: colors.overlay }, overlayStyle]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={() => closeSheet(onCancel)} />
      </Animated.View>
      <GestureDetector gesture={gesture}>
        <Animated.View style={[styles.sheet, { backgroundColor: colors.card }, sheetStyle]}>
          <View style={[styles.handle, { backgroundColor: colors.borderStrong }]} />
          <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.message, { color: colors.textSecondary }]}>{message}</Text>
          <View style={styles.actions}>
            <Pressable
              onPress={() => closeSheet(onCancel)}
              style={[styles.cancelBtn, { backgroundColor: colors.surfaceAlt }]}
            >
              <View style={styles.btnInner}>
                <Icon name="xmark" tintColor={colors.textSecondary} size={16} />
                <Text style={[styles.cancelText, { color: colors.text }]}>{cancelLabel}</Text>
              </View>
            </Pressable>
            <Pressable
              onPress={() => closeSheet(onConfirm)}
              style={[
                styles.confirmBtn,
                { backgroundColor: destructive ? colors.error : colors.primary },
              ]}
            >
              <View style={styles.btnInner}>
                <Icon name="checkmark.circle.fill" tintColor={color.white} size={16} />
                <Text style={styles.confirmText}>{confirmLabel}</Text>
              </View>
            </Pressable>
          </View>
        </Animated.View>
      </GestureDetector>
    </Modal>
  )
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    zIndex: zIndex.overlay,
  },
  sheet: {
    borderTopLeftRadius: BorderRadius.xl2,
    borderTopRightRadius: BorderRadius.xl2,
    padding: space[6],
    paddingTop: space[3],
    gap: space[2],
    zIndex: zIndex.modal,
  },
  handle: {
    width: 36,
    height: 5,
    borderRadius: BorderRadius.full,
    alignSelf: 'center',
    marginBottom: space[1],
  },
  title: {
    ...Typography.title3,
  },
  message: {
    ...Typography.body,
  },
  actions: {
    flexDirection: 'row',
    gap: space[2],
    marginTop: space[2],
  },
  cancelBtn: {
    flex: 1,
    padding: space[4],
    borderRadius: BorderRadius.md,
    alignItems: 'center',
  },
  cancelText: {
    ...Typography.button,
  },
  confirmBtn: {
    flex: 1,
    padding: space[4],
    borderRadius: BorderRadius.md,
    alignItems: 'center',
  },
  confirmText: {
    ...Typography.button,
    color: color.white,
  },
  btnInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[2],
  },
})
