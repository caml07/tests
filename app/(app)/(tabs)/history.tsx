import { useState, useMemo, useCallback, memo, useEffect } from 'react'
import { useFocusEffect } from 'expo-router'
import { View, Text, FlatList, Pressable, StyleSheet } from 'react-native'
import { useQuery } from '@tanstack/react-query'
import { Icon } from '@/src/shared/atoms/Icon'
import { Accordion } from '@/src/shared/atoms/Accordion'
import { EmptyState } from '@/src/shared/molecules'
import { ScreenLoading } from '@/src/shared/organisms/ScreenLoading'
import { Screen } from '@/src/shared/organisms/Screen'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useColorScheme } from '@/components/useColorScheme'
import Colors from '@/constants/Colors'
import { Typography, Spacing, space, BorderRadius, shadow } from '@/src/shared/utils/tokens'
import * as Haptics from 'expo-haptics'
import { router } from 'expo-router'
import { useCartStore } from '@/src/features/cart/store/cartStore'
import { useToast } from '@/src/shared/hooks/useToast'
import { api } from '@/src/shared/services/api'
import { getDbSync, getAllRows } from '@/src/shared/services/database'
import { DeadLetterBanner } from '@/src/shared/molecules/DeadLetterBanner'
import { getPendingItems, subscribePendingUpdates } from '@/src/shared/services/sync'
import type { Order, Patient } from '@/src/shared/types'

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

interface PatientOrderGroup {
  pacienteId: string
  pacienteNombre: string
  habitacion: string
  cama: string
  orders: Order[]
}

function groupByPatient(orders: Order[], patientMap?: Map<string, Patient>): PatientOrderGroup[] {
  const groups: Record<string, PatientOrderGroup> = {}
  for (const order of orders) {
    const pid = order.pacienteId
    if (!groups[pid]) {
      const patient = patientMap?.get(pid)
      groups[pid] = {
        pacienteId: pid,
        pacienteNombre: order.items[0]?.pacienteNombre || 'Sin nombre',
        habitacion: patient?.habitacion ?? '',
        cama: patient?.cama ?? '',
        orders: [],
      }
    }
    groups[pid].orders.push(order)
  }
  return Object.values(groups).sort((a, b) => a.pacienteNombre.localeCompare(b.pacienteNombre, 'es'))
}

function OrderItemsView({ orders, patientMap }: { orders: Order[]; patientMap: Map<string, Patient> }) {
  const colorScheme = useColorScheme()
  const colors = Colors[colorScheme]

  const statusColors = {
    en_cocina: { bg: '#fef3c7', text: '#d97706', icon: 'flame.fill' as const },
    local_pending: { bg: colors.surfaceAlt, text: colors.textSecondary, icon: 'clock.fill' as const },
  } as const

  const addItem = useCartStore((s) => s.addItem)
  const toast = useToast()
  const grouped = useMemo(() => groupByDate(orders), [orders])

  const handleRepeat = useCallback((comidaId: string, comidaNombre: string, nota: string, pacienteId: string, pacienteNombre: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    addItem({ comidaId, comidaNombre, pacienteId, pacienteNombre, flagHoy: true, nota: nota || '' })
    toast.show({
      message: `${comidaNombre} agregado al carrito`,
      icon: 'checkmark.circle.fill',
    })
    const patient = patientMap.get(pacienteId)
    if (patient) {
      router.navigate(`/(app)/paciente/${patient.stationId}/${pacienteId}`)
    }
  }, [addItem, toast, patientMap])

  return (
    <View style={styles.ordersContent}>
      {grouped.map((group) => (
        <View key={group.date} style={styles.dateGroup}>
          <Text style={[styles.dateLabel, { color: colors.textSecondary }]}>{group.date}</Text>
          {group.orders.map((order) => {
            const sc = order.status === 'local_pending' ? statusColors.local_pending : statusColors.en_cocina
            const statusLabel = order.status === 'local_pending' ? 'Esperando red...' : 'En cocina'
            return (
              <View key={order.id} style={[styles.orderCard, shadow.sm, { backgroundColor: colors.card }]}>
                <View style={styles.orderHead}>
                  <View style={[styles.statusChip, { backgroundColor: sc.bg }]}>
                    <Icon name={sc.icon} tintColor={sc.text} size={12} />
                    <Text style={[styles.statusText, { color: sc.text }]}>{statusLabel}</Text>
                  </View>
                  <Text style={[styles.orderTime, { color: colors.textTertiary }]}>
                    {formatTime(order.timestamp)}
                  </Text>
                </View>
                {order.items.map((item) => (
                  <View key={item.id} style={styles.itemRow}>
                    <View style={styles.itemInfo}>
                      <Text style={[styles.itemName, { color: colors.text }]}>{item.comidaNombre}</Text>
                      {item.nota ? (
                        <Text style={[styles.itemNota, { color: colors.textSecondary }]} numberOfLines={1}>
                          {item.nota}
                        </Text>
                      ) : null}
                    </View>
                    <Pressable
                      onPress={() => handleRepeat(item.comidaId, item.comidaNombre, item.nota, order.pacienteId, order.items[0]?.pacienteNombre || '')}
                      style={[styles.repeatBtn, { backgroundColor: colors.primary + '15' }]}
                    >
                      <Icon name="plus" tintColor={colors.primary} size={14} />
                      <Text style={[styles.repeatText, { color: colors.primary }]}>Repetir</Text>
                    </Pressable>
                  </View>
                ))}
              </View>
            )
          })}
        </View>
      ))}
    </View>
  )
}

