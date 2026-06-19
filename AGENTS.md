# Expo SDK 56 — read versioned docs before coding

This is a bare **Expo SDK 56** app using **expo-router** (file-based routing). Still at default tabs template — real features not yet built.

## Commands

| Command | Action |
|---------|--------|
| `npm start` | Dev server |
| `npm run android` / `ios` / `web` | Dev server scoped to platform |

No test runner, linter, formatter, or CI configured.

## File-based routing (`app/`)

- `_layout.tsx` — root layout (Stack navigator with tabs group + modal)
- `(tabs)/_layout.tsx` — tab navigator layout
- `(tabs)/index.tsx` — Tab One
- `(tabs)/two.tsx` — Tab Two
- `modal.tsx` — modal screen
- `+not-found.tsx` — 404 screen
- `+html.tsx` — shell HTML (web only)

New screens = new files in `app/` (or `app/(tabs)/` for tabs).

## Path alias

`@/*` → `./*` (project root). Import like `@/components/Themed`.

## Config quirks

- `package.json` `"main": "expo-router/entry"` — do not change, this is the expo-router entry convention
- `app.json` `"experiments.typedRoutes": true` — typed route helpers generated automatically
- `.expo/types/` and `expo-env.d.ts` are generated + gitignored
- `.expo/` and `dist/` are gitignored build artifacts

## Assets

- `assets/fonts/SpaceMono-Regular.ttf` loaded in root `_layout.tsx` via `useFonts`
- Icons via `expo-symbols` (`SymbolView` component, platform-aware names)
- App scheme: `notasrapidas`

## Conventions

- VS Code auto-fixes on save: `source.fixAll`, `source.organizeImports`, `source.sortMembers`
- TypeScript strict mode
- Dark/light theme via `useColorScheme()` and `Colors.ts` constant
- Colors from `@/constants/Colors` — `Colors[colorScheme].tint/text/etc`
