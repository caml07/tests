import { color, darkColor } from '@/src/shared/utils/tokens'

const Colors = {
  light: {
    ...color,
    text: color.textPrimary,
    background: color.background,
    tint: color.primary,
    tabIconDefault: color.textTertiary,
    tabIconSelected: color.primary,
    muted: color.textSecondary,
    surface: color.surface,
    card: color.card,
    primary: color.primary,
    error: color.error,
    success: color.success,
    warning: color.warning,
    overlay: color.overlay,
    secondary: color.secondary,
  },
  dark: {
    ...darkColor,
    text: darkColor.textPrimary,
    background: darkColor.background,
    tint: darkColor.primary,
    tabIconDefault: darkColor.textTertiary,
    tabIconSelected: darkColor.primary,
    muted: darkColor.textSecondary,
    surface: darkColor.surface,
    card: darkColor.card,
    primary: darkColor.primary,
    error: darkColor.error,
    success: darkColor.success,
    warning: darkColor.warning,
    overlay: darkColor.overlay,
    secondary: darkColor.secondary,
  },
}

export type Colors = typeof Colors

export default Colors
