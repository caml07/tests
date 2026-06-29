import { View, StyleSheet } from 'react-native'
import { Skeleton } from '@/src/shared/atoms'
import { BorderRadius, space } from '@/src/shared/utils/tokens'

export function MenuItemSkeleton() {
  return (
    <View style={styles.card}>
      <View style={styles.content}>
        <Skeleton width="70%" height={20} borderRadius={4} />
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: 'transparent',
    overflow: 'hidden',
  },
  content: {
    padding: space[4],
  },
})
