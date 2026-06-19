import { color, darkColor } from '@/src/utils/tokens'

const Colors = {
  light: {
    ...color,
    text: color.textPrimary,
    background: color.background,
    tint: color.primary,
    tabIconDefault: color.textTertiary,
    tabIconSelected: color.secondary,
    muted: color.textSecondary,
    outline: color.border,
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
    tabIconSelected: darkColor.secondary,
    muted: darkColor.textSecondary,
    outline: darkColor.border,
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
