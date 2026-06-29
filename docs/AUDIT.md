# Auditoría Pre-Producción

> Ramas: `audit/fixes-pre-prod` → `main`
>
> Fecha: 2026-06-25
>
> Autores: Claude (Anthropic) + Gemini (Google) + análisis de verificación sobre código real

---

## Índice

1. [🔴 Auditoría Claude — Crítico](#-claude--crítico)
2. [🟠 Auditoría Claude — Alto](#-claude--alto)
3. [🔵 Auditoría Claude — Medio](#-claude--medio)
4. [🟢 Auditoría Claude — Bajo](#-claude--bajo)
5. [🔴 Auditoría Gemini — Integridad y Sincronización](#-gemini--integridad-de-datos-y-sincronización)
6. [🟠 Auditoría Gemini — Arquitectura y Mantenibilidad](#-gemini--arquitectura-y-mantenibilidad)
7. [🟢 Auditoría Gemini — Experiencia de Desarrollo](#-gemini--experiencia-de-desarrollo-y-tipado)
8. [✅ Verificación sobre código real](#-verificación-sobre-código-real)
9. [📋 Plan de acción priorizado](#-plan-de-acción-priorizado)

---

## 🔴 Claude — Crítico

### 1. Autenticación client-side con passwords en claro

**Archivo:** `src/shared/services/api.ts:36-47`

```ts
login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    const nurses = await request<Array<{ id: string; nombre: string; usuario: string; password: string; estaciones: string[] }>>('/nurses')
    const nurse = nurses.find(n => n.usuario === credentials.usuario && n.password === credentials.password)
    // ...
    const token = `mock-token-${nurse.id}-${Date.now()}`
}
```

**Problema:** GET `/nurses` devuelve todos los usuarios con passwords en texto plano. La validación es client-side. Cualquier interceptor de tráfico (o DevTools en web) ve todas las credenciales. En un hospital esto es HIPAA/privacidad crítico.

**Solución:** Endpoint server-side POST `/auth/login` que devuelva solo token + user info, nunca passwords.

---

### 2. Token en módulo volátil (`tokenProvider.ts`)

**Archivo:** `src/shared/services/tokenProvider.ts`

```ts
let _token: string | null = null
export function getToken(): string | null { return _token }
export function setToken(token: string | null): void { _token = token }
```

**Problema:** Módulo singleton en memoria. Se pierde cuando React Native lleva la app al background (proceso reciclado en Android). `onRehydrateStorage` en `authStore.ts:102-104` lo restaura, pero hay ventana de tiempo donde `getToken()` devuelve `null`.

**Solución:** Leer directamente del store (`useAuthStore.getState().token`) o hacer rehidratación síncrona.

---

## 🟠 Claude — Alto

### 3. SQL injection potencial en `upsertRows`

**Archivo:** `src/shared/services/database.ts:88-102`

```ts
`INSERT OR REPLACE INTO ${table} (${columns.join(', ')}) VALUES (${placeholders})`
```

**Problema:** El nombre de tabla se interpola sin validación. Los valores usan `?` parametrizado (bien), pero `table` de fuente no confiable es vector SQLi. Mismo patrón en `getAllRows` (L105) y `deleteWhere` (L111).

**Solución:** Whitelist de tablas permitidas con `Set` y throw si no está.

---

### 4. Doble listener de NetInfo

**Archivos:**
- `app/_layout.tsx:48` — `DatabaseSync` component con `NetInfo.addEventListener`
- `src/shared/hooks/useNetworkStatus.ts:29` — llamado por `ConnectivityBanner`

**Problema:** Dos suscripciones independientes a `NetInfo.addEventListener`. En dispositivo real puede disparar callbacks duplicados o en orden incorrecto.

**Solución:** Consumir el mismo contexto/hook centralizado.

---

### 5. `syncAll` no invalida React Query

**Archivo:** `src/features/auth/screens/LoginScreen.tsx:62`

```ts
if (db) syncAll(db)  // sin await, sin queryClient.invalidateQueries
```

**Problema:** `syncAll` actualiza SQLite pero React Query no sabe que los datos cambiaron. Las pantallas con `useQuery` muestran datos stale hasta el próximo refetch natural.

**Solución:** Llamar `queryClient.invalidateQueries()` después del sync.

---

## 🔵 Claude — Medio

### 6. `useBiometricAuth` mal nombrada

**Archivo:** `src/shared/hooks/useBiometricAuth.ts`

```ts
export const useBiometricAuth = async (): Promise<BiometricResult> => { ... }
```

**Problema:** Es una función `async` regular, no un hook de React. El prefijo `use*` viola las reglas de hooks si alguien la llama en el cuerpo de un componente.

**Solución:** Renombrar a `authenticateWithBiometrics` o mover a `src/shared/services/`.

---

### 7. `useSubmitOrder` duplicado y roto

**Archivo:** `src/features/cart/hooks/useSubmitOrder.ts`

**Problema:** Hook que llama `api.postPedido()` directo, bypaseando el offline queue de `cartStore.submitOrder()`. No se usa en ningún componente actual, pero es una trampa para el futuro.

**Solución:** Eliminar o refactorizar para delegar a `cartStore.submitOrder()`.

---

### 8. `isOnline` hardcodeado a `false` en DEV

**Archivo:** `src/features/cart/store/cartStore.ts:72`

```ts
const isOnline = __DEV__ ? false : (netState.isConnected ?? false)
```

**Problema:** En desarrollo nunca se prueba el path online real. Útil para testing offline pero demasiado agresivo.

**Solución:** Variable de entorno o feature flag más granular.

---

### 9. `useStations` con fetch manual

**Archivo:** `src/features/stations/hooks/useStations.ts`

**Problema:** Usa `useState` + `useEffect` + `useCallback` para fetching. El resto de la app usa React Query. Sin cache, deduplicación, stale-while-revalidate.

**Solución:** Migrar a `useQuery`.

---

### 10. `storage.ts` dead code

**Archivo:** `src/shared/services/storage.ts`

**Problema:** `saveAuth/getAuth/clearAuth` ya no se usan (la persistencia la maneja Zustand persist). Cero imports en el código.

**Solución:** Eliminar el archivo.

---

## 🟢 Claude — Bajo

### 11. `flushQueue` secuencial

**Archivo:** `src/shared/services/sync.ts:49-63`

```ts
for (const entry of queue) {
  await api.postPedido(items)  // uno a la vez
}
```

**Problema:** Si hay 20 pedidos encolados, se envían en serie. Podría ser `Promise.allSettled` con concurrencia limitada.

---

### 12. `QueryClient` sin configuración global

**Archivo:** `app/_layout.tsx:19`

```ts
const queryClient = new QueryClient()  // sin opciones
```

**Problema:** `staleTime: 0`, `retry: 3`. En datos hospitalarios que cambian poco, un `staleTime` de 5 minutos reduciría requests innecesarios.

---

### 13. Casts `as unknown as SQLiteBindValue`

**Archivo:** `src/shared/services/sync.ts:42,53`

```ts
[5 as unknown as SQLiteBindValue]
[entry.id as unknown as SQLiteBindValue]
```

**Problema:** Smell de que los tipos de expo-sqlite no aceptan los valores que deberían. Casts silenciosos.

---

### 14. Cobertura de tests insuficiente

`@testing-library/react-native` instalado en `package.json` pero sin tests de componentes. Solo tests de servicios (api, authStore, useBiometricAuth, validation).

---

### 15. `ConnectivityBanner` sin accesibilidad

**Archivo:** `src/shared/atoms/ConnectivityBanner.tsx`

**Problema:** Sin `accessibilityRole="alert"` ni `accessibilityLiveRegion="polite"`. Usuarios con TalkBack/VoiceOver no detectan el cambio de conectividad.

---

## 🔴 Gemini — Integridad de Datos y Sincronización

### G1. Fuga de memoria / "Datos Zombie" en la cola de SQLite

**Archivo:** `src/shared/services/sync.ts:34-42`

```ts
const queue = await getAllRows<>(db, 'pedidos_queue', 'failed_attempts < ?', [5])
```

**Problema:** Órdenes con `failed_attempts >= 5` son filtradas permanentemente. No hay GC, no hay UI que notifique, no hay forma de reintentar. Esos pedidos de comida jamás llegan a la cocina y nadie lo sabe.

**Solución:** Implementar estrategia de GC o exponer fallos críticos en la UI para que la enfermera decida reintentar o eliminar.

---

### G2. Riesgo de duplicidad por timeouts cortos

**Archivo:** `src/shared/services/api.ts:5`

```ts
const REQUEST_TIMEOUT = 10000  // 10 segundos
```

**Problema:** En redes de hospital con zonas muertas y APs saturados, 10s es poco. Si el servidor procesa el pedido pero el cliente aborta a los 10s, falla → se guarda en `pedidos_queue` → se reenvía → duplicado.

**Solución:** Aumentar timeout a ~30s para mutaciones (POST) e implementar idempotencia con UUID único del cliente.

---

## 🟠 Gemini — Arquitectura y Mantenibilidad

### G3. Generación de IDs débil

**Archivo:** `src/features/cart/store/cartStore.ts:39,88`

```ts
id: `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
```

**Problema:** `Math.random()` no es criptográficamente seguro y `Date.now()` puede colisionar. `crypto.randomUUID()` está disponible en Hermes/Expo SDK 56.

**Solución:** Usar `crypto.randomUUID()`.

---

### G4. Interacción peligrosa entre Zustand y React Query

**Problema:** React Query administra estado asíncrono del servidor, Zustand administra persistencia offline de carritos. Sin un puente explícito, las mutaciones offline de Zustand no disparan re-evaluación del caché de Query al volver online.

---

## 🟢 Gemini — Experiencia de Desarrollo y Tipado

### G5. Silenciamiento de tipos en SQLite (mismo que #13)

Castings `as unknown as SQLiteBindValue` apagan alarmas del compilador.

---

## ✅ Verificación sobre código real

Se revisó cada punto contra los archivos del branch `audit/fixes-pre-prod`. Resultados:

### 🔴 Críticos

| # | Hallazgo | Archivo | Líneas | Verificación |
|---|----------|---------|--------|-------------|
| 1 | GET /nurses con passwords + matching client-side | `api.ts` | 36-47 | **Confirmado** |
| 2 | Token en módulo volátil, race condition en rehidratación | `tokenProvider.ts`, `authStore.ts` | 1-9, 102-104 | **Confirmado** |

### 🟠 Alto

| # | Hallazgo | Archivo | Líneas | Verificación |
|---|----------|---------|--------|-------------|
| 3 | SQL injection potencial (table name interpolado sin whitelist) | `database.ts` | 88-102, 105, 111 | **Confirmado** (hoy seguro porque solo recibe strings hardcodeados, pero vector existe) |
| 4 | Doble `NetInfo.addEventListener` (DatabaseSync + ConnectivityBanner) | `_layout.tsx`, `useNetworkStatus.ts` | 48, 29 | **Confirmado** |
| 5 | `syncAll` sin invalidar React Query | `LoginScreen.tsx` | 62 | **Confirmado** |
| G1 | Datos zombie en pedidos_queue (failed_attempts >= 5 stuck) | `sync.ts` | 42, 55-62 | **Confirmado** — sin GC, sin cleanup, sin warning |
| G2 | REQUEST_TIMEOUT=10000 sin idempotency key | `api.ts` | 5, 79-88 | **Confirmado** — riesgo de duplicados |

### 🔵 Medio

| # | Hallazgo | Archivo | Líneas | Verificación |
|---|----------|---------|--------|-------------|
| 6 | `useBiometricAuth` mal nombrada (no es hook) | `useBiometricAuth.ts` | 1-28 | **Confirmado** |
| 7 | `useSubmitOrder` duplicado / dead code | `useSubmitOrder.ts` | 1-25 | **Confirmado** — cero imports en el código |
| 8 | `isOnline` hardcodeado `false` en DEV | `cartStore.ts` | 72 | **Confirmado** |
| 9 | `useStations` con useState/useEffect manual | `useStations.ts` | 1-28 | **Confirmado** |
| 10 | `storage.ts` dead code (saveAuth/getAuth/clearAuth sin imports) | `storage.ts` | 1-19 | **Confirmado** |
| G3 | IDs con Date.now()+Math.random() en vez de crypto.randomUUID() | `cartStore.ts` | 39, 88 | **Confirmado** |

### 🟢 Bajo

| # | Hallazgo | Archivo | Líneas | Verificación |
|---|----------|---------|--------|-------------|
| 11 | `flushQueue` secuencial (no concurrente) | `sync.ts` | 49-63 | **Confirmado** |
| 12 | `new QueryClient()` sin `defaultOptions` | `_layout.tsx` | 19 | **Confirmado** |
| 13 | Casts `as unknown as SQLiteBindValue` innecesarios | `sync.ts` | 42, 53 | **Confirmado** |
| 14 | Sin tests de componente (`@testing-library/react-native` instalado pero no usado) | `tests/` | — | **Confirmado** |
| 15 | `ConnectivityBanner` sin accesibilidad | `ConnectivityBanner.tsx` | 30-34 | **Confirmado** |
| G4 | Interacción Zustand ↔ React Query sin puente explícito | — | — | **Confirmado** (derivado de #5) |
| G5 | Silenciamiento de tipos SQLite | — | — | **Confirmado** (mismo que #13) |

### Adicional encontrado en verificación

| # | Hallazgo | Archivo | Líneas | Severidad |
|---|----------|---------|--------|-----------|
| 18 | `getDbSync()` puede devolver `null` — callers no lo checkean | `database.ts:16-18`, `LoginScreen.tsx:61`, `history.tsx:197` | 3 sitios | 🟠 Alto |

---

## 📋 Plan de acción priorizado

### Bloqueante para TEST/QA

| Orden | Issue | Impacto | Archivos a modificar |
|-------|-------|---------|---------------------|
| 1 | Auth: reemplazar GET /nurses + matching client-side | Seguridad, HIPAA | `api.ts`, `authStore.ts` |
| 2 | Token: volatile provider + race condition | Auth se rompe al background | `tokenProvider.ts`, `authStore.ts` |
| 3 | Zombie data: failed_attempts >= 5 sin GC | Pedidos perdidos silenciosamente | `sync.ts`, nueva UI en `cart` |
| 4 | syncAll sin invalidateQueries | Datos stale post-login | `LoginScreen.tsx`, `sync.ts` |
| 5 | getDbSync null risk | Crash en edge cases | `LoginScreen.tsx`, `history.tsx`, `database.ts` |

### Sprint actual (antes de prod)

| Orden | Issue | Archivos a modificar |
|-------|-------|---------------------|
| 6 | Doble NetInfo listener | `_layout.tsx`, `useNetworkStatus.ts` |
| 7 | isOnline hardcodeado en DEV | `cartStore.ts` |
| 8 | SQL injection (whitelist) | `database.ts` |
| 9 | REQUEST_TIMEOUT + idempotency | `api.ts` |
| 10 | Renombrar useBiometricAuth | `useBiometricAuth.ts` + imports |
| 11 | Eliminar storage.ts dead code | `storage.ts` |
| 12 | Eliminar/refactorizar useSubmitOrder | `useSubmitOrder.ts` |

### Deuda técnica post-MVP

| Orden | Issue | Archivos a modificar |
|-------|-------|---------------------|
| 13 | useStations → React Query | `useStations.ts` |
| 14 | flushQueue concurrente | `sync.ts` |
| 15 | QueryClient defaultOptions | `_layout.tsx` |
| 16 | Casts SQLiteBindValue | `sync.ts` |
| 17 | Tests de componentes | `tests/` |
| 18 | Accesibilidad ConnectivityBanner | `ConnectivityBanner.tsx` |
| 19 | IDs con crypto.randomUUID() | `cartStore.ts` |
