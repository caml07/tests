import Module from 'module'
import path from 'path'

const origResolve: any = (Module as any)._resolveFilename
;(Module as any)._resolveFilename = function (
  request: string,
  parent: any,
  isMain: boolean,
  options: any,
): string {
  if (request === 'react-native' || request.startsWith('react-native/')) {
    const mockDir = path.resolve(__dirname, '__mocks__', 'react-native')
    if (request === 'react-native') {
      return path.join(mockDir, 'index.js')
    }
    return path.join(mockDir, request.slice('react-native/'.length))
  }
  return origResolve(request, parent, isMain, options)
}

import { vi } from 'vitest'

vi.mock('react-native-reanimated', () => {
  const MockPressable = ({ children, onPress, ...props }: any) =>
    require('react').createElement('button', { ...props, onClick: onPress }, children)

  return {
    useSharedValue: (v: number) => ({ value: v }),
    useAnimatedStyle: (cb: () => Record<string, unknown>) => cb(),
    createAnimatedComponent: (comp: unknown) => comp,
    withSpring: (v: number) => v,
    withTiming: (v: number) => v,
    withSequence: (...vals: number[]) => vals[vals.length - 1],
    interpolateColor: () => '#000',
    Pressable: MockPressable,
    default: {
      createAnimatedComponent: (comp: unknown) => comp,
      View: 'View',
      Text: 'Text',
      Pressable: MockPressable,
    },
  }
})

vi.mock('expo-haptics', () => ({
  impactAsync: vi.fn(),
  ImpactFeedbackStyle: { Soft: 'soft', Light: 'light', Medium: 'medium', Heavy: 'heavy' },
}))

vi.mock('@react-native-community/netinfo', () => ({
  useNetInfo: () => ({ isConnected: true, isInternetReachable: true }),
  fetch: () => Promise.resolve({ isConnected: true }),
  addEventListener: () => () => {},
}))

vi.mock('expo-local-authentication', () => ({
  hasHardwareAsync: () => Promise.resolve(false),
  isEnrolledAsync: () => Promise.resolve(false),
  authenticateAsync: () => Promise.resolve({ success: false, error: 'canceled' }),
}))

vi.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
  SafeAreaProvider: ({ children }: { children: React.ReactNode }) => children,
}))

vi.mock('expo-router', () => ({
  router: { navigate: vi.fn(), push: vi.fn(), back: vi.fn(), replace: vi.fn() },
  Stack: { Screen: 'Screen', Protected: 'Protected' },
  useLocalSearchParams: () => ({}),
  useRouter: () => ({ navigate: vi.fn(), push: vi.fn(), back: vi.fn(), replace: vi.fn() }),
}))

vi.mock('lucide-react-native', () => {
  const MockIcon = (props: any) => null
  const icons = [
    'AlertCircle', 'AlertTriangle', 'ArrowRight', 'BedDouble', 'Building2',
    'Check', 'CheckCircle', 'ChevronDown', 'ChevronLeft', 'ChevronRight',
    'ChevronUp', 'Clock', 'Coffee', 'FileText', 'Fingerprint', 'Flame',
    'Heart', 'HelpCircle', 'Inbox', 'Lock', 'LogOut', 'Moon', 'Plus',
    'Search', 'ShoppingCart', 'Sun', 'Sunrise', 'User', 'X',
  ]
  const exports: Record<string, any> = {}
  for (const name of icons) exports[name] = MockIcon
  return exports
})

vi.mock('@/src/shared/utils/tokens', () => ({
  color: { transparent: 'transparent' },
  space: [0, 2, 4, 8, 12, 16, 20, 24, 32, 40, 48, 64],
  Typography: { button: { fontFamily: 'system', fontSize: 16, fontWeight: '600' } },
  BorderRadius: { md: 12 },
  spring: { press: { damping: 15, stiffness: 300 } },
  Spacing: {},
  radius: {},
  Shadows: {},
  shadow: {},
  TAB_BAR_H: 64,
  zIndex: {},
  tokens: {},
  darkColor: {},
}))

vi.mock('@/components/useColorScheme', () => ({
  useColorScheme: () => 'light',
}))

vi.mock('@/constants/Colors', () => ({
  default: {
    light: {
      primary: '#007AFF',
      text: '#000',
      surfaceAlt: '#F0F0F0',
      white: '#FFF',
      error: '#FF3B30',
      surface: '#FFF',
      textSecondary: '#666',
      textTertiary: '#999',
      background: '#FFF',
      card: '#FFF',
      primaryLight: '#E8F0FE',
    },
    dark: {
      primary: '#0A84FF',
      text: '#FFF',
      surfaceAlt: '#2C2C2E',
      white: '#FFF',
      error: '#FF453A',
      surface: '#000',
      textSecondary: '#999',
      textTertiary: '#666',
      background: '#000',
      card: '#1C1C1E',
      primaryLight: '#1C2A3E',
    },
  },
}))
