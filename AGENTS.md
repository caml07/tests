# Expo SDK 56 — HVP Dietas

Bare **Expo SDK 56** app (React 19, RN 0.85) using **expo-router**, **Zustand** + MMKV/AsyncStorage persist, **TanStack Query v5**, **Reanimated 4**, **expo-sqlite** offline-first, **Vitest**.

## Commands

| Command | Action |
|---------|--------|
| `npm start` / `npm run android` / `ios` / `web` | Dev server |
| `npx tsc --noEmit` | TypeScript check |
| `npm test` / `npm run test:watch` | Vitest (single / watch) |
| `npm run dump` / `npm run pull-db` | Pull DB dump from device |

Mock API: `npx json-server docs/db.json --port 3001` (start before the app).

**Dev order matters**: `json-server` → `adb reverse` (if physical) → `npm start`/`run android`.

## Mock vs Real API

Dev uses **json-server** REST at `http://localhost:3001`.  
Prod uses **command-based POST** to `INTERFACE_URL` (`portalvivianpellas.com.ni/EME4/Interface/HIS`) — see `docs/API-INTEGRATION.md`.  

Set `EXPO_PUBLIC_API_URL=http://127.0.0.1:3001` env var for physical Android (bypasses Wi-Fi firewall). Without it, default is localhost which emulator loopback catches but physical devices miss. Requires `adb reverse tcp:3001 tcp:3001` on every cable reconnect.

## SSL / Network Security

`portalvivianpellas.com.ni` omits the GoDaddy G2 intermediate cert in the SSL handshake. Android native rejects this with `SSLHandshakeException`. The plugin `plugins/withNetworkSecurityConfig.js` (registered in `app.json`) injects the missing intermediate CA into the native build.

After modifying `app.json` or the plugin:
```
npx expo prebuild --clean
npx expo run:android
```
The `android/` dir is gitignored — the plugin recreates it on prebuild.

## Architecture

- **Feature-Sliced Design**: `src/features/<name>/` (auth, stations, patients, cart, layout) + `src/shared/` (atoms/hooks/molecules/organisms/services/utils/types). Features never import other features — cross-cutting code goes to `shared/`.
- **Routing**: File-based in `app/`. Root layout inits DB, loads PlusJakartaSans + Lora-Italic fonts, renders `<Stack.Protected>` auth gate + `<DatabaseSync>` (flushes offline queue on reconnect, syncs every 5min). Login screen at `app/login.tsx` (thin `<LoginScreen>` re-export).
- **State**: Zustand with persist. Auth uses AsyncStorage via MMKV adapter (`auth-storage` key). Cart uses MMKV directly. TanStack Query persists to MMKV via `queryPersisterStorage`. Token read from `mmkv.getString('session-token')` in `api.ts`.
- **API**: `src/shared/services/api.ts` — `request<T>()` for REST (dev mock), `interfaceRequest<T>()` for command-based prod API. Bearer token from MMKV. Static token `STATIC_TOKEN` for HVP interface. 5s timeout.
- **DB**: `expo-sqlite` singleton via `setDb/getDb/getDbSync`. Migrations via `PRAGMA user_version` (current: **v6**). Requires native dev build (no Expo Go). File: `nutricion.db`.
- **Offline queue**: `pedidos_queue` table with lifecycle: `PENDING → IN_FLIGHT → DEAD_LETTER` (after 5 retries, exponential backoff up to 60s). Flushed by `flushQueue` on NetInfo connect event. Sync uses hash-based dedup (`censoHash` in `meta` table).

## Conventions

- `@/*` maps to project root. Import `src/` as `@/src/...`
- `AGENTS.md`, `CLAUDE.md`, `vitest.config.ts`, `vitest.setup.ts`, `vitest.minimal.setup.ts` are **gitignored** (local only). `tsconfig.json` is gitignored but force-added to git.
- `*.test.ts`, `*.test.tsx` are gitignored.
- **Reanimated only** — no `LayoutAnimation`. Glassmorphism via `<BlurWrapper>` (expo-blur on iOS, semi-transparent View on Android).
- Biometric token in SecureStore as `biometric-auth-token`.
- `.vscode/settings.json`: `source.fixAll`, `source.organizeImports`, `source.sortMembers` on save.

## Tablet Responsive

- `useResponsive` hook: `isTablet = deviceType === TABLET || (deviceType == null && width >= 744)`. `isDesktop` at 1024px.
- `<TabletHomeShell>` wraps `<Slot>` with sidebar (phone falls back to `<Stack>` with tabs).
- Tab bar hidden on tablet via `tabBar={() => null}`.

## Testing

- **Vitest** (`globals: true`, `environment: 'node'`). Two setup files: `vitest.setup.ts` (full mocks) and `vitest.minimal.setup.ts` (abbreviated, for fast isolated tests — swap in config manually).
- RN module resolution patched via `Module._resolveFilename` override in setup.
- `__mocks__/react-native/` provides stubs for core RN modules.
