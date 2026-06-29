import { Platform, View, type ViewStyle } from 'react-native'
import { BlurView } from 'expo-blur'

interface BlurWrapperProps {
  intensity?: number
  tint?: 'light' | 'dark' | 'default'
  style?: ViewStyle
  children: React.ReactNode
}

export function BlurWrapper({ intensity = 80, tint = 'dark', style, children }: BlurWrapperProps) {
  if (Platform.OS === 'ios') {
    return (
      <BlurView intensity={intensity} tint={tint} style={style}>
        {children}
      </BlurView>
    )
  }

  return (
    <View style={[style, { backgroundColor: tint === 'dark' ? 'rgba(0,0,0,0.6)' : 'rgba(255,255,255,0.5)' }]}>
      {children}
    </View>
  )
}
