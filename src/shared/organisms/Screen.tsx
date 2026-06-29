import { View, StyleSheet, StatusBar, ViewStyle, Platform } from 'react-native'
import type { ReactNode } from 'react'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useColorScheme } from '@/components/useColorScheme'
import Colors from '@/constants/Colors'
import { ConnectivityBanner } from '@/src/shared/atoms/ConnectivityBanner'

interface ScreenProps {
  children: ReactNode
  style?: ViewStyle
  edges?: ('top' | 'bottom' | 'left' | 'right')[]
}

export function Screen({ children, style, edges = ['top', 'bottom'] }: ScreenProps) {
  const colorScheme = useColorScheme()
  const colors = Colors[colorScheme]
  const insets = useSafeAreaInsets()

  return (
    <View style={[
      styles.screen,
      { backgroundColor: colors.background },
      edges.includes('top') && { paddingTop: insets.top },
      edges.includes('bottom') && { paddingBottom: insets.bottom },
      edges.includes('left') && { paddingLeft: insets.left },
      edges.includes('right') && { paddingRight: insets.right },
      style,
    ]}>
      <StatusBar
        barStyle={colorScheme === 'dark' ? 'light-content' : 'dark-content'}
        backgroundColor={Platform.OS === 'android' ? 'transparent' : undefined}
        translucent={Platform.OS === 'android' ? true : undefined}
      />
      <ConnectivityBanner />
      {children}
    </View>
  )
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    position: 'relative',
  },
})
