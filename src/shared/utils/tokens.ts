import { Platform } from "react-native";
import { BREAKPOINTS } from "@/src/shared/utils/breakpoints";

export const color = {
  primary: "#0284c7",
  primaryLight: "#e0f2fe",
  primaryDark: "#0369a1",
  secondary: "#0ea5e9",
  background: "#f5f2ed",
  surface: "#f5f2ed",
  surfaceAlt: "#ede8e3",
  border: "transparent",
  borderStrong: "transparent",
  textPrimary: "#1a1a1a",
  textSecondary: "#5c5c5c",
  textTertiary: "#9c9c9c",
  textDisabled: "#cbd5e1",
  textInverse: "#ffffff",
  success: "#22c55e",
  successLight: "#dcfce7",
  error: "#ef4444",
  errorLight: "#fee2e2",
  warning: "#f59e0b",
  warningLight: "#fef3c7",
  info: "#0284c7",
  infoLight: "#e0f2fe",
  overlay: "rgba(0,0,0,0.4)",
  overlayLight: "rgba(0,0,0,0.15)",
  black: "#000000",
  white: "#ffffff",
  transparent: "transparent",
  card: "#ffffff",
} as const;

export const darkColor = {
  primary: "#38bdf8",
  primaryLight: "#0c4a6e",
  primaryDark: "#7dd3fc",
  secondary: "#0ea5e9",
  background: "#1a1a1a",
  surface: "#1a1a1a",
  surfaceAlt: "#2a2a2a",
  border: "transparent",
  borderStrong: "transparent",
  textPrimary: "#f0ece4",
  textSecondary: "#a8a096",
  textTertiary: "#706860",
  textDisabled: "#475569",
  textInverse: "#1a1a1a",
  success: "#4ade80",
  successLight: "#14532d",
  error: "#f87171",
  errorLight: "#450a0a",
  warning: "#fbbf24",
  warningLight: "#451a03",
  info: "#38bdf8",
  infoLight: "#0c4a6e",
  overlay: "rgba(0,0,0,0.6)",
  overlayLight: "rgba(0,0,0,0.3)",
  black: "#000000",
  white: "#ffffff",
  transparent: "transparent",
  card: "#2a2a2a",
} as const;

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
  screen: 40,
  cardPadding: 24,
  sectionGap: 40,
  listGap: 24,
} as const;

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
} as const;

const fontFamily = "PlusJakartaSans";
const fontFamilyItalic = "PlusJakartaSans-Italic";
const loraItalic = "Lora-Italic";

export const Typography = {
  display: {
    fontSize: 34,
    lineHeight: 41,
    fontWeight: "700" as const,
    fontFamily,
  },
  title1: {
    fontSize: 28,
    lineHeight: 34,
    fontWeight: "700" as const,
    fontFamily,
  },
  title2: {
    fontSize: 22,
    lineHeight: 28,
    fontWeight: "700" as const,
    fontFamily,
  },
  title3: {
    fontSize: 20,
    lineHeight: 25,
    fontWeight: "600" as const,
    fontFamily,
  },
  headline: {
    fontSize: 17,
    lineHeight: 22,
    fontWeight: "600" as const,
    fontFamily,
  },
  body: {
    fontSize: 17,
    lineHeight: 22,
    fontWeight: "400" as const,
    fontFamily,
  },
  bodyBold: {
    fontSize: 17,
    lineHeight: 22,
    fontWeight: "600" as const,
    fontFamily,
  },
  callout: {
    fontSize: 16,
    lineHeight: 21,
    fontWeight: "400" as const,
    fontFamily,
  },
  subhead: {
    fontSize: 15,
    lineHeight: 20,
    fontWeight: "400" as const,
    fontFamily,
  },
  footnote: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "400" as const,
    fontFamily,
  },
  caption1: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "400" as const,
    fontFamily,
  },
  caption2: {
    fontSize: 11,
    lineHeight: 13,
    fontWeight: "400" as const,
    fontFamily,
  },
  loraItalic: {
    fontSize: 15,
    lineHeight: 20,
    fontWeight: "500" as const,
    fontFamily: loraItalic,
  },
  loraCaption: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "500" as const,
    fontFamily: loraItalic,
  },
  loraLabel: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "500" as const,
    fontFamily: loraItalic,
  },
  label: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "600" as const,
    fontFamily,
    letterSpacing: 0.5 as const,
  },
  button: {
    fontSize: 16,
    lineHeight: 22,
    fontWeight: "600" as const,
    fontFamily,
  },
  tab: { fontSize: 11, lineHeight: 14, fontWeight: "500" as const, fontFamily },

  // Legacy aliases for backward compat during refactor
  italic: {
    fontSize: 15,
    lineHeight: 20,
    fontWeight: "500" as const,
    fontFamily: loraItalic,
  },
  h1: { fontSize: 34, lineHeight: 41, fontWeight: "700" as const, fontFamily },
  h2: { fontSize: 24, lineHeight: 32, fontWeight: "700" as const, fontFamily },
  h3: { fontSize: 20, lineHeight: 28, fontWeight: "600" as const, fontFamily },
  caption: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "400" as const,
    fontFamily,
  },
} as const;

export const BorderRadius = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xl2: 24,
  full: 9999,
} as const;

export const radius = BorderRadius;

export const Shadows = {
  none: {},
  sm: Platform.select({
    ios: {
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.06,
      shadowRadius: 6,
    },
    android: {
      borderWidth: 0.5,
      borderColor: "rgba(0,0,0,0.04)",
    },
    default: {},
  }),
  md: Platform.select({
    ios: {
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.08,
      shadowRadius: 16,
    },
    android: {
      borderWidth: 0.5,
      borderColor: "rgba(0,0,0,0.04)",
    },
    default: {},
  }),
  lg: Platform.select({
    ios: {
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.1,
      shadowRadius: 28,
    },
    android: {
      borderWidth: 0.5,
      borderColor: "rgba(0,0,0,0.04)",
    },
    default: {},
  }),
} as const;

export const shadow = Shadows;

export const spring = {
  gentle: { damping: 25, stiffness: 150 } as const,
  bouncy: { damping: 18, stiffness: 200 } as const,
  snappy: { damping: 30, stiffness: 250 } as const,
  press: { damping: 20, stiffness: 250, mass: 0.8 } as const,
} as const;

export const TAB_BAR_H = 64;

export const zIndex = {
  base: 0,
  card: 10,
  header: 100,
  modal: 200,
  toast: 300,
  overlay: 400,
} as const;

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
  BREAKPOINTS,
} as const;
