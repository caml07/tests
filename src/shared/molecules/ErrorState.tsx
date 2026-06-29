import { View, Text, StyleSheet } from 'react-native'
import { Icon } from '@/src/shared/atoms/Icon'
import { PressableScale } from '@/src/shared/atoms/PressableScale'
import Colors from '@/constants/Colors'
import { useColorScheme } from '@/components/useColorScheme'
import { space, Typography, BorderRadius } from '@/src/shared/utils/tokens'

interface ErrorStateProps {
  message: string
  onRetry?: () => void
}

export function ErrorState({ message, onRetry }: ErrorStateProps) {
  const colorScheme = useColorScheme()
  const colors = Colors[colorScheme]

  return (
    <View style={styles.container}>
      <Icon name="exclamationmark.triangle.fill" tintColor={colors.warning} size={48} />
      <Text style={[styles.message, { color: colors.textSecondary }]}>{message}</Text>
      {onRetry && (
        <PressableScale onPress={onRetry}>
          <View style={[styles.button, { backgroundColor: colors.surfaceAlt }]}>
            <Text style={[styles.buttonText, { color: colors.text }]}>Reintentar</Text>
          </View>
        </PressableScale>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: space[3],
    padding: space[10],
  },
  message: {
    ...Typography.body,
    textAlign: 'center',
  },
  button: {
    marginTop: space[3],
    paddingHorizontal: space[6],
    paddingVertical: space[3],
    borderRadius: BorderRadius.md,
  },
  buttonText: {
    ...Typography.button,
  },
})
