import { View, Text, FlatList, StyleSheet } from 'react-native'
import { Icon } from '@/src/components/atoms/Icon'
import Colors from '@/constants/Colors'
import { useColorScheme } from '@/components/useColorScheme'
import { Screen } from '@/src/components/organisms/Screen'
import { Typography, Spacing, space } from '@/src/utils/tokens'

export default function CartScreen() {
  const colorScheme = useColorScheme()
  const colors = Colors[colorScheme]

  const items: any[] = []

  return (
    <Screen edges={['bottom']}>
      {items.length === 0 ? (
        <View style={styles.empty}>
          <View style={[styles.iconCircle, { backgroundColor: colors.surfaceAlt }]}>
            <Icon name="cart.fill" tintColor={colors.textTertiary} size={32} />
          </View>
          <Text style={[styles.emptyTitle, { color: colors.text }]}>Carrito vacío</Text>
          <Text style={[styles.emptyMessage, { color: colors.textSecondary }]}>
            Seleccioná comidas del menú del paciente para armar el pedido.
          </Text>
        </View>
      ) : (
        <FlatList
          data={items}
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
