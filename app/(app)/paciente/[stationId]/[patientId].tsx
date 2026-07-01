import { useState, useEffect, useCallback } from 'react'
import { View, Text, FlatList, ScrollView, Pressable, StyleSheet } from 'react-native'
import { router, useLocalSearchParams } from 'expo-router'
import { Icon, type IconName } from '@/src/shared/atoms/Icon'
import { EmptyState, ErrorState } from '@/src/shared/molecules'
import { MenuItem } from '@/src/features/patients/components/MenuItem'
import { MenuItemSkeleton } from '@/src/features/patients/components/MenuItemSkeleton'
import { AddToCartSheet } from '@/src/features/cart/components/AddToCartSheet'
import { PatientCartSheet } from '@/src/features/patients/components/PatientCartSheet'
import { PatientHistorySheet } from '@/src/features/patients/components/PatientHistorySheet'
import { Screen } from '@/src/shared/organisms/Screen'
import { PatientMenuHeader } from '@/src/features/patients/components/PatientMenuHeader'
import { useMenu } from '@/src/features/patients/hooks/useMenu'
import { useCartStore } from '@/src/features/cart/store/cartStore'
import { useColorScheme } from '@/components/useColorScheme'
import Colors from '@/constants/Colors'
import { api } from '@/src/shared/services/api'
import { TIEMPO_MAP, TIEMPO_ICON_MAP } from '@/src/shared/utils/constants'
import { Typography, BorderRadius, space, Spacing, color } from '@/src/shared/utils/tokens'
import { Patient, Comida } from '@/src/shared/types'

export default function PatientMenuScreen() {
  const { stationId, patientId } = useLocalSearchParams<{ stationId: string; patientId: string }>()
  const colorScheme = useColorScheme()
  const colors = Colors[colorScheme]

  const [patient, setPatient] = useState<(Patient & { dietaNombre: string; dietaSimbolo: string }) | null>(null)
  const [tiempos, setTiempos] = useState<string[]>([])
  const [selectedTiempo, setSelectedTiempo] = useState<string>('')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedComida, setSelectedComida] = useState<Comida | null>(null)
  const [showCartSheet, setShowCartSheet] = useState(false)
  const [showHistorySheet, setShowHistorySheet] = useState(false)
  const allItems = useCartStore((s) => s.items)
  const cartCount = allItems.filter((i) => i.pacienteId === patientId).length

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

      const alergias = Array.isArray(p.alergias) ? p.alergias
        : typeof p.alergias === 'string' ? [p.alergias]
        : []
      setPatient({ ...p, alergias, dietaNombre, dietaSimbolo })
      setTiempos(Array.isArray(dietTiempos) ? dietTiempos : [])
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

  const renderHeader = useCallback(() => {
    if (!patient) return null
    return (
      <View>
        <PatientMenuHeader
          nombre={patient.nombre}
          habitacion={patient.habitacion}
          cama={patient.cama}
          dietaNombre={patient.dietaNombre}
          dietaSimbolo={patient.dietaSimbolo as IconName}
          sexo={patient.sexo}
          edad={patient.edad}
          showBack={true}
          onBackPress={() => (router.canGoBack() ? router.back() : router.replace('/(app)/(tabs)'))}
          cartCount={cartCount}
          onCartPress={() => setShowCartSheet(true)}
          onHistoryPress={() => setShowHistorySheet(true)}
        />
        <View style={styles.tiempoContainer}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.tiempoRow}
          >
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
                      borderColor: selected ? colors.primary : colors.surfaceAlt,
                    },
                  ]}
                >
                  <Icon
                    name={(TIEMPO_ICON_MAP[t] || 'questionmark.circle') as IconName}
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
      </View>
    )
  }, [patient, selectedTiempo, tiempos, colors, cartCount])

  const renderLoadingHeader = useCallback(() => (
    <View>
      <PatientMenuHeader.Skeleton />
      <View style={styles.skeletonChips}>
        {[1, 2, 3].map(i => (
          <View key={i} style={[styles.tiempoChip, { borderColor: colors.surfaceAlt }]} />
        ))}
      </View>
    </View>
  ), [colors])

  if (isLoading) {
    return (
      <Screen>
        <View style={[styles.container, { backgroundColor: colors.surface }]}>
          <ScrollView contentContainerStyle={styles.listContent}>
            {renderLoadingHeader()}
            <View style={styles.menuList}>
              {[1, 2, 3, 4, 5, 6].map(i => <MenuItemSkeleton key={i} />)}
            </View>
          </ScrollView>
        </View>
      </Screen>
    )
  }

  if (error) {
    return (
      <Screen>
        <View style={[styles.container, { backgroundColor: colors.surface }]}>
          <ScrollView contentContainerStyle={styles.listContent}>
            <PatientMenuHeader
              nombre="Error"
              habitacion=""
              cama=""
              dietaNombre="Error"
              dietaSimbolo="exclamationmark.circle.fill"
              showBack={true}
              onBackPress={() => (router.canGoBack() ? router.back() : router.replace('/(app)/(tabs)'))}
            />
            <ErrorState message={error} onRetry={fetchPatient} />
          </ScrollView>
        </View>
      </Screen>
    )
  }

  if (!patient) return null

  return (
    <Screen>
      <View style={[styles.container, { backgroundColor: colors.surface }]}>
        <FlatList
          data={menuLoading ? [] : menuError ? [] : comidas}
          keyExtractor={item => item.id}
          renderItem={({ item }) => (
            <MenuItem comida={item} onAddToCart={() => setSelectedComida(item)} />
          )}
          ListHeaderComponent={renderHeader}
          contentContainerStyle={styles.listContent}
          refreshing={refreshing}
          onRefresh={onRefresh}
          ItemSeparatorComponent={() => <View style={{ height: Spacing.md }} />}
          windowSize={5}
          maxToRenderPerBatch={10}
          removeClippedSubviews={true}
          ListEmptyComponent={
            menuLoading ? (
              <View style={styles.menuList}>
                {[1, 2, 3, 4, 5, 6].map(i => (
                  <MenuItemSkeleton key={i} />
                ))}
              </View>
            ) : menuError ? (
              <ErrorState message={menuError} onRetry={refetchMenu} />
            ) : (
              <EmptyState
                title="Sin opciones"
                message={`No hay comidas disponibles para ${TIEMPO_MAP[selectedTiempo]?.toLowerCase() || selectedTiempo}.`}
              />
            )
          }
        />
      </View>

      {selectedComida && patient && (
        <AddToCartSheet
          visible={!!selectedComida}
          comida={selectedComida}
          paciente={patient}
          onClose={() => setSelectedComida(null)}
        />
      )}

      {patient && (
        <PatientCartSheet
          visible={showCartSheet}
          paciente={patient}
          onClose={() => setShowCartSheet(false)}
        />
      )}

      {patient && (
        <PatientHistorySheet
          visible={showHistorySheet}
          paciente={patient}
          onClose={() => setShowHistorySheet(false)}
        />
      )}
    </Screen>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  skeletonChips: {
    flexDirection: 'row',
    gap: space[3],
    paddingHorizontal: Spacing.screen,
    paddingVertical: space[3],
  },
  tiempoContainer: {
    paddingVertical: space[3],
  },
  tiempoRow: {
    flexDirection: 'row',
    gap: space[3],
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
  },
  menuList: {
    gap: Spacing.md,
  },
  listContent: {
    paddingBottom: Spacing.xxl,
  },
})
