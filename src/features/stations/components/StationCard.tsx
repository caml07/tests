import { View, Text, StyleSheet } from 'react-native'
import { Icon } from '@/src/shared/atoms/Icon'
import { useColorScheme } from '@/components/useColorScheme'
import Colors from '@/constants/Colors'
import { PressableScale } from '@/src/shared/atoms/PressableScale'
import { Typography, BorderRadius, space, shadow } from '@/src/shared/utils/tokens'

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
            borderWidth: selected ? 1.5 : 0,
            borderColor: selected ? colors.primary : 'transparent',
          },
        ]}
      >
        <Icon
          name="building.2.fill"
          tintColor={selected ? colors.primary : colors.textSecondary}
          size={28}
        />
        <Text
          style={[
            styles.nombre,
            { color: selected ? colors.primary : colors.text },
          ]}
          numberOfLines={2}
        >
          {nombre}
        </Text>
      </View>
    </PressableScale>
  )
}

const styles = StyleSheet.create({
  wrapper: {
    width: '47%',
  },
  card: {
    minHeight: 130,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    padding: space[5],
    gap: space[3],
  },
  nombre: {
    ...Typography.title3,
    textAlign: 'center',
  },
})
