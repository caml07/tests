import { useMemo } from 'react'
import { View, Text, ScrollView, StyleSheet } from 'react-native'
import { Icon } from '@/src/shared/atoms/Icon'
import { router } from 'expo-router'
import { useQuery } from '@tanstack/react-query'
import Colors from '@/constants/Colors'
import { useColorScheme } from '@/components/useColorScheme'
import { useAuth } from '@/src/features/auth/hooks/useAuth'
import { useStations } from '@/src/features/stations/hooks/useStations'
import { useStationStore } from '@/src/features/stations/store/stationStore'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Button, Skeleton } from '@/src/shared/atoms'
import { EmptyState, ErrorState } from '@/src/shared/molecules'
import { StationCard } from '@/src/features/stations/components/StationCard'
import { Screen } from '@/src/shared/organisms/Screen'
import { Spacing, Typography, color, space } from '@/src/shared/utils/tokens'
import { useResponsive } from '@/src/shared/hooks/useResponsive'
import { api } from '@/src/shared/services/api'
import type { Patient, Agrupacion, Station } from '@/src/shared/types'

export default function EstacionesScreen() {
  const colorScheme = useColorScheme()
  const colors = Colors[colorScheme]
  const { user, logout } = useAuth()
  const { stations, isLoading, error, refetch } = useStations()
  const { selectedStationId, setSelectedStation } = useStationStore()
  const insets = useSafeAreaInsets()
  const { isDesktop } = useResponsive()
  const cardWidth = isDesktop ? '30%' : '47%'

  const { data: agrupaciones } = useQuery({
    queryKey: ['agrupaciones'],
    queryFn: api.getAgrupaciones,
  })

  const { data: allPatients } = useQuery({
    queryKey: ['patients'],
    queryFn: api.getAllPatients,
  })

  const patientCountByStation = useMemo(() => {
    const counts: Record<string, number> = {}
    for (const p of allPatients || []) {
      counts[p.stationId] = (counts[p.stationId] || 0) + 1
    }
    return counts
  }, [allPatients])

  const grouped = useMemo(() => {
    if (!agrupaciones) return [] as (Agrupacion & { stations: Station[] })[]
    return agrupaciones.map((ag: Agrupacion) => {
      const groupStations = stations.filter((s: Station) => s.agrupacionId === ag.id)
      return { ...ag, stations: groupStations }
    }).filter((g) => g.stations.length > 0)
  }, [agrupaciones, stations])

  const patientCountByAgrupacion = useMemo(() => {
    const counts: Record<string, number> = {}
    for (const ag of agrupaciones || []) {
      const stationIds = stations.filter((s) => s.agrupacionId === ag.id).map((s) => s.id)
      counts[ag.id] = (allPatients || []).filter((p: Patient) => stationIds.includes(p.stationId)).length
    }
    return counts
  }, [agrupaciones, stations, allPatients])

  return (
    <Screen edges={['top']}>
      <ScrollView
        style={[styles.container, { backgroundColor: colors.surface }]}
        contentContainerStyle={[styles.content, { paddingBottom: 64 + space[6] + insets.bottom + 16 }]}
      >
        <View style={styles.header}>
          <View style={styles.breadcrumbRow}>
            <Icon name="heart.fill" tintColor={colors.primary} size={12} />
            <Text style={[styles.breadcrumb, { color: colors.textSecondary }]}>HVP · Dietas</Text>
          </View>
          <Button title="Salir" icon="rectangle.portrait.and.arrow.right" onPress={logout} variant="ghost" />
        </View>

        <View style={styles.hero}>
          <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
            <Icon name="person.fill" tintColor={color.white} size={28} />
          </View>
          <Text style={[styles.title, { color: colors.text }]}>
            Hola, {user?.nombre?.split(' ')[0]}
          </Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Elegí una estación para empezar
          </Text>
        </View>

        {(isLoading) ? (
          <View style={styles.skeletonGrid}>
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} width="100%" height={130} borderRadius={16} />
            ))}
          </View>
        ) : error ? (
          <ErrorState message={error} onRetry={refetch} />
        ) : stations.length === 0 ? (
          <EmptyState
            title="Sin estaciones"
            message="No hay estaciones disponibles."
          />
        ) : (
          grouped.map((ag) => (
            <View key={ag.id} style={styles.agrupacionSection}>
              <View style={styles.agrupacionHeader}>
                <Icon name={ag.icon as any} tintColor={colors.primary} size={16} />
                <Text style={[styles.agrupacionTitle, { color: colors.text }]}>
                  {ag.nombre}
                </Text>
                <View style={[styles.agrupacionBadge, { backgroundColor: colors.primary + '18' }]}>
                  <Text style={[styles.agrupacionCount, { color: colors.primary }]}>
                    {patientCountByAgrupacion[ag.id]} {patientCountByAgrupacion[ag.id] === 1 ? 'paciente' : 'pacientes'}
                  </Text>
                </View>
              </View>
              <View style={[styles.grid, isDesktop && { gap: Spacing.xl }]}>
                {ag.stations.map((station) => (
                  <StationCard
                    key={station.id}
                    id={station.id}
                    nombre={station.nombre}
                    selected={selectedStationId === station.id}
                    pacienteCount={patientCountByStation[station.id] || 0}
                    onPress={() => {
                      setSelectedStation(station.id)
                      router.push({ pathname: '/paciente/[stationId]', params: { stationId: station.id } })
                    }}
                    wrapperStyle={{ width: cardWidth }}
                  />
                ))}
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </Screen>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingHorizontal: Spacing.screen,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.md,
  },
  breadcrumbRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  breadcrumb: {
    ...Typography.loraCaption,
  },
  hero: {
    alignItems: 'center',
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.sectionGap,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  title: {
    ...Typography.display,
    textAlign: 'center',
    marginBottom: Spacing.xs,
  },
  subtitle: {
    ...Typography.body,
    textAlign: 'center',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginBottom: Spacing.md,
  },
  sectionLabel: {
    ...Typography.label,
  },
  skeletonGrid: {
    gap: Spacing.md,
  },
  agrupacionSection: {
    marginBottom: Spacing.sectionGap,
  },
  agrupacionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  agrupacionTitle: {
    ...Typography.title3,
    fontWeight: '700',
  },
  agrupacionBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: 999,
  },
  agrupacionCount: {
    ...Typography.caption1,
    fontWeight: '600',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
    justifyContent: 'center',
  },
})
