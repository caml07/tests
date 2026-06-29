import { useMemo, useState } from 'react'
import { View, Text, Modal, StyleSheet, KeyboardAvoidingView, Pressable, FlatList } from 'react-native'
import { Button } from '@/src/shared/atoms/Button'
import { Icon } from '@/src/shared/atoms/Icon'
import { BlurWrapper } from '@/src/shared/atoms/BlurWrapper'
import { useColorScheme } from '@/components/useColorScheme'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import Colors from '@/constants/Colors'
import { Typography, BorderRadius, space, Spacing, shadow } from '@/src/shared/utils/tokens'
import { useCartStore } from '@/src/features/cart/store/cartStore'
import { useToast } from '@/src/shared/hooks/useToast'
import type { Patient } from '@/src/shared/types'

interface PatientCartSheetProps {
  visible: boolean
  paciente: Patient
  onClose: () => void
}

export function PatientCartSheet({ visible, paciente, onClose }: PatientCartSheetProps) {
  const colorScheme = useColorScheme()
  const colors = Colors[colorScheme]
  const insets = useSafeAreaInsets()
  const allItems = useCartStore((s) => s.items)
  const removeItem = useCartStore((s) => s.removeItem)
  const removeAll = useCartStore((s) => s.clearByPatient)
  const submitOrder = useCartStore((s) => s.submitOrder)
  const items = useMemo(() => allItems.filter((i) => i.pacienteId === paciente.id), [allItems, paciente.id])
  const [isPending, setIsPending] = useState(false)
  const toast = useToast()

  const handleSubmit = async () => {
    setIsPending(true)
    const result = await submitOrder(paciente.id, paciente.nombre)
    setIsPending(false)
    if (result.success && !result.queued) {
      toast.show({ message: 'Pedido enviado a cocina', icon: 'checkmark.circle.fill' })
      onClose()
    } else if (result.success && result.queued) {
      toast.show({ message: 'Pedido guardado — se enviará cuando haya conexión', icon: 'checkmark.circle.fill' })
      onClose()
    } else {
      toast.show({ message: result.error || 'Error al enviar pedido', icon: 'exclamationmark.triangle.fill' })
    }
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <BlurWrapper intensity={80} tint={colorScheme === 'dark' ? 'dark' : 'light'} style={styles.overlay}>
        <KeyboardAvoidingView behavior="padding" style={styles.overlay}>
          <Pressable style={styles.backdrop} onPress={onClose}>
            <Pressable style={[styles.sheet, { backgroundColor: colors.surfaceAlt, paddingBottom: Math.max(insets.bottom, space[4]) }]} onPress={(e) => e.stopPropagation()}>
              <View style={styles.header}>
                <Text style={[styles.title, { color: colors.text }]}>Carrito</Text>
                <Text style={[styles.patientName, { color: colors.textSecondary }]}>
                  {paciente.nombre} — Hab. {paciente.habitacion}
                </Text>
              </View>

              {items.length === 0 ? (
                <View style={styles.empty}>
                  <Icon name="cart.fill" tintColor={colors.textTertiary} size={32} />
                  <Text style={[styles.emptyText, { color: colors.textTertiary }]}>
                    Carrito vacío
                  </Text>
                </View>
              ) : (
                <FlatList
                  data={items}
                  keyExtractor={(item) => item.id}
                  style={styles.list}
                  renderItem={({ item }) => (
                    <View style={[styles.itemRow, { backgroundColor: colors.card }]}>
                      <View style={styles.itemInfo}>
                        <Text style={[styles.itemName, { color: colors.text }]}>{item.comidaNombre}</Text>
                        <View style={styles.itemMeta}>
                          <Icon
                            name={item.flagHoy ? 'sun.max.fill' : 'moon.fill'}
                            tintColor={colors.textTertiary}
                            size={12}
                          />
                          <Text style={[styles.itemTime, { color: colors.textTertiary }]}>
                            {item.flagHoy ? 'Hoy' : 'Mañana'}
                          </Text>
                          {item.nota ? (
                            <Text style={[styles.itemNota, { color: colors.textSecondary }]} numberOfLines={1}>
                              — {item.nota}
                            </Text>
                          ) : null}
                        </View>
                      </View>
                      <Pressable
                        onPress={() => removeItem(item.id)}
                        style={[styles.removeBtn, { backgroundColor: colors.error + '15' }]}
                      >
                        <Icon name="xmark" tintColor={colors.error} size={14} />
                      </Pressable>
                    </View>
                  )}
                  ItemSeparatorComponent={() => <View style={{ height: Spacing.sm }} />}
                />
              )}

              <View style={styles.footer}>
                <Button
                  title={`Enviar a cocina (${items.length})`}
                  onPress={handleSubmit}
                  loading={isPending}
                  disabled={items.length === 0}
                />
              </View>
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
    maxHeight: '70%',
  },
  header: {
    marginBottom: space[4],
  },
  title: {
    ...Typography.title2,
  },
  patientName: {
    ...Typography.footnote,
    marginTop: space[1],
  },
  list: {
    flexGrow: 0,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: space[4],
    borderRadius: BorderRadius.md,
    gap: space[3],
  },
  itemInfo: {
    flex: 1,
    gap: space[1],
  },
  itemName: {
    ...Typography.body,
    fontWeight: '600',
  },
  itemMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[1],
  },
  itemTime: {
    ...Typography.caption1,
  },
  itemNota: {
    ...Typography.caption1,
    flex: 1,
  },
  removeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  empty: {
    alignItems: 'center',
    paddingVertical: space[12],
    gap: space[3],
  },
  emptyText: {
    ...Typography.body,
  },
  footer: {
    paddingTop: space[5],
  },
})