const PatientAccordion = memo(function PatientAccordion({ group, patientMap }: { group: PatientOrderGroup; patientMap: Map<string, Patient> }) {
  const [expanded, setExpanded] = useState(false)
  const colorScheme = useColorScheme()
  const colors = Colors[colorScheme]

  return (
    <View style={[styles.patientCard, shadow.sm, { backgroundColor: colors.card }]}>
      <Pressable
        onPress={() => setExpanded((v) => !v)}
        style={styles.patientHead}
      >
        <View style={[styles.avatar, { backgroundColor: colors.primaryLight }]}>
          <Icon name="person.fill" tintColor={colors.primary} size={22} />
        </View>
        <View style={styles.patientInfo}>
          <Text style={[styles.patientName, { color: colors.text }]}>{group.pacienteNombre}</Text>
          {group.habitacion && group.cama ? (
            <View style={[styles.roomChip, { backgroundColor: colors.primaryLight }]}>
              <Icon name="bed.double.fill" tintColor={colors.primary} size={11} />
              <Text style={[styles.roomText, { color: colors.primary }]}>
                Hab. {group.habitacion} · Cama {group.cama}
              </Text>
            </View>
          ) : null}
        </View>
        <View style={styles.badgeStack}>
          <View style={[styles.countBadge, { backgroundColor: colors.primary }]}>
            <Text style={styles.countText}>{group.orders.length}</Text>
          </View>
          <Icon
            name={expanded ? 'chevron.up' : 'chevron.down'}
            tintColor={colors.textTertiary}
            size={16}
          />
        </View>
      </Pressable>
      <Accordion expanded={expanded}>
        <OrderItemsView orders={group.orders} patientMap={patientMap} />
      </Accordion>
    </View>
  )
})

export default function HistoryScreen() {
  const colorScheme = useColorScheme()
  const colors = Colors[colorScheme]
  const insets = useSafeAreaInsets()
  const [patientMap, setPatientMap] = useState<Map<string, Patient>>(new Map())

  useEffect(() => {
    const db = getDbSync()
    if (!db) return
    getAllRows<Patient>(db, 'patients').then((rows) => {
      const map = new Map<string, Patient>()
      for (const row of rows) {
        map.set(row.id, row)
      }
      setPatientMap(map)
    }).catch(() => {})
  }, [])

  const { data: pedidos, isLoading, error, refetch } = useQuery({
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
          const transformed: Order[] = rows.map((r) => ({
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
    }, [])
  )

  const groups = useMemo(() => {
    const enCocina = (pedidos || []).filter((o: Order) => o.status === 'en_cocina')
    const todosLosPedidos = [...enCocina, ...pendingOrders]
    return groupByPatient(todosLosPedidos, patientMap)
  }, [pedidos, pendingOrders, patientMap])

  if (isLoading) {
    return (
      <Screen edges={['top']}>
        <View style={[styles.container, { backgroundColor: colors.surface }]}>
          <ScreenLoading count={4} itemHeight={120} />
        </View>
      </Screen>
    )
  }

  if (error) {
    return (
      <Screen edges={['top']}>
        <View style={[styles.container, { backgroundColor: colors.surface }]}>
          <EmptyState title="Error al cargar" message="No se pudieron cargar los pedidos." />
        </View>
      </Screen>
    )
  }

  return (
    <Screen edges={['top']}>
      <View style={[styles.container, { backgroundColor: colors.surface }]}>
        <DeadLetterBanner />
        {groups.length === 0 ? (
          <View style={styles.empty}>
            <View style={[styles.iconCircle, { backgroundColor: colors.surfaceAlt }]}>
              <Icon name="clock.fill" tintColor={colors.textTertiary} size={32} />
            </View>
            <Text style={[styles.emptyTitle, { color: colors.text }]}>Sin pedidos en cocina</Text>
            <Text style={[styles.emptyMessage, { color: colors.textSecondary }]}>
              Los pedidos enviados a cocina aparecerán agrupados por paciente.
            </Text>
          </View>
        ) : (
          <FlatList
            data={groups}
            keyExtractor={(g) => g.pacienteId}
            contentContainerStyle={[styles.list, { paddingBottom: 64 + space[6] + insets.bottom + 16 }]}
            renderItem={({ item }) => <PatientAccordion group={item} patientMap={patientMap} />}
            ItemSeparatorComponent={() => <View style={{ height: Spacing.md }} />}
            refreshing={isLoading}
            onRefresh={refetch}
            windowSize={5}
            maxToRenderPerBatch={10}
            removeClippedSubviews={true}
          />
        )}
      </View>
    </Screen>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.screen,
    gap: space[3],
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: space[2],
  },
  emptyTitle: {
    ...Typography.title2,
  },
  emptyMessage: {
    ...Typography.body,
    textAlign: 'center',
    maxWidth: 280,
  },
  list: {
    paddingHorizontal: Spacing.screen,
  },
  patientCard: {
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
  },
  patientHead: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: space[5],
    gap: space[3],
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  patientInfo: {
    flex: 1,
    gap: space[1],
  },
  patientName: {
    ...Typography.headline,
  },
  roomChip: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: space[1],
    paddingHorizontal: space[2],
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
  },
  roomText: {
    ...Typography.caption1,
    fontWeight: '700',
  },
  badgeStack: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[2],
  },
  countBadge: {
    minWidth: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: space[2],
  },
  countText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  ordersContent: {
    paddingHorizontal: space[5],
    paddingBottom: space[5],
    gap: space[4],
  },
  dateGroup: {
    gap: space[2],
  },
  dateLabel: {
    ...Typography.subhead,
    fontWeight: '700',
  },
  orderCard: {
    borderRadius: BorderRadius.md,
    padding: space[4],
    gap: space[2],
  },
  orderHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[1],
    paddingHorizontal: space[2],
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
  },
  statusText: {
    ...Typography.caption2,
    fontWeight: '700',
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
})
