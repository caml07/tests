import { useMemo, useState, useCallback } from 'react'
import { useFocusEffect } from 'expo-router'
import { View, Text, Modal, StyleSheet, Pressable, FlatList, KeyboardAvoidingView } from 'react-native'
import { BlurWrapper } from '@/src/shared/atoms/BlurWrapper'
import * as Haptics from 'expo-haptics'
import { useQuery } from '@tanstack/react-query'
import { Icon } from '@/src/shared/atoms/Icon'
import { useColorScheme } from '@/components/useColorScheme'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import Colors from '@/constants/Colors'
import { Typography, BorderRadius, space, Spacing, shadow } from '@/src/shared/utils/tokens'
import { useCartStore } from '@/src/features/cart/store/cartStore'
import { useToast } from '@/src/shared/hooks/useToast'
import { api } from '@/src/shared/services/api'
import { getDbSync } from '@/src/shared/services/database'
import { getPendingItems, subscribePendingUpdates } from '@/src/shared/services/sync'
import type { Patient, Order } from '@/src/shared/types'

interface PatientHistorySheetProps {
  visible: boolean
  paciente: Patient
  onClose: () => void
}

function formatRelativeDate(ts: string): string {
  const d = new Date(ts)
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)
  const target = new Date(d.getFullYear(), d.getMonth(), d.getDate())

  if (target.getTime() === today.getTime()) return 'Hoy'
  if (target.getTime() === yesterday.getTime()) return 'Ayer'
  return d.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })
}

function formatTime(ts: string): string {
  return new Date(ts).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
}

function groupByDate(orders: Order[]): { date: string; orders: Order[] }[] {
  const groups: Record<string, Order[]> = {}
  for (const order of orders) {
    const key = formatRelativeDate(order.timestamp)
    if (!groups[key]) groups[key] = []
    groups[key].push(order)
  }
  const orderMap: Record<string, number> = { Hoy: 0, Ayer: 1 }
  return Object.entries(groups)
    .sort(([a], [b]) => (orderMap[a] ?? 2) - (orderMap[b] ?? 2))
    .map(([date, orders]) => ({ date, orders }))
}

