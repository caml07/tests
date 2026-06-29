# Expo SDK 56 — read versioned docs before coding

Bare **Expo SDK 56** app using **expo-router** (file-based routing), **Zustand** + MMKV persist, React Hook Form + Zod, Reanimated, Vitest.

## Commands

| Command | Action |
|---------|--------|
| `npm start` | Dev server |
| `npm run android` / `ios` / `web` | Dev server scoped to platform |
| `npx tsc --noEmit` | TypeScript check |
| `npm test` | Vitest (single run) |
| `npm run test:watch` | Vitest (watch mode) |
| `$env:EXPO_PUBLIC_API_URL="http://127.0.0.1:3001"; npm run android` | Build + ADB reverse en físico |

## File-based routing (`app/`)

- `_layout.tsx` — root layout (query client, fonts, auth gate via `<Stack.Protected>`)
- `login.tsx` — login screen
- `(app)/_layout.tsx` — authenticated layout (phone: `<Stack>`, tablet: `<TabletHomeShell>`)
- `(app)/(tabs)/_layout.tsx` — tab navigator (tab bar hidden on tablet)
- `(app)/(tabs)/index.tsx` — stations list
- `(app)/(tabs)/history.tsx` — order history
- `(app)/paciente/[stationId].tsx` — patient list for a station
- `(app)/paciente/[stationId]/[patientId].tsx` — patient menu

## Architecture

- **Feature-Sliced Design**: `src/features/<name>/` (auth, stations, patients, cart) + `src/shared/` (atoms, hooks, molecules, organisms, services, utils, types)
- **State**: Zustand stores in `src/features/*/store/` with MMKV persist. Tokens read from MMKV via `mmkv.getString('auth-storage')`
- **API**: `src/shared/services/api.ts` — generic `request<T>()` with bearer token from MMKV, 30s timeout
- **Offline sync**: SQLite via `expo-sqlite` + `src/shared/services/sync.ts` queue/flush pattern
- **Auth gates**: `<Stack.Protected guard={condition}>` in root layout

## Config quirks

- `package.json` `"main": "expo-router/entry"` — do not change
- `app.json` `"experiments.typedRoutes": true`, `"orientation": "default"`, `"ios.supportsTablet": true`
- `.expo/types/` and `expo-env.d.ts` are generated + gitignored
- `app.json` `"android.softwareKeyboardLayoutMode": "resize"`

## Path alias

`@/*` → `./*` (project root). Import from `src/` as `@/src/...`.

## Testing

- **Vitest** (`vitest.config.ts`), `globals: true`, `environment: 'node'`
- Setup: `vitest.setup.ts` mocks `react-native`, `expo-router`, `expo-haptics`, `react-native-reanimated`, `lucide-react-native`, and all shared modules
- Custom `__mocks__/react-native/` and `__mocks__/react-native-virtualized-lists/`
- Tests in `*.test.ts` / `*.test.tsx` alongside source (gitignored)

## Styling & UI conventions

- Dark/light via `useColorScheme()` + `@/constants/Colors` → `Colors[colorScheme].tint/text/etc`
- Glassmorphism: use `<BlurWrapper>` from `src/shared/atoms/BlurWrapper` (not raw `<BlurView>`) — wraps `expo-blur` on iOS, semi-transparent fallback on Android
- **Reanimated only** — LayoutAnimation prohibited
- Design: warm backgrounds (#f5f2ed / #1a1a1a), PlusJakartaSans (body), Lora-Italic (decorative titles), no hard shadows or borders
- Fonts loaded in `app/_layout.tsx`: PlusJakartaSans (wght variable), PlusJakartaSans-Italic, Lora-Italic

## Tablet responsive infra

- `useResponsive` hook in `src/shared/hooks/useResponsive.ts` — `isTablet` = width ≥ 744 || deviceType === TABLET; exposes `isDesktop`, `isCollapsed`, `isLandscape`, `isPhone`
- `BREAKPOINTS` in `src/shared/utils/breakpoints.ts` — `{ tablet: 744, desktop: 1024 }`
- `LoginScreen` locks portrait only on phone (uses `isPhone` from hook)
- Tab bar auto-hidden on tablet via `tabBar={isTablet ? () => null : ...}`
- Plan: `docs/TABLETPLAN.md`

## Known Issues (Android físico — ver `docs/ANDROID.md`)

| Issue | File | Fix |
|-------|------|-----|
| Input demasiado grande | `src/shared/atoms/Input.tsx:110` | `minHeight: 52` → `44` |
| Logo/text squashed | `LoginScreen.tsx:49` | `hp('6%')` → `space[12]` |
| Shadows con elevation feos | `tokens.ts:140-169` | Usar border sutil en Android |
| Require cycle (ya fixeado) | `api.ts` | Ahora lee token de AsyncStorage |

## Reference docs

`docs/` — `ARCHITECTURE.md`, `API.md`, `SETUP.md`, `RUNBOOK.md`, `OFFLINE.md`, `ANDROID.md`, `IOS.md`, `TABLETPLAN.md`
