# Sprint — Auditoría Pre-Producción

> Rama: `audit/fixes-pre-prod` → `main`
>
> Inicio: 2026-06-25
>
> Documento vivo — actualizar al completar cada ítem

---

## Resumen

Refactor integral de la rama `main` para resolver las 18 vulnerabilidades/mejoras identificadas en `docs/AUDIT.md`. Cada fix sigue **test-first** (Vitest + @testing-library/react-native).

---

## Stack técnico

| Herramienta | Uso |
|-------------|-----|
| Vitest | Test runner |
| @testing-library/react-native | Tests de componentes |
| react-native-mmkv | Reemplazo de AsyncStorage + SecureStore (AES-256 nativo) |
| @react-native-community/netinfo `useNetInfo()` | Hook nativo (elimina listener duplicado) |

---

## Paquetes

### Agregados
- `react-native-mmkv`

### Eliminados
- `expo-web-browser` (sin imports)
- `expo-linking` (sin imports, router lo maneja)
- `react-native-responsive-screen` (sin imports)
- `@react-native-async-storage/async-storage` (reemplazado por MMKV en `ffdf1f5`)
- `expo-secure-store` (reemplazado por MMKV con encryption en `ffdf1f5`)
- `tokenProvider.ts` (archivo, lógica movida a MMKV en `ffdf1f5`)

---

## Progreso

### ✅ Completados

| # | Item | Archivos | Commit |
|   |------|----------|--------|
| 0 | docs: AUDIT.md con auditorías Claude + Gemini + verificación | `docs/AUDIT.md` | `5c8bb53` |
| 0 | chore: remover unused deps (expo-web-browser, expo-linking, react-native-responsive-screen) | `package.json`, `package-lock.json` | `e934efa` |
| B1+B2 | Auth + Token: authService (mock local, sin GET /nurses), MMKV (reemplaza AsyncStorage+SecureStore), elimina tokenProvider.ts | `authService.ts`, `mmkvStorage.ts`, `api.ts`, `authStore.ts`, `_layout.tsx`, `LoginScreen.tsx`, + tests | `ffdf1f5` |
| B3 | Queue refactor: state machine (PENDING→IN_FLIGHT→SYNCED\|RETRYABLE_ERROR\|DEAD_LETTER), backoff exponencial, idempotency key, dead-letter UI + 8 tests | `sync.ts`, `database.ts` (schema v2), `cartStore.ts`, `api.ts`, `DeadLetterBanner.tsx`, `history.tsx`, `sync.test.ts` | (sin commit) |
| B4 | QueryClient singleton: networkMode offlineFirst, staleTime 5min, retry 1, retryDelay exponencial + 4 tests | `queryClient.ts`, `_layout.tsx`, `queryClient.test.ts` | (sin commit) |
| B5 | Null check getDbSync: ya estaba hecho en `history.tsx:198` | — | (ya existente) |
| B2 | React Query persist: MMKV persister + background sync post-login + gcTime 24h | `_layout.tsx`, `mmkvStorage.ts`, `queryClient.ts` | (sin commit) |
| S6 | Double NetInfo: reemplazar ambos listeners con `useNetInfo()` nativo, eliminar `useNetworkStatus.ts` | `_layout.tsx`, `ConnectivityBanner.tsx`, `useNetworkStatus.ts` (del) | (sin commit) |
| S7 | isOnline hardcode: `__DEV__ ? false` → `EXPO_PUBLIC_FORCE_OFFLINE` env var | `cartStore.ts` | (sin commit) |
| S8 | SQLi whitelist: `ALLOWED_TABLES` + validación en upsertRows, getAllRows, deleteWhere | `database.ts` | (sin commit) |
| S10 | Rename useBiometricAuth → `authenticateWithBiometrics()` en services/ | `biometricAuth.ts` (new), `_layout.tsx`, `LoginScreen.tsx`, test movido a `tests/services/` | (sin commit) |
| S11 | Delete storage.ts (dead code) | — | (sin commit) |
| S12 | Delete useSubmitOrder.ts (dead code) | — | (sin commit) |

### 📅 Post-MVP (deuda técnica)

| # | Item | Prioridad |
|---|------|-----------|
| 13 | Migrar `useStations` a React Query | ✅ |
| 14 | `flushQueue` concurrente con Promise.allSettled | ✅ |
| 15 | Casts `as unknown as SQLiteBindValue` limpiar | ✅ |
| 16 | Tests de componentes con @testing-library/react-native | Media |
| 17 | Accesibilidad en ConnectivityBanner (accessibilityRole="alert") | ✅ |
| 18 | IDs con crypto.randomUUID() en cartStore | ✅ |
| 19 | ConnectivityBanner: safe area padding + altura (se solapa con notificaciones) | ✅ |

---

## Cómo arrancar un item

1. Escribir test → `vitest --watch` → VER rojo
2. Implementar mínimo → VER verde
3. Refactor si aplica
4. Marcar en este documento
5. Commit

```bash
npm test           # correr todos
npm run test:watch # modo watch
```
