import { useState } from 'react'
import { View, Text, Modal, StyleSheet, KeyboardAvoidingView, Pressable } from 'react-native'
import * as Haptics from 'expo-haptics'
import { BlurWrapper } from '@/src/shared/atoms/BlurWrapper'
import { Chip } from '@/src/shared/atoms/Chip'
import { Input } from '@/src/shared/atoms/Input'
import { Button } from '@/src/shared/atoms/Button'
import { useColorScheme } from '@/components/useColorScheme'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import Colors from '@/constants/Colors'
import { Typography, BorderRadius, space, Spacing } from '@/src/shared/utils/tokens'
import { Comida, Patient } from '@/src/shared/types'
import { useCartStore } from '@/src/features/cart/store/cartStore'

interface AddToCartSheetProps {
  visible: boolean
  comida: Comida
  paciente: Patient
  onClose: () => void
}

export function AddToCartSheet({ visible, comida, paciente, onClose }: AddToCartSheetProps) {
  const colorScheme = useColorScheme()
  const colors = Colors[colorScheme]
  const insets = useSafeAreaInsets()
  const [flagHoy, setFlagHoy] = useState(true)
  const [nota, setNota] = useState('')
  const addItem = useCartStore((s) => s.addItem)

  const handleConfirm = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    addItem({
      comidaId: comida.id,
      comidaNombre: comida.nombre,
      pacienteId: paciente.id,
      pacienteNombre: paciente.nombre,
      flagHoy,
      nota,
    })
    setNota('')
    setFlagHoy(true)
    onClose()
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <BlurWrapper intensity={80} tint={colorScheme === 'dark' ? 'dark' : 'light'} style={styles.overlay}>
        <KeyboardAvoidingView
          behavior="padding"
          style={styles.overlay}
        >
          <Pressable style={styles.backdrop} onPress={onClose}>
            <Pressable style={[styles.sheet, { backgroundColor: colors.surfaceAlt, paddingBottom: Math.max(insets.bottom, space[4]) }]} onPress={(e) => e.stopPropagation()}>
              <Text style={[styles.title, { color: colors.text }]}>{comida.nombre}</Text>

              <View style={styles.row}>
                <Chip label="Hoy" selected={flagHoy} onPress={() => setFlagHoy(true)} />
                <Chip label="Mañana" selected={!flagHoy} onPress={() => setFlagHoy(false)} />
              </View>

              <Input
                label="Notas"
                placeholder="Nota para cocina (ej. sin sal, licuado)..."
                value={nota}
                onChangeText={setNota}
                inputStyle={Typography.italic}
                multiline
              />

              <Button title="Confirmar" onPress={handleConfirm} />
            </Pressable>
          </Pressable>
        </KeyboardAvoidingView>
      </BlurWrapper>
    </Modal>
  )
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
  },
  backdrop: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  sheet: {
    borderTopLeftRadius: BorderRadius.xl2,
    borderTopRightRadius: BorderRadius.xl2,
    paddingHorizontal: Spacing.screen,
    paddingTop: space[6],
    gap: space[5],
  },
  title: {
    ...Typography.title3,
  },
  row: {
    flexDirection: 'row',
    gap: space[3],
  },
})
