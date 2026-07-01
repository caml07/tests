import { useState, useCallback } from 'react'
import { useFocusEffect } from 'expo-router'
import { View, Text, Pressable, StyleSheet, Alert } from 'react-native'
import { Icon } from '@/src/shared/atoms/Icon'
import { useColorScheme } from '@/components/useColorScheme'
import Colors from '@/constants/Colors'
import { space, Typography, BorderRadius, shadow } from '@/src/shared/utils/tokens'
import { getDb, getDbSync } from '@/src/shared/services/database'
import {
  getDeadLetterItems,
  retryDeadLetterItem,
  discardDeadLetterItem,
} from '@/src/shared/services/sync'
import type { SQLiteDatabase } from 'expo-sqlite'
import type { CartItem } from '@/src/shared/types'

interface DeadLetterEntry {
  id: string
  pacienteNombre: string
  timestamp: string
  failed_attempts: number
  items: CartItem[]
}

export function DeadLetterBanner() {
  const colorScheme = useColorScheme()
  const colors = Colors[colorScheme]
  const [items, setItems] = useState<DeadLetterEntry[] | null>(null)
  const [loading, setLoading] = useState(false)

  const refresh = useCallback(async () => {
    const db = getDbSync()
    if (!db) return
    const dead = await getDeadLetterItems(db)
    setItems(dead as DeadLetterEntry[])
  }, [])

  const handleReintentar = useCallback(async (id: string) => {
    const db = getDbSync()
    if (!db) return
    setLoading(true)
    await retryDeadLetterItem(db, id)
    await refresh()
    setLoading(false)
  }, [refresh])

  const handleDescartar = useCallback(async (id: string) => {
    const db = getDbSync()
    if (!db) return
    setLoading(true)
    await discardDeadLetterItem(db, id)
    await refresh()
    setLoading(false)
  }, [refresh])

  const handlePress = useCallback(async () => {
    await refresh()
    if (!items || items.length === 0) return

    const item = items[0]
    Alert.alert(
      `Pedido sin enviar: ${item.pacienteNombre}`,
      `Falló tras ${item.failed_attempts} intentos.\n\n¿Reintentar o descartar?`,
      [
        { text: 'Descartar', style: 'destructive', onPress: () => handleDescartar(item.id) },
        { text: 'Reintentar', onPress: () => handleReintentar(item.id) },
        { text: 'Cerrar', style: 'cancel' },
      ],
    )
  }, [items, refresh, handleDescartar, handleReintentar])

  useFocusEffect(
    useCallback(() => {
      refresh()
    }, [refresh])
  )

  if (!items || items.length === 0) return null

  return (
    <Pressable onPress={handlePress} style={[styles.banner, { backgroundColor: colors.error + '15' }, shadow.sm]}>
      <Icon name="exclamationmark.triangle.fill" tintColor={colors.error} size={16} />
      <Text style={[styles.text, { color: colors.error }]}>
        {items.length} pedido{items.length > 1 ? 's' : ''} pendiente{items.length > 1 ? 's' : ''} de revisión
      </Text>
      <Icon name="chevron.right" tintColor={colors.error} size={14} />
    </Pressable>
  )
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[2],
    paddingHorizontal: space[4],
    paddingVertical: space[3],
    marginHorizontal: space[4],
    marginBottom: space[2],
    borderRadius: BorderRadius.md,
  },
  text: {
    flex: 1,
    ...Typography.subhead,
    fontWeight: '600',
  },
})
