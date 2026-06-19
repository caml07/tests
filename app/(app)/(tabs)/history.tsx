import { View, Text, FlatList, StyleSheet } from 'react-native'
import { Icon } from '@/src/components/atoms/Icon'
import Colors from '@/constants/Colors'
import { useColorScheme } from '@/components/useColorScheme'
import { Screen } from '@/src/components/organisms/Screen'
import { Typography, Spacing, space } from '@/src/utils/tokens'

export default function HistoryScreen() {
  const colorScheme = useColorScheme()
  const colors = Colors[colorScheme]

  const pedidos: any[] = []

  return (
    <Screen edges={['bottom']}>
      {pedidos.length === 0 ? (
        <View style={styles.empty}>
          <View style={[styles.iconCircle, { backgroundColor: colors.surfaceAlt }]}>
            <Icon name="clock.fill" tintColor={colors.textTertiary} size={32} />
          </View>
          <Text style={[styles.emptyTitle, { color: colors.text }]}>Sin pedidos aún</Text>
          <Text style={[styles.emptyMessage, { color: colors.textSecondary }]}>
            Los pedidos enviados aparecerán acá para que puedas consultarlos después.
          </Text>
        </View>
      ) : (
        <FlatList
          data={pedidos}
          keyExtractor={(_item: any, i: number) => String(i)}
          contentContainerStyle={styles.list}
          renderItem={() => null}
        />
      )}
    </Screen>
  )
}

const styles = StyleSheet.create({
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.screen,
    gap: space[3],
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: space[2],
  },
  emptyTitle: {
    ...Typography.title3,
  },
  emptyMessage: {
    ...Typography.body,
    textAlign: 'center',
    maxWidth: 280,
  },
  list: {
    paddingHorizontal: Spacing.screen,
    paddingBottom: Spacing.xxl,
  },
})
