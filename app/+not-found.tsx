import { Link, Stack } from 'expo-router'
import { StyleSheet } from 'react-native'
import { Text, View } from '@/components/Themed'
import Colors from '@/constants/Colors'
import { useColorScheme } from '@/components/useColorScheme'
import { Typography, Spacing } from '@/src/utils/tokens'

export default function NotFoundScreen() {
  const colorScheme = useColorScheme()
  const colors = Colors[colorScheme]

  return (
    <>
      <Stack.Screen options={{ title: 'Oops!' }} />
      <View style={styles.container}>
        <Text style={styles.title}>Esta pantalla no existe.</Text>
        <Link href="/" style={styles.link}>
          <Text style={[styles.linkText, { color: colors.primary }]}>Ir al inicio</Text>
        </Link>
      </View>
    </>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.lg,
  },
  title: {
    ...Typography.title2,
  },
  link: {
    marginTop: Spacing.md,
    paddingVertical: Spacing.md,
  },
  linkText: {
    ...Typography.body,
  },
})
