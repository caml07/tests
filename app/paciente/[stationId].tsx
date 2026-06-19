import { useState, useCallback } from 'react'
import { View, Text, FlatList, StyleSheet } from 'react-native'
import { Icon } from '@/src/components/atoms/Icon'
import { useLocalSearchParams, router } from 'expo-router'
import Colors from '@/constants/Colors'
import { useColorScheme } from '@/components/useColorScheme'
import { useStations } from '@/src/hooks/useStations'
import { usePatients } from '@/src/hooks/usePatients'
import { useStationStore } from '@/src/store/stationStore'
import { Input, Button } from '@/src/components/atoms'
import { EmptyState, PatientCard } from '@/src/components/molecules'
import { Screen } from '@/src/components/organisms/Screen'
import { ScreenLoading } from '@/src/components/organisms/ScreenLoading'
import { ScreenError } from '@/src/components/organisms/ScreenError'
import { Spacing, Typography } from '@/src/utils/tokens'

export default function PatientListScreen() {
  const { stationId } = useLocalSearchParams<{ stationId: string }>()
  const colorScheme = useColorScheme()
  const colors = Colors[colorScheme]
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
    <Screen edges={['bottom']}>
      <View style={[styles.container, { backgroundColor: colors.surface }]}>
        <View style={styles.header}>
          <Button
            title="Atrás"
            icon="chevron.left"
            onPress={() => {
              setSelectedStation('')
              router.back()
            }}
            variant="ghost"
          />
          <View style={styles.titleRow}>
            <Icon name="building.2.fill" tintColor={colors.primary} size={14} />
            <Text style={[styles.stationTitle, { color: colors.text }]} numberOfLines={1}>
              {station?.nombre || 'Pacientes'}
            </Text>
          </View>
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
    paddingVertical: Spacing.md,
    gap: Spacing.sm,
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
