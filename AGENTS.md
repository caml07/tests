# Expo SDK 56 — read versioned docs before coding

This is a bare **Expo SDK 56** app using **expo-router** (file-based routing).

## Commands

| Command | Action |
|---------|--------|
| `npm start` | Dev server |
| `npm run android` / `ios` / `web` | Dev server scoped to platform |
| `npx tsc --noEmit` | TypeScript check |
| `$env:EXPO_PUBLIC_API_URL="http://127.0.0.1:3001"; npm run android` | Build + ADB reverse en físico |

## File-based routing (`app/`)

- `_layout.tsx` — root layout
- `(tabs)/_layout.tsx` — tab navigator
- `(tabs)/index.tsx` — stations
- `(tabs)/cart.tsx` — carrito
- `(tabs)/history.tsx` — historial pedidos
- `login.tsx` — login screen
- `(app)/paciente/[stationId]/[patientId].tsx` — menú del paciente

## Path alias

`@/*` → `./*` (project root).

## Config quirks

- `package.json` `"main": "expo-router/entry"` — do not change
- `app.json` `"experiments.typedRoutes": true`
- `.expo/types/` and `expo-env.d.ts` are generated + gitignored

## Assets

- Fonts via `expo-font` en `app/_layout.tsx`:
  - `PlusJakartaSans` (principal)
  - `PlusJakartaSans-Italic`
  - `Lora-Italic` (títulos decorativos, variable `[wght]`)

## Known Issues (Android físico — ver `docs/ANDROID.md`)

| Issue | File | Fix pendiente |
|-------|------|---------------|
| Input demasiado grande | `src/shared/atoms/Input.tsx:110` | `minHeight: 52` → `44` |
| Logo/text squashed | `LoginScreen.tsx:49` | `hp('6%')` → `space[12]` |
| Shadows con elevation feos | `tokens.ts:140-169` | Usar border sutil en Android |
| BlurView prop deprecated | Cart sheets, BottomSheet | `experimentalBlurMethod` → `blurMethod` |
| Require cycle (ya fixeado) | `api.ts` | Ahora lee token de AsyncStorage |

## Conventions

- TypeScript strict mode
- Dark/light theme via `useColorScheme()` and `Colors.ts`
- Colors from `@/constants/Colors` — `Colors[colorScheme].tint/text/etc`
- Diseño Zen Browser: glassmorphism (BlurView), fondos cálidos (#f5f2ed / #1a1a1a), Lora Italic, sin bordes ni sombras duras
- Animaciones solo con Reanimated (prohibido LayoutAnimation)
- Estado global con Zustand + persist + AsyncStorage
- Feature-Sliced Design (src/features/<name>/)
