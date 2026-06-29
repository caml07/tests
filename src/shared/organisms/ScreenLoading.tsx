import { View, StyleSheet } from 'react-native'
import { Skeleton } from '@/src/shared/atoms'
import { Spacing } from '@/src/shared/utils/tokens'

interface ScreenLoadingProps {
  count?: number
  itemHeight?: number
  borderRadius?: number
}

export function ScreenLoading({ count = 6, itemHeight = 130, borderRadius = 16 }: ScreenLoadingProps) {
  return (
    <View style={styles.container}>
      {Array.from({ length: count }, (_, i) => (
        <Skeleton key={i} width="100%" height={itemHeight} borderRadius={borderRadius} />
      ))}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: Spacing.screen,
    gap: Spacing.md,
  },
})
