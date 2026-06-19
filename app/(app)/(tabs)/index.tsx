import { View, Text, ScrollView, StyleSheet } from 'react-native'
import { Icon } from '@/src/components/atoms/Icon'
import { router } from 'expo-router'
import Colors from '@/constants/Colors'
import { useColorScheme } from '@/components/useColorScheme'
import { useAuth } from '@/src/hooks/useAuth'
import { useStations } from '@/src/hooks/useStations'
import { useStationStore } from '@/src/store/stationStore'
import { Button, Skeleton } from '@/src/components/atoms'
import { EmptyState, ErrorState, StationCard } from '@/src/components/molecules'
import { Screen } from '@/src/components/organisms/Screen'
import { Spacing, Typography, color } from '@/src/utils/tokens'

export default function EstacionesScreen() {
  const colorScheme = useColorScheme()
  const colors = Colors[colorScheme]
  const { user, logout } = useAuth()
  const { stations, isLoading, error, refetch } = useStations()
  const { selectedStationId, setSelectedStation } = useStationStore()
  const initials = user?.nombre?.split(' ').map(n => n[0]).join('').slice(0, 2) || '??'

  return (
    <Screen edges={['bottom']}>
      <ScrollView
        style={[styles.container, { backgroundColor: colors.surface }]}
        contentContainerStyle={styles.content}
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
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
          <Text style={[styles.title, { color: colors.text }]}>
            Hola, {user?.nombre?.split(' ')[0]}
          </Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Elegí una estación para empezar
          </Text>
        </View>

        <View style={styles.sectionHeader}>
          <Icon name="building.2.fill" tintColor={colors.primary} size={14} />
          <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>
            ESTACIONES
          </Text>
        </View>

        {isLoading ? (
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
          <View style={styles.grid}>
            {stations.map((station) => (
              <StationCard
                key={station.id}
                id={station.id}
                nombre={station.nombre}
                selected={selectedStationId === station.id}
                onPress={() => {
                  setSelectedStation(station.id)
                  router.push({ pathname: '/paciente/[stationId]', params: { stationId: station.id } })
                }}
              />
            ))}
          </View>
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
    paddingBottom: Spacing.xxl,
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
    ...Typography.caption1,
    letterSpacing: 1,
    textTransform: 'uppercase',
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
  avatarText: {
    ...Typography.title1,
    color: color.white,
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
    gap: Spacing.sm,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    justifyContent: 'center',
  },
})
