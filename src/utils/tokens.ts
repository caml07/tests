import { Platform } from 'react-native'

export const color = {
  primary: '#0284c7',
  primaryLight: '#e0f2fe',
  primaryDark: '#0369a1',
  secondary: '#0ea5e9',
  background: '#f8fafc',
  surface: '#f8fafc',
  surfaceAlt: '#f1f5f9',
  border: '#e2e8f0',
  borderStrong: '#cbd5e1',
  textPrimary: '#0f172a',
  textSecondary: '#475569',
  textTertiary: '#94a3b8',
  textDisabled: '#cbd5e1',
  textInverse: '#ffffff',
  success: '#22c55e',
  successLight: '#dcfce7',
  error: '#ef4444',
  errorLight: '#fee2e2',
  warning: '#f59e0b',
  warningLight: '#fef3c7',
  info: '#0284c7',
  infoLight: '#e0f2fe',
  overlay: 'rgba(0,0,0,0.4)',
  overlayLight: 'rgba(0,0,0,0.15)',
  black: '#000000',
  white: '#ffffff',
  transparent: 'transparent',
  card: '#ffffff',
} as const

export const darkColor = {
  primary: '#0ea5e9',
  primaryLight: '#0c4a6e',
  primaryDark: '#38bdf8',
  secondary: '#0284c7',
  background: '#0f172a',
  surface: '#0f172a',
  surfaceAlt: '#1e293b',
  border: '#334155',
  borderStrong: '#475569',
  textPrimary: '#f1f5f9',
  textSecondary: '#94a3b8',
  textTertiary: '#64748b',
  textDisabled: '#475569',
  textInverse: '#0f172a',
  success: '#4ade80',
  successLight: '#14532d',
  error: '#f87171',
  errorLight: '#450a0a',
  warning: '#fbbf24',
  warningLight: '#451a03',
  info: '#38bdf8',
  infoLight: '#0c4a6e',
  overlay: 'rgba(0,0,0,0.6)',
  overlayLight: 'rgba(0,0,0,0.3)',
  black: '#000000',
  white: '#ffffff',
  transparent: 'transparent',
  card: '#1e293b',
}

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
  screen: 24,
  cardPadding: 16,
  sectionGap: 24,
  listGap: 12,
} as const

export const space = {
  0: 0,
  1: 4,
  2: 8,
  3: 12,
  4: 16,
  5: 20,
  6: 24,
  7: 28,
  8: 32,
  10: 40,
  12: 48,
  16: 64,
  20: 80,
} as const

const fontFamily = Platform.select({
  ios: 'PlusJakartaSans',
  android: 'PlusJakartaSans',
  default: undefined,
}) as string | undefined

const fontFamilyItalic = Platform.select({
  ios: 'PlusJakartaSans-Italic',
  android: 'PlusJakartaSans-Italic',
  default: undefined,
}) as string | undefined

export const Typography = {
  display: { fontSize: 34, lineHeight: 41, fontWeight: '700' as const, fontFamily },
  title1: { fontSize: 28, lineHeight: 34, fontWeight: '700' as const, fontFamily },
  title2: { fontSize: 22, lineHeight: 28, fontWeight: '700' as const, fontFamily },
  title3: { fontSize: 20, lineHeight: 25, fontWeight: '600' as const, fontFamily },
  headline: { fontSize: 17, lineHeight: 22, fontWeight: '600' as const, fontFamily },
  body: { fontSize: 17, lineHeight: 22, fontWeight: '400' as const, fontFamily },
  bodyBold: { fontSize: 17, lineHeight: 22, fontWeight: '600' as const, fontFamily },
  callout: { fontSize: 16, lineHeight: 21, fontWeight: '400' as const, fontFamily },
  subhead: { fontSize: 15, lineHeight: 20, fontWeight: '400' as const, fontFamily },
  footnote: { fontSize: 13, lineHeight: 18, fontWeight: '400' as const, fontFamily },
  caption1: { fontSize: 12, lineHeight: 16, fontWeight: '400' as const, fontFamily },
  caption2: { fontSize: 11, lineHeight: 13, fontWeight: '400' as const, fontFamily },
  italic: { fontSize: 15, lineHeight: 20, fontWeight: '400' as const, fontFamily: fontFamilyItalic },
  label: { fontSize: 12, lineHeight: 16, fontWeight: '600' as const, fontFamily, textTransform: 'uppercase' as const },
  button: { fontSize: 16, lineHeight: 22, fontWeight: '600' as const, fontFamily },
  tab: { fontSize: 11, lineHeight: 14, fontWeight: '500' as const, fontFamily },

  // Legacy aliases for backward compat during refactor
  h1: { fontSize: 34, lineHeight: 41, fontWeight: '700' as const, fontFamily },
  h2: { fontSize: 24, lineHeight: 32, fontWeight: '700' as const, fontFamily },
  h3: { fontSize: 20, lineHeight: 28, fontWeight: '600' as const, fontFamily },
  caption: { fontSize: 14, lineHeight: 20, fontWeight: '400' as const, fontFamily },
} as const

export const BorderRadius = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xl2: 24,
  full: 9999,
} as const

export const radius = BorderRadius

export const Shadows = {
  none: {},
  sm: Platform.select({
    ios: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 4,
    },
    android: { elevation: 1 },
    default: {},
  }),
  md: Platform.select({
    ios: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.08,
      shadowRadius: 12,
    },
    android: { elevation: 3 },
    default: {},
  }),
  lg: Platform.select({
    ios: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.1,
      shadowRadius: 24,
    },
    android: { elevation: 6 },
    default: {},
  }),
} as const

export const shadow = Shadows

export const spring = {
  gentle: { damping: 20, stiffness: 200 } as const,
  bouncy: { damping: 12, stiffness: 300 } as const,
  snappy: { damping: 25, stiffness: 400 } as const,
  press: { damping: 15, stiffness: 350, mass: 0.8 } as const,
} as const

export const zIndex = {
  base: 0,
  card: 10,
  header: 100,
  modal: 200,
  toast: 300,
  overlay: 400,
} as const

export const tokens = {
  color,
  darkColor,
  Spacing,
  space,
  Typography,
  BorderRadius,
  radius,
  Shadows,
  shadow,
  spring,
  zIndex,
} as const
