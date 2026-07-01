import { vi } from 'vitest'
vi.mock('react-native-reanimated', () => ({ useSharedValue: (v:any) => ({ value: v }), useAnimatedStyle: (cb:any) => cb(), createAnimatedComponent: (c:any) => c, withSpring: (v:any) => v }))
vi.mock('expo-haptics', () => ({ impactAsync: vi.fn(), ImpactFeedbackStyle: { Soft: 'soft' } }))
vi.mock('lucide-react-native', () => {
  const i = (n:string) => (p:any) => null;
  return { AlertCircle: i('x'), AlertTriangle: i('x'), ArrowRight: i('x'), BedDouble: i('x'), Building2: i('x'), Check: i('x'), CheckCircle: i('x'), ChevronDown: i('x'), ChevronLeft: i('x'), ChevronRight: i('x'), ChevronUp: i('x'), Clock: i('x'), Coffee: i('x'), FileText: i('x'), Fingerprint: i('x'), Flame: i('x'), Heart: i('x'), HelpCircle: i('x'), Inbox: i('x'), Lock: i('x'), LogOut: i('x'), Mars: i('x'), Moon: i('x'), Plus: i('x'), Search: i('x'), ShoppingCart: i('x'), Sun: i('x'), Sunrise: i('x'), User: i('x'), Venus: i('x'), X: i('x') }
})
vi.mock('@/src/shared/utils/tokens', () => ({ color: { transparent: 'transparent' }, space: [0,2,4,8,12,16,20], Typography: { button: {} }, BorderRadius: { md: 12 }, spring: { press: {} } }))
vi.mock('@/components/useColorScheme', () => ({ useColorScheme: () => 'light' }))
vi.mock('@/constants/Colors', () => ({ default: { light: { primary: '#007AFF', text: '#000', surfaceAlt: '#F0F0F0', white: '#FFF', error: '#FF3B30', surface: '#FFF' }, dark: { primary: '#0A84FF', text: '#FFF', surfaceAlt: '#2C2C2E', white: '#FFF', error: '#FF453A', surface: '#000' } } }))

