import { useState, memo } from 'react'
import { View, Text, StyleSheet, Pressable } from 'react-native'
import Animated, { useAnimatedStyle, withTiming, useSharedValue } from 'react-native-reanimated'
import { Accordion } from '@/src/shared/atoms/Accordion'
import { PressableScale } from '@/src/shared/atoms/PressableScale'
import { Icon } from '@/src/shared/atoms/Icon'
import { useColorScheme } from '@/components/useColorScheme'
import Colors from '@/constants/Colors'
import { Typography, BorderRadius, space, shadow } from '@/src/shared/utils/tokens'
import { Comida, Subcomida } from '@/src/shared/types'

interface MenuItemProps {
  comida: Comida
  onAddToCart?: () => void
}

function SubcomidaAccordion({ subcomida }: { subcomida: Subcomida }) {
  const colorScheme = useColorScheme()
  const colors = Colors[colorScheme]
  const [expanded, setExpanded] = useState(false)
  const chevronRotation = useSharedValue(0)

  const toggleExpand = () => {
    const to = expanded ? 0 : 1
    chevronRotation.value = withTiming(to, { duration: 200 })
    setExpanded(!expanded)
  }

  const chevronStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${chevronRotation.value * 90}deg` }],
  }))

  return (
    <View style={styles.subcomida}>
      <Pressable onPress={toggleExpand} style={styles.subHeader}>
        <Text style={[styles.scNombre, { color: colors.text }]}>{subcomida.nombre}</Text>
        <Animated.View style={chevronStyle}>
          <Icon name="chevron.right" tintColor={colors.textTertiary} size={14} />
        </Animated.View>
      </Pressable>

      <Accordion expanded={expanded} duration={200}>
        {subcomida.descripcion ? (
          <Text style={[styles.scDesc, { color: colors.textSecondary }]}>{subcomida.descripcion}</Text>
        ) : null}
        {subcomida.ingredientes.length > 0 && (
          <View style={styles.ingredientes}>
            {subcomida.ingredientes.map((ing, j) => (
              <View key={ing.id || j} style={styles.ingRow}>
                <View style={[styles.bullet, { backgroundColor: colors.primary }]} />
                <Text style={[styles.ingText, { color: colors.textSecondary }]}>
                  {ing.nombre}
                </Text>
              </View>
            ))}
          </View>
        )}
      </Accordion>
    </View>
  )
}

export const MenuItem = memo(function MenuItem({ comida, onAddToCart }: MenuItemProps) {
    const colorScheme = useColorScheme()
    const colors = Colors[colorScheme]
    const [expanded, setExpanded] = useState(false)
    const chevronRotation = useSharedValue(0)

    const toggleExpand = () => {
      const to = expanded ? 0 : 1
      chevronRotation.value = withTiming(to, { duration: 250 })
      setExpanded(!expanded)
    }

    const chevronStyle = useAnimatedStyle(() => ({
      transform: [{ rotate: `${chevronRotation.value * 90}deg` }],
    }))

    return (
      <View style={[styles.card, shadow.sm, { backgroundColor: colors.card }]}>
      <Pressable onPress={toggleExpand} style={styles.header}>
        <Text style={[styles.nombre, { color: colors.text }]} numberOfLines={1}>
          {comida.nombre}
        </Text>
        <Animated.View style={chevronStyle}>
          <Icon name="chevron.right" tintColor={colors.textTertiary} size={16} />
        </Animated.View>
      </Pressable>

      <Accordion expanded={expanded}>
        <View style={[styles.divider, { backgroundColor: colors.surfaceAlt }]} />
        <View style={styles.subcomidas}>
          {comida.subcomidas.map((sc, i) => (
            <SubcomidaAccordion key={sc.id || i} subcomida={sc} />
          ))}
        </View>

        {onAddToCart && (
          <View style={styles.addRow}>
            <PressableScale
              onPress={onAddToCart}
              style={[styles.addBtn, { backgroundColor: colors.primary }]}
            >
              <Icon name="plus" tintColor={colors.white} size={14} />
              <Text style={styles.addText}>Agregar</Text>
            </PressableScale>
          </View>
        )}
      </Accordion>
    </View>
  )
})

const styles = StyleSheet.create({
  card: {
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: space[5],
    paddingVertical: space[5],
  },
  nombre: {
    ...Typography.headline,
    flex: 1,
  },
  divider: {
    height: 1,
  },
  subcomidas: {
    paddingHorizontal: space[5],
    paddingVertical: space[4],
    gap: space[4],
  },
  subcomida: {
    gap: space[2],
  },
  subHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  scNombre: {
    ...Typography.subhead,
    fontWeight: '600',
    flex: 1,
  },
  scDesc: {
    ...Typography.footnote,
    fontSize: 12,
  },
  ingredientes: {
    gap: space[1],
    paddingLeft: space[4],
    marginTop: space[2],
  },
  ingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[2],
  },
  bullet: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
  ingText: {
    ...Typography.caption1,
  },
  addRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: space[5],
    paddingBottom: space[5],
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[1],
    paddingHorizontal: space[4],
    paddingVertical: space[2],
    borderRadius: BorderRadius.md,
  },
  addText: {
    ...Typography.footnote,
    fontWeight: '600',
    color: '#ffffff',
  },
})
