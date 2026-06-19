import { useState, useEffect, useCallback } from 'react'
import { View, Text, FlatList, ScrollView, Pressable, StyleSheet } from 'react-native'
import { router, useLocalSearchParams } from 'expo-router'
import { Icon } from '@/src/components/atoms/Icon'
import { Button } from '@/src/components/atoms'
import { MenuItem, MenuItemSkeleton, EmptyState, ErrorState } from '@/src/components/molecules'
import { Screen } from '@/src/components/organisms/Screen'
import { PatientMenuHeader } from '@/src/components/organisms/PatientMenuHeader'
import { useMenu } from '@/src/hooks/useMenu'
import { useColorScheme } from '@/components/useColorScheme'
import Colors from '@/constants/Colors'
import { api } from '@/src/services/api'
import { TIEMPO_MAP, TIEMPO_ICON_MAP } from '@/src/utils/constants'
import { Typography, BorderRadius, space, Spacing, color } from '@/src/utils/tokens'
import { Patient } from '@/src/types'

export default function PatientMenuScreen() {
  const { stationId, patientId } = useLocalSearchParams<{ stationId: string; patientId: string }>()
  const colorScheme = useColorScheme()
  const colors = Colors[colorScheme]

  const [patient, setPatient] = useState<(Patient & { dietaNombre: string; dietaSimbolo: string }) | null>(null)
  const [tiempos, setTiempos] = useState<string[]>([])
  const [selectedTiempo, setSelectedTiempo] = useState<string>('')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchPatient = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const [p, dietas] = await Promise.all([
        api.getPatient(patientId),
        api.getDietas(),
      ])
      if (!p) {
        setError('Paciente no encontrado')
        return
      }

      const diet = dietas.find(d => d.id === p.dietaId)
      const dietaNombre = diet?.nombre || 'Sin especificar'
      const dietaSimbolo = diet?.simbolo || 'questionmark.circle'
      const dietTiempos = diet?.tiempos || []

      setPatient({ ...p, dietaNombre, dietaSimbolo })
      setTiempos(dietTiempos)
      if (dietTiempos.length > 0) {
        setSelectedTiempo(dietTiempos[0])
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al cargar datos')
    } finally {
      setIsLoading(false)
    }
  }, [patientId])

  useEffect(() => {
    fetchPatient()
  }, [fetchPatient])

  const { menuByTiempo, isLoading: menuLoading, error: menuError, refetch: refetchMenu } = useMenu(patient?.dietaId || '')

  const comidas = selectedTiempo ? menuByTiempo[selectedTiempo] || [] : []
  const [refreshing, setRefreshing] = useState(false)
  const onRefresh = useCallback(async () => {
    setRefreshing(true)
    await Promise.all([fetchPatient(), refetchMenu()])
    setRefreshing(false)
  }, [fetchPatient, refetchMenu])

  if (isLoading) {
    return (
      <Screen edges={['bottom']}>
        <View style={[styles.container, { backgroundColor: colors.surface }]}>
          <View style={styles.header}>
            <Button title="Atrás" icon="chevron.left" onPress={() => router.back()} variant="ghost" />
            <View style={{ flex: 1 }} />
          </View>
          <PatientMenuHeader.Skeleton />
          <View style={styles.skeletonChips}>
            {[1, 2, 3].map(i => (
              <View key={i} style={[styles.tiempoChip, { borderColor: colors.border }]} />
            ))}
          </View>
          <View style={styles.menuList}>
            {[1, 2, 3, 4, 5, 6].map(i => (
              <MenuItemSkeleton key={i} />
            ))}
          </View>
        </View>
      </Screen>
    )
  }

  if (error) {
    return (
      <Screen edges={['bottom']}>
        <View style={[styles.container, { backgroundColor: colors.surface }]}>
          <View style={styles.header}>
            <Button title="Atrás" icon="chevron.left" onPress={() => router.back()} variant="ghost" />
            <View style={{ flex: 1 }} />
          </View>
          <ErrorState message={error} onRetry={fetchPatient} />
        </View>
      </Screen>
    )
  }

  if (!patient) return null

  return (
    <Screen edges={['bottom']}>
      <View style={[styles.container, { backgroundColor: colors.surface }]}>
        <View style={styles.header}>
          <Button title="Atrás" icon="chevron.left" onPress={() => router.back()} variant="ghost" />
          <View style={{ flex: 1 }} />
        </View>

        <PatientMenuHeader
          nombre={patient.nombre}
          habitacion={patient.habitacion}
          cama={patient.cama}
          dietaNombre={patient.dietaNombre}
          dietaSimbolo={patient.dietaSimbolo}
        />

        <View style={styles.tiempoContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tiempoRow}>
            {tiempos.map(t => {
              const selected = selectedTiempo === t
              return (
                <Pressable
                  key={t}
                  onPress={() => setSelectedTiempo(t)}
                  style={[
                    styles.tiempoChip,
                    {
                      backgroundColor: selected ? colors.primary : color.transparent,
                      borderColor: selected ? colors.primary : colors.border,
                    },
                  ]}
                >
                  <Icon
                    name={TIEMPO_ICON_MAP[t] || 'questionmark.circle'}
                    tintColor={selected ? colors.white : colors.textSecondary}
                    size={16}
                  />
                  <Text
                    style={[
                      styles.tiempoLabel,
                      { color: selected ? colors.white : colors.textSecondary },
                    ]}
                  >
                    {TIEMPO_MAP[t] || t}
                  </Text>
                </Pressable>
              )
            })}
          </ScrollView>
        </View>

        {menuLoading ? (
          <View style={styles.menuList}>
            {[1, 2, 3, 4, 5, 6].map(i => (
              <MenuItemSkeleton key={i} />
            ))}
          </View>
        ) : menuError ? (
          <ErrorState message={menuError} onRetry={refetchMenu} />
        ) : (
          <FlatList
            data={comidas}
            keyExtractor={item => item.id}
            renderItem={({ item }) => (
              <MenuItem comida={item} />
            )}
            contentContainerStyle={styles.menuList}
            refreshing={refreshing}
            onRefresh={onRefresh}
            ItemSeparatorComponent={() => <View style={{ height: Spacing.sm }} />}
            ListEmptyComponent={
              <EmptyState
                title="Sin opciones"
                message={`No hay comidas disponibles para ${TIEMPO_MAP[selectedTiempo]?.toLowerCase() || selectedTiempo}.`}
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
    paddingRight: Spacing.screen,
  },
  skeletonChips: {
    flexDirection: 'row',
    gap: space[2],
    paddingHorizontal: Spacing.screen,
    paddingVertical: space[3],
  },
  tiempoContainer: {
    paddingVertical: space[3],
  },
  tiempoRow: {
    flexDirection: 'row',
    gap: space[2],
    paddingHorizontal: Spacing.screen,
  },
  tiempoChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[1],
    paddingHorizontal: space[4],
    paddingVertical: space[2],
    borderRadius: BorderRadius.full,
    borderWidth: 1.5,
  },
  tiempoLabel: {
    ...Typography.subhead,
    fontWeight: '600',
  },
  menuList: {
    paddingHorizontal: Spacing.screen,
    paddingBottom: Spacing.xxl,
    gap: Spacing.sm,
  },
})
