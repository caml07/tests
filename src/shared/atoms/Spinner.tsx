import { ActivityIndicator, View, StyleSheet } from 'react-native'
import Colors from '@/constants/Colors'
import { useColorScheme } from '@/components/useColorScheme'

interface SpinnerProps {
  size?: 'small' | 'large'
  fullScreen?: boolean
}

export function Spinner({ size = 'large', fullScreen = false }: SpinnerProps) {
  const colorScheme = useColorScheme()
  const color = Colors[colorScheme].primary

  if (fullScreen) {
    return (
      <View style={styles.fullScreen} accessibilityLabel="Cargando">
        <ActivityIndicator size={size} color={color} />
      </View>
    )
  }

  return <ActivityIndicator size={size} color={color} accessibilityLabel="Cargando" />
}

const styles = StyleSheet.create({
  fullScreen: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
})