export function PatientHistorySheet({ visible, paciente, onClose }: PatientHistorySheetProps) {
  const colorScheme = useColorScheme()
  const colors = Colors[colorScheme]
  const insets = useSafeAreaInsets()
  const addItem = useCartStore((s) => s.addItem)
  const toast = useToast()

  const { data: pedidos } = useQuery({
    queryKey: ['pedidos'],
    queryFn: api.getPedidos,
  })

  const [pendingOrders, setPendingOrders] = useState<Order[]>([])

  useFocusEffect(
    useCallback(() => {
      const db = getDbSync()
      if (!db) return
      const loadPending = () => {
        getPendingItems(db).then((rows) => {
          const transformed: Order[] = rows
            .filter((r) => r.pacienteId === paciente.id)
            .map((r) => ({
              id: r.id,
              items: r.items,
              pacienteId: r.pacienteId,
              timestamp: r.timestamp,
              status: 'local_pending' as const,
            }))
          setPendingOrders(transformed)
        }).catch(() => {})
      }
      loadPending()
      const unsubscribe = subscribePendingUpdates(loadPending)
      return unsubscribe
    }, [paciente.id]),
  )

  const patientOrders = useMemo(() => {
    const serverOrders = (pedidos || []).filter((o: Order) => o.pacienteId === paciente.id)
    const all = [...serverOrders, ...pendingOrders]
    return groupByDate(all)
  }, [pedidos, paciente.id, pendingOrders])

  const handleRepeat = (comidaId: string, comidaNombre: string, nota: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    addItem({
      comidaId,
      comidaNombre,
      pacienteId: paciente.id,
      pacienteNombre: paciente.nombre,
      flagHoy: true,
      nota: nota || '',
    })
    toast.show({ message: `${comidaNombre} agregado al carrito`, icon: 'checkmark.circle.fill' })
    onClose()
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <BlurWrapper intensity={80} tint={colorScheme === 'dark' ? 'dark' : 'light'} style={styles.overlay}>
        <KeyboardAvoidingView behavior="padding" style={styles.overlay}>
          <Pressable style={styles.backdrop} onPress={onClose}>
            <Pressable style={[styles.sheet, { backgroundColor: colors.surfaceAlt, paddingBottom: Math.max(insets.bottom, space[4]) }]} onPress={(e) => e.stopPropagation()}>
              <View style={styles.header}>
                <Text style={[styles.title, { color: colors.text }]}>Historial</Text>
                <Text style={[styles.patientName, { color: colors.textSecondary }]}>
                  {paciente.nombre} — Hab. {paciente.habitacion}
                </Text>
              </View>

              {patientOrders.length === 0 ? (
                <View style={styles.empty}>
                  <Icon name="clock.fill" tintColor={colors.textTertiary} size={32} />
                  <Text style={[styles.emptyText, { color: colors.textTertiary }]}>
                    Sin pedidos anteriores
                  </Text>
                </View>
              ) : (
                <FlatList
                  data={patientOrders}
                  keyExtractor={(item) => item.date}
                  style={styles.list}
                  renderItem={({ item: group }) => (
                    <View style={styles.group}>
                      <Text style={[styles.groupDate, { color: colors.textSecondary }]}>
                        {group.date}
                      </Text>
                      {group.orders.map((order) => (
                        <View key={order.id} style={[styles.orderCard, shadow.sm, { backgroundColor: colors.card }]}>
                          <View style={styles.orderHeader}>
                            <Text style={[styles.orderTime, { color: colors.textTertiary }]}>
                              {formatTime(order.timestamp)}
                            </Text>
                          </View>
                          {order.items.map((item) => (
                            <View key={item.id} style={styles.itemRow}>
                              <View style={styles.itemInfo}>
                                <Text style={[styles.itemName, { color: colors.text }]}>
                                  {item.comidaNombre}
                                </Text>
                                {item.nota ? (
                                  <Text style={[styles.itemNota, { color: colors.textSecondary }]} numberOfLines={1}>
                                    {item.nota}
                                  </Text>
                                ) : null}
                              </View>
                              <Pressable
                                onPress={() => handleRepeat(item.comidaId, item.comidaNombre, item.nota)}
                                style={[styles.repeatBtn, { backgroundColor: colors.primary + '15' }]}
                              >
                                <Icon name="plus" tintColor={colors.primary} size={14} />
                                <Text style={[styles.repeatText, { color: colors.primary }]}>Repetir</Text>
                              </Pressable>
                            </View>
                          ))}
                        </View>
                      ))}
                    </View>
                  )}
                  ItemSeparatorComponent={() => <View style={{ height: Spacing.md }} />}
                />
              )}
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
    maxHeight: '80%',
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
  group: {
    gap: space[3],
  },
  groupDate: {
    ...Typography.title3,
    fontWeight: '700',
    marginBottom: space[1],
  },
  orderCard: {
    borderRadius: BorderRadius.md,
    padding: space[4],
    gap: space[2],
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  orderTime: {
    ...Typography.caption1,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[3],
  },
  itemInfo: {
    flex: 1,
    gap: space[0],
  },
  itemName: {
    ...Typography.body,
    fontWeight: '600',
  },
  itemNota: {
    ...Typography.caption1,
  },
  repeatBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[1],
    paddingHorizontal: space[3],
    paddingVertical: space[2],
    borderRadius: BorderRadius.md,
  },
  repeatText: {
    ...Typography.footnote,
    fontWeight: '600',
  },
  empty: {
    alignItems: 'center',
    paddingVertical: space[12],
    gap: space[3],
  },
  emptyText: {
    ...Typography.body,
  },
})
