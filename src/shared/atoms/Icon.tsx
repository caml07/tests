import { View, type ViewStyle, type ColorValue } from 'react-native'
import {
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  BedDouble,
  Building2,
  Check,
  CheckCircle,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Clock,
  Coffee,
  FileText,
  Fingerprint,
  Flame,
  Heart,
  HelpCircle,
  Inbox,
  Lock,
  LogOut,
  Moon,
  Plus,
  Search,
  ShoppingCart,
  Sun,
  Sunrise,
  User,
  X,
} from 'lucide-react-native'

const LUCIDE_MAP = {
  'building.2.fill': Building2,
  'heart.fill': Heart,
  'rectangle.portrait.and.arrow.right': LogOut,
  'person.fill': User,
  'lock.fill': Lock,
  'arrow.right': ArrowRight,
  'exclamationmark.circle.fill': AlertCircle,
  'chevron.left': ChevronLeft,
  'chevron.right': ChevronRight,
  'chevron.up': ChevronUp,
  'chevron.down': ChevronDown,
  'magnifyingglass': Search,
  'bed.double.fill': BedDouble,
  'exclamationmark.triangle.fill': AlertTriangle,
  'note.text': FileText,
  'cart.fill': ShoppingCart,
  'clock.fill': Clock,
  'tray.fill': Inbox,
  'checkmark': Check,
  'xmark': X,
  'checkmark.circle.fill': CheckCircle,
  'building.2': Building2,
  'sunrise.fill': Sunrise,
  'sun.max.fill': Sun,
  'cup.and.saucer.fill': Coffee,
  'moon.fill': Moon,
  'plus': Plus,
  'questionmark.circle': HelpCircle,
  'flame.fill': Flame,
  'fingerprint': Fingerprint,
} as const

export type IconName = keyof typeof LUCIDE_MAP

interface IconProps {
  name: IconName
  size?: number
  tintColor?: string | ColorValue
  style?: ViewStyle
}

export function Icon({ name, size = 24, tintColor, style }: IconProps) {
  const LucideIcon = LUCIDE_MAP[name] || HelpCircle
  return (
    <View style={[{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }, style]}>
      <LucideIcon size={size} color={tintColor as string} />
    </View>
  )
}
