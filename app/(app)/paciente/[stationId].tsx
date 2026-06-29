import { useState, useCallback } from 'react'
import { View, Text, FlatList, Pressable, StyleSheet } from 'react-native'
import { Icon } from '@/src/shared/atoms/Icon'
import { useLocalSearchParams, router } from 'expo-router'
import Colors from '@/constants/Colors'
import { useColorScheme } from '@/components/useColorScheme'
import { useStations } from '@/src/features/stations/hooks/useStations'
import { usePatients } from '@/src/features/patients/hooks/usePatients'
import { useStationStore } from '@/src/features/stations/store/stationStore'
import { Input } from '@/src/shared/atoms'
import { EmptyState } from '@/src/shared/molecules/EmptyState'
import { PatientCard } from '@/src/features/patients/components/PatientCard'
import { Screen } from '@/src/shared/organisms/Screen'
import { ScreenLoading } from '@/src/shared/organisms/ScreenLoading'
import { ScreenError } from '@/src/shared/organisms/ScreenError'
import { Spacing, Typography, space } from '@/src/shared/utils/tokens'
import { useResponsive } from '@/src/shared/hooks/useResponsive'

export default function PatientListScreen() {
  const { stationId } = useLocalSearchParams<{ stationId: string }>()
  const colorScheme = useColorScheme()
  const colors = Colors[colorScheme]
  const { isTablet } = useResponsive()
  const { stations } = useStations()
  const station = stations.find(s => s.id === stationId)
  const { setSelectedStation } = useStationStore()
  const [searchQuery, setSearchQuery] = useState('')
  const { patients, isLoading, error, refetch } = usePatients(stationId, searchQuery)
  const [refreshing, setRefreshing] = useState(false)
  const onRefresh = useCallback(async () => {
    setRefreshing(true)
    await refetch()
    setRefreshing(false)
  }, [refetch])

  return (
    <Screen edges={['top', 'bottom']}>
      <View style={[styles.container, { backgroundColor: colors.surface }]}>
        <View style={styles.header}>
          <Pressable
            onPress={() => {
              setSelectedStation('')
              if (router.canGoBack()) {
                router.back()
              } else {
                router.replace('/(app)/(tabs)')
              }
            }}
            style={[styles.backBtn, { backgroundColor: colors.surfaceAlt }]}
            hitSlop={8}
          >
            <Icon name="chevron.left" tintColor={colors.text} size={20} />
          </Pressable>
          <View style={styles.titleRow}>
            <Icon name="building.2.fill" tintColor={colors.primary} size={14} />
            <Text style={[styles.stationTitle, { color: colors.text }]} numberOfLines={1}>
              {station?.nombre || 'Pacientes'}
            </Text>
          </View>
          <View style={styles.backBtn} />
        </View>

        <View style={styles.searchContainer}>
          <Input
            label="Buscar"
            leftIcon="magnifyingglass"
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Buscar paciente..."
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>

        {isLoading ? (
          <ScreenLoading count={6} />
        ) : error ? (
          <ScreenError message={error} onRetry={refetch} />
        ) : (
          <FlatList
            data={patients}
            keyExtractor={(item) => item.id}
            numColumns={isTablet ? 2 : 1}
            columnWrapperStyle={isTablet ? { gap: Spacing.md } : undefined}
            refreshing={refreshing}
            onRefresh={onRefresh}
            renderItem={({ item }) => (
              <PatientCard
                patient={item}
                onPress={() => router.push({
                  pathname: '/paciente/[stationId]/[patientId]' as any,
                  params: { stationId, patientId: item.id },
                })}
              />
            )}
            contentContainerStyle={styles.list}
            ItemSeparatorComponent={() => <View style={{ height: Spacing.sm }} />}
            ListEmptyComponent={
              <EmptyState
                title="Sin pacientes"
                message={
                  searchQuery
                    ? `No se encontró "${searchQuery}"`
                    : 'No hay pacientes en esta estación.'
                }
              />
            }
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.screen,
    paddingTop: space[3],
    paddingBottom: Spacing.md,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    flex: 1,
    justifyContent: 'center',
  },
  stationTitle: {
    ...Typography.title3,
  },
  searchContainer: {
    paddingHorizontal: Spacing.screen,
    paddingBottom: Spacing.md,
  },
  list: {
    paddingHorizontal: Spacing.screen,
    paddingBottom: Spacing.xxl,
  },
})
