# Expo SDK 56 — HVP Dietas

Bare **Expo SDK 56** app (React 19, RN 0.85) using **expo-router**, **Zustand** + MMKV/AsyncStorage persist, **TanStack Query v5**, **Reanimated 4**, **expo-sqlite** offline-first, **Vitest**.

## Commands

| Command | Action |
|---------|--------|
| `npm start` / `npm run android` / `ios` / `web` | Dev server |
| `npx tsc --noEmit` | TypeScript check |
| `npm test` / `npm run test:watch` | Vitest (single / watch) |
| `$env:EXPO_PUBLIC_API_URL="http://127.0.0.1:3001"; npm run android` | Android físico + ADB reverse |

Mock API: `npx json-server docs/db.json --port 3001`.  
Físico: `adb reverse tcp:3001 tcp:3001` (cada reconexión).

## SSL / Network Security

`portalvivianpellas.com.ni` no envía el certificado intermediario GoDaddy G2 en el handshake SSL, solo el hoja. Android nativo rechaza la conexión con `SSLHandshakeException: Trust anchor for certification path not found`.

**Solución**: El plugin `plugins/withNetworkSecurityConfig.js` (registrado en `app.json`) inyecta automáticamente:
- `res/xml/network_security_config.xml` — trust-anchor custom para `portalvivianpellas.com.ni`
- `res/raw/gdig2.crt` — certificado GoDaddy Secure CA - G2 (intermediario)
- `android:networkSecurityConfig` en el `<application>` del AndroidManifest

**Después de modificar `app.json` o el plugin**, hay que regenerar el proyecto nativo:
```
npx expo prebuild --clean
npx expo run:android
```

Si se borra `android/` (gitignored), el plugin lo recrea en el próximo prebuild.

## Architecture

- **Feature-Sliced Design**: `src/features/<name>/` (auth, stations, patients, cart, layout) + `src/shared/` (atoms/hooks/molecules/organisms/services/utils/types). **Rule**: features never import other features — cross-cutting code goes to `shared/`
- **Routing**: File-based in `app/`. Root layout `_layout.tsx` inits DB, loads fonts, renders `<Stack.Protected>` auth gate + `DatabaseSync` (flushes offline queue on reconnect). Login screen is `app/login.tsx` (thin re-export)
- **State**: Zustand with persist (MMKV for cart via `expo-sqlite/kv-store` `SQLiteStorage`, AsyncStorage for auth). Token read from `mmkv.getString('auth-storage')` inside `api.ts`
- **API**: `src/shared/services/api.ts` — `request<T>()` with bearer token, 5s timeout. Dev: json-server mock on `localhost:3001`. Prod: command-based `POST` to `INTERFACE_URL` (see `docs/API-INTEGRATION.md`). Auth login is client-side match against `/nurses` mock; real API uses `POST` with `strToken`/`strU`/`strP`
- **DB**: `expo-sqlite` singleton via `setDb(db)` / `getDb()` / `getDbSync()`. Migration via `PRAGMA user_version` (current: v3). Req **native dev build** (no Expo Go). File: `nutricion.db`
- **Offline queue**: Table `pedidos_queue` with status lifecycle: `PENDING` → `IN_FLIGHT` → `DEAD_LETTER` (after 5 retries, exponential backoff up to 60s). Flushed by `DatabaseSync` on NetInfo connect event

## Quirks & Conventions

- `@/*` → project root. Import `src/` as `@/src/...`
- `AGENTS.md`, `CLAUDE.md`, `vitest.config.ts` are **gitignored** (local only). `tsconfig.json` is gitignored but tracked (force-added)
- `.vscode/`, `.zed/`, `*.test.ts`, `*.test.tsx` gitignored
- `app.json`: `experiments.typedRoutes: true`, `android.softwareKeyboardLayoutMode: "resize"`, `ios.supportsTablet: true`
- Biometric token stored in SecureStore as `biometric-auth-token` (isolated from session token)
- **Reanimated only** — no `LayoutAnimation`
- Glassmorphism via `<BlurWrapper>` (expo-blur on iOS, semi-transparent `View` on Android)
- `.vscode/settings.json`: `source.fixAll`, `source.organizeImports`, `source.sortMembers` on save

## Tablet Responsive

- `useResponsive` hook: `isTablet = width >= 744 || deviceType === TABLET`; `isDesktop = width >= 1024`; `isCollapsed = tablet && width < 1024`
- Sidebar (260px expanded / 80px collapsed) + `<TabletHomeShell>` in `(app)/_layout.tsx`. Tab bar hidden on tablet via `tabBar={() => null}`
- `<Screen>` has responsive horizontal padding

## Testing

- **Vitest** (`globals: true`, `environment: 'node'`). **Two** setup files: `vitest.setup.ts` (full mocks) and `vitest.minimal.setup.ts` (abbreviated, for fast isolated tests)
- `__mocks__/react-native/` resolved via patching `Module._resolveFilename`
- Known: `@testing-library/react-native` mock is **incomplete** — `screen.getByText` etc. are unavailable. Tests in `_scratch/` are scratch/playground files
