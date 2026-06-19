import { View, Image, StyleSheet } from 'react-native'
import { useColorScheme } from '@/components/useColorScheme'
import Colors from '@/constants/Colors'

export function SplashScreen() {
  const colorScheme = useColorScheme()
  const colors = Colors[colorScheme]

  return (
    <View style={[styles.container, { backgroundColor: colors.primary }]}>
      <Image
        source={require('@/assets/images/hospital_vivian_pellas.png')}
        style={styles.logo}
        resizeMode="contain"
        accessibilityLabel="Logo Hospital Vivian Pellas"
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: 200,
    height: 200,
  },
})
