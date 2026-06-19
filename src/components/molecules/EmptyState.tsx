import { View, Text, StyleSheet } from 'react-native'
import { Icon } from '@/src/components/atoms/Icon'
import { PressableScale } from '@/src/components/atoms/PressableScale'
import Colors from '@/constants/Colors'
import { useColorScheme } from '@/components/useColorScheme'
import { space, Typography, BorderRadius, color } from '@/src/utils/tokens'

interface EmptyStateProps {
  title: string
  message: string
  actionLabel?: string
  onAction?: () => void
}

export function EmptyState({ title, message, actionLabel, onAction }: EmptyStateProps) {
  const colorScheme = useColorScheme()
  const colors = Colors[colorScheme]

  return (
    <View style={styles.container}>
      <Icon name="tray.fill" tintColor={colors.textTertiary} size={40} />
      <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
      <Text style={[styles.message, { color: colors.textSecondary }]}>{message}</Text>
      {actionLabel && (
        <PressableScale onPress={onAction}>
          <View style={[styles.button, { backgroundColor: colors.primary }]}>
            <Text style={styles.buttonText}>{actionLabel}</Text>
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
  title: {
    ...Typography.title3,
    textAlign: 'center',
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
  },
  buttonText: {
    color: color.white,
    ...Typography.button,
  },
})
