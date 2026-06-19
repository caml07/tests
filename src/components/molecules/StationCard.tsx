import { View, Text, StyleSheet } from 'react-native'
import { Icon } from '@/src/components/atoms/Icon'
import { useColorScheme } from '@/components/useColorScheme'
import Colors from '@/constants/Colors'
import { PressableScale } from '@/src/components/atoms/PressableScale'
import { Typography, BorderRadius, space, shadow } from '@/src/utils/tokens'

interface StationCardProps {
  id: string
  nombre: string
  selected: boolean
  onPress: () => void
}

export function StationCard({ id, nombre, selected, onPress }: StationCardProps) {
  const colorScheme = useColorScheme()
  const colors = Colors[colorScheme]

  return (
    <PressableScale onPress={onPress} style={styles.wrapper}>
      <View
        style={[
          styles.card,
          selected ? shadow.md : shadow.sm,
          {
            backgroundColor: selected ? colors.primaryLight : colors.card,
            borderColor: selected ? colors.primary : colors.border,
          },
        ]}
      >
        {selected && <View style={[styles.accent, { backgroundColor: colors.primary }]} />}
        <View
          style={[
            styles.iconBg,
            { backgroundColor: selected ? colors.primary : colors.surfaceAlt },
          ]}
        >
          <Icon
            name="building.2.fill"
            tintColor={selected ? '#ffffff' : colors.textSecondary}
            size={24}
          />
        </View>
        <Text
          style={[
            styles.nombre,
            { color: selected ? colors.primary : colors.text },
          ]}
          numberOfLines={2}
        >
          {nombre}
        </Text>
        {selected && (
          <Text style={[styles.selectedLabel, { color: colors.primary }]}>
            Seleccionado
          </Text>
        )}
      </View>
    </PressableScale>
  )
}

const styles = StyleSheet.create({
  wrapper: {
    width: '47%',
  },
  card: {
    minHeight: 150,
    borderRadius: BorderRadius.lg,
    borderWidth: 1.5,
    alignItems: 'center',
    paddingTop: 34,
    paddingBottom: space[4],
    paddingHorizontal: space[4],
    position: 'relative',
  },
  accent: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 5,
    borderTopLeftRadius: BorderRadius.lg,
    borderBottomLeftRadius: BorderRadius.lg,
  },
  iconBg: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -44,
    marginBottom: space[2],
  },
  nombre: {
    ...Typography.title3,
    textAlign: 'center',
  },
  selectedLabel: {
    ...Typography.caption1,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: space[1],
  },
})
