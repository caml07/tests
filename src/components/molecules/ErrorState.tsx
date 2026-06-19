import { View, Text, StyleSheet } from 'react-native'
import { Icon } from '@/src/components/atoms/Icon'
import { PressableScale } from '@/src/components/atoms/PressableScale'
import Colors from '@/constants/Colors'
import { useColorScheme } from '@/components/useColorScheme'
import { space, Typography, BorderRadius } from '@/src/utils/tokens'

interface ErrorStateProps {
  message: string
  onRetry?: () => void
}

export function ErrorState({ message, onRetry }: ErrorStateProps) {
  const colorScheme = useColorScheme()
  const colors = Colors[colorScheme]

  return (
    <View style={styles.container}>
      <Icon name="exclamationmark.triangle.fill" tintColor={colors.warning} size={40} />
      <Text style={[styles.message, { color: colors.textSecondary }]}>{message}</Text>
      {onRetry && (
        <PressableScale onPress={onRetry}>
          <View style={[styles.button, { borderColor: colors.border }]}>
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
    gap: space[2],
    padding: space[8],
  },
  message: {
    ...Typography.body,
    textAlign: 'center',
  },
  button: {
    marginTop: space[2],
    paddingHorizontal: space[6],
    paddingVertical: space[3],
    borderRadius: BorderRadius.md,
    borderWidth: 1,
  },
  buttonText: {
    ...Typography.button,
  },
})
