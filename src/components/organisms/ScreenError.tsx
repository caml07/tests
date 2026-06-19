import { View, StyleSheet } from 'react-native'
import { ErrorState } from '@/src/components/molecules'
import { Spacing } from '@/src/utils/tokens'

interface ScreenErrorProps {
  message: string
  onRetry?: () => void
}

export function ScreenError({ message, onRetry }: ScreenErrorProps) {
  return (
    <View style={styles.container}>
      <ErrorState message={message} onRetry={onRetry} />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: Spacing.screen,
  },
})
