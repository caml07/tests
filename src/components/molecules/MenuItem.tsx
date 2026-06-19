import { useState } from 'react'
import { View, Text, StyleSheet, Pressable } from 'react-native'
import Animated, { useAnimatedStyle, withTiming, withSpring, useSharedValue, interpolate } from 'react-native-reanimated'
import { Icon } from '@/src/components/atoms/Icon'
import { useColorScheme } from '@/components/useColorScheme'
import Colors from '@/constants/Colors'
import { Typography, BorderRadius, space, shadow, spring as springCfg } from '@/src/utils/tokens'
import { Comida } from '@/src/types'

interface MenuItemProps {
  comida: Comida
  onAddToCart?: () => void
}

export function MenuItem({ comida, onAddToCart }: MenuItemProps) {
  const colorScheme = useColorScheme()
  const colors = Colors[colorScheme]
  const [expanded, setExpanded] = useState(false)
  const expandProgress = useSharedValue(0)

  const toggleExpand = () => {
    const to = expanded ? 0 : 1
    expandProgress.value = withTiming(to, { duration: 250 })
    setExpanded(!expanded)
  }

  const chevronStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${interpolate(expandProgress.value, [0, 1], [0, 180])}deg` }],
  }))

  const contentStyle = useAnimatedStyle(() => ({
    maxHeight: interpolate(expandProgress.value, [0, 1], [0, 600]),
    opacity: interpolate(expandProgress.value, [0, 1], [0, 1]),
    overflow: 'hidden',
  }))

  return (
    <View style={[styles.card, shadow.sm, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={[styles.accentBar, { backgroundColor: colors.primary }]} />
      <Pressable onPress={toggleExpand} style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={[styles.nombre, { color: colors.text }]} numberOfLines={1}>
            {comida.nombre}
          </Text>
          <Animated.View style={chevronStyle}>
            <Icon name="chevron.right" tintColor={colors.textTertiary} size={16} />
          </Animated.View>
        </View>
      </Pressable>

      <Animated.View style={contentStyle}>
        <View style={[styles.divider, { backgroundColor: colors.border }]} />
        <View style={styles.subcomidas}>
          {comida.subcomidas.map((sc, i) => (
            <View key={sc.id || i} style={styles.subcomida}>
              <Text style={[styles.scNombre, { color: colors.text }]}>{sc.nombre}</Text>
              {sc.descripcion ? (
                <Text style={[styles.scDesc, { color: colors.textSecondary }]}>{sc.descripcion}</Text>
              ) : null}
              {sc.ingredientes.length > 0 && (
                <View style={styles.ingredientes}>
                  {sc.ingredientes.map((ing, j) => (
                    <View key={ing.id || j} style={styles.ingRow}>
                      <View style={[styles.bullet, { backgroundColor: colors.primary }]} />
                      <Text style={[styles.ingText, { color: colors.textSecondary }]}>
                        {ing.nombre}
                      </Text>
                    </View>
                  ))}
                </View>
              )}
              {i < comida.subcomidas.length - 1 && (
                <View style={[styles.scDivider, { backgroundColor: colors.border }]} />
              )}
            </View>
          ))}
        </View>

        {onAddToCart && (
          <View style={styles.addRow}>
            <Pressable
              onPress={onAddToCart}
              style={[styles.addBtn, { backgroundColor: colors.primary }]}
            >
              <Icon name="plus" tintColor={colors.white} size={16} />
              <Text style={styles.addText}>Agregar</Text>
            </Pressable>
          </View>
        )}
      </Animated.View>
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    overflow: 'hidden',
  },
  accentBar: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 3,
    borderTopLeftRadius: BorderRadius.lg,
    borderBottomLeftRadius: BorderRadius.lg,
  },
  header: {
    padding: space[4],
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: space[2],
  },
  nombre: {
    ...Typography.headline,
    flex: 1,
  },
  divider: {
    height: 1,
    marginHorizontal: space[4],
  },
  subcomidas: {
    paddingHorizontal: space[4],
    paddingVertical: space[3],
    gap: space[3],
  },
  subcomida: {
    gap: space[1],
  },
  scNombre: {
    ...Typography.subhead,
    fontWeight: '600',
  },
  scDesc: {
    ...Typography.footnote,
  },
  ingredientes: {
    gap: space[1],
    marginTop: space[1],
  },
  ingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[2],
  },
  bullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  ingText: {
    ...Typography.caption1,
  },
  scDivider: {
    height: 1,
    marginTop: space[2],
  },
  addRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: space[4],
    paddingBottom: space[3],
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[1],
    paddingHorizontal: space[4],
    paddingVertical: space[2],
    borderRadius: BorderRadius.full,
  },
  addText: {
    ...Typography.footnote,
    fontWeight: '600',
    color: '#ffffff',
  },
})
