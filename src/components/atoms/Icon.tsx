import { Platform, View, ViewStyle, ColorValue } from 'react-native'
import { SymbolView } from 'expo-symbols'
import { MaterialCommunityIcons } from '@expo/vector-icons'

const SF_TO_MATERIAL: Record<string, string> = {
  'building.2.fill': 'domain',
  'heart.fill': 'heart',
  'rectangle.portrait.and.arrow.right': 'logout',
  'person.fill': 'account',
  'lock.fill': 'lock',
  'arrow.right': 'arrow-right',
  'exclamationmark.circle.fill': 'alert-circle',
  'chevron.left': 'chevron-left',
  'magnifyingglass': 'magnify',
  'bed.double.fill': 'bed',
  'exclamationmark.triangle.fill': 'alert-outline',
  'note.text': 'note-text-outline',
  'cart.fill': 'cart',
  'clock.fill': 'clock-outline',
  'tray.fill': 'tray-full',
  'checkmark': 'check',
  'xmark': 'close',
  'checkmark.circle.fill': 'check-circle',
  'building.2': 'domain',
  'sunrise.fill': 'weather-sunset',
  'sun.max.fill': 'weather-sunny',
  'cup.and.saucer.fill': 'coffee',
  'moon.fill': 'weather-night',
  'plus': 'plus',
}

interface IconProps {
  name: string
  size?: number
  tintColor?: string | ColorValue
  style?: ViewStyle
}

export function Icon({ name, size = 24, tintColor, style }: IconProps) {
  if (Platform.OS === 'ios') {
    return (
      <View style={[{ width: size, height: size }, style]}>
        <SymbolView name={name as any} tintColor={tintColor as string} size={size} />
      </View>
    )
  }

  const materialName = SF_TO_MATERIAL[name] || 'help-circle-outline'
  return (
    <View style={[{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }, style]}>
      <MaterialCommunityIcons name={materialName as any} size={size} color={tintColor as string} />
    </View>
  )
}
