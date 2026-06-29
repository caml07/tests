# Decisiones de Arquitectura

## ADR-001: Zustand Persist para Sesion de Usuario

**Contexto:** El store de auth tenia logica manual de hidratacion: `hydrate()` leia de
AsyncStorage via un servicio `storage.ts`, y `_layout.tsx` llamaba `hydrate()` en un
useEffect. Esto duplicaba la responsabilidad de persistencia.

**Decision:** Usar middleware `persist` de Zustand con `createJSONStorage(() => AsyncStorage)`.

**Cambios:**
- `authStore.ts` envuelto con `persist()`, `partialize` condicional segun `rememberMe`
- `storage.ts` eliminado (el servicio ya no se usa)
- `_layout.tsx` reemplaza `hydrate()`/`isHydrated` por `persist.hasHydrated()` + `onFinishHydration`
- `useAuth.ts` elimina `isHydrated` del return

**Token flow:**
- rememberMe=true: persist escribe a AsyncStorage, se rehidrata al reiniciar
- rememberMe=false: partialize retorna `{}`, no persiste nada
- `api.ts` lee el token via `useAuthStore.getState().token` para auto-inyectarlo en headers

**Consecuencias:**
- Elimina ~30 lineas de codigo manual de persistencia
- Tests requieren mock de `@react-native-async-storage/async-storage`
- Migrar a encrypted storage en prod solo cambia el motor (`createJSONStorage`)

---

## ADR-002: React Query para Server State

**Contexto:** `usePatients.ts` y `useMenu.ts` manejaban fetch manual con `useState` +
`useEffect` + `useCallback`. Sin cache, sin deduplicacion, sin stale-while-revalidate.

**Decision:** Migrar a `@tanstack/react-query` v5.

**Cambios:**
- `usePatients.ts`: dos `useQuery` (pacientes + dietas), `useMemo` para merging
- `_layout.tsx`: `QueryClientProvider` envolviendo el Stack
- `package.json`: nueva dependencia

**Consecuencias:**
- Cache automatico con staleTime configurable
- Refetch, loading, error states nativos del hook
- Sin efecto colateral de useEffect para fetching

---

## ADR-003: Unificacion de Iconos con Lucide

**Contexto:** El proyecto usaba `expo-symbols` (SF Symbols solo iOS) bifurcado con
`@expo/vector-icons` (MaterialCommunityIcons para Android/Web). Esto requeria un
mapeo `SF_TO_MATERIAL` y logica de `Platform.OS`.

**Decision:** Reemplazar ambos por `lucide-react-native` + `react-native-svg`.

**Cambios:**
- `package.json`: `npm uninstall expo-symbols @expo/vector-icons`, `npm install lucide-react-native react-native-svg`
- `Icon.tsx`: cambia de diccionario `string->string` a `string->LucideComponent`
- Se exporta `type IconName = keyof typeof LUCIDE_MAP` para tipado estricto

**Mapeo completo (27 iconos):**
| Nombre (SF Symbol legacy) | Componente Lucide |
|---|---|
| building.2.fill | Building2 |
| heart.fill | Heart |
| rectangle.portrait.and.arrow.right | LogOut |
| person.fill | User |
| lock.fill | Lock |
| arrow.right | ArrowRight |
| exclamationmark.circle.fill | AlertCircle |
| chevron.left | ChevronLeft |
| chevron.right | ChevronRight |
| magnifyingglass | Search |
| bed.double.fill | BedDouble |
| exclamationmark.triangle.fill | AlertTriangle |
| note.text | FileText |
| cart.fill | ShoppingCart |
| clock.fill | Clock |
| tray.fill | Inbox |
| checkmark | Check |
| xmark | X |
| checkmark.circle.fill | CheckCircle |
| sunrise.fill | Sunrise |
| sun.max.fill | Sun |
| cup.and.saucer.fill | Coffee |
| moon.fill | Moon |
| plus | Plus |
| questionmark.circle | HelpCircle |

**Consecuencias:**
- Mismo icono en iOS, Android y Web (estilo outline)
- Sin bifurcacion de plataforma en Icon.tsx
- API publica `<Icon name size tintColor style>` intacta
- 19 archivos consumidores no se modifican

---

## ADR-004: Tipado Estricto (Eliminar `any`)

**Contexto:** Varios componentes atomicos usaban `as any` para pasar nombres de
iconos, colores, y tipos de ruta.

**Decision:** Crear tipo `IconName` y tipar estrictamente todas las props de iconos.

**Cambios:**
| Archivo | Antes | Despues |
|---|---|---|
| `Button.tsx` | `icon?: string` + `as any` | `icon?: IconName` |
| `Input.tsx` | `leftIcon?: string` + `as any` | `leftIcon?: IconName` |
| `PatientMenuHeader.tsx` | `dietaSimbolo: string` | `dietaSimbolo: IconName` |
| `ToastProvider.tsx` | `icon?: string` | `icon?: IconName` |
| `FloatingTabBar.tsx` | `TAB_ICON_CONFIG.icon: string` | `TAB_ICON_CONFIG.icon: IconName` |
| `PatientCard.tsx` | `colors: any` | `colors: typeof Colors.light \| typeof Colors.dark` |
| `FloatingTabBar.tsx` | `r.name as any` | `r.name as typeof VISIBLE_NAMES[number]` |
| `[patientId].tsx` | `dietaSimbolo="alert-circle"` (Material name) | `dietaSimbolo="exclamationmark.circle.fill"` (SF Symbol name correcto) |

**Consecuencias:**
- TypeScript detecta errores de iconos en compile time
- Se agregaron `chevron.right` y `questionmark.circle` al mapping (faltaban)

---

## ADR-005: Auto-Inyeccion de Token en API

**Contexto:** Cada llamada a la API que requeria auth debia recibir el token
manualmente. `postPedido(items, token)` explicitamente recibia y pasaba el token.

**Decision:** Leer el token desde `useAuthStore.getState().token` dentro de la
funcion generica `request<T>` y auto-inyectarlo en headers.

**Cambios:**
- `api.ts`: `request<T>` ahora hace `useAuthStore.getState().token` y agrega
  `Authorization: Bearer ${token}` a headers si existe
- `postPedido` simplificado: `(items: CartItem[])` sin token

**Consecuencias:**
- Ningun hook necesita importar el store solo para el token
- Migrar a token real (JWT) es transparente para los consumidores
- Header merge: `{ ...options, headers: { ...headers, ...options.headers } }`

---

## ADR-006: Autenticación Biométrica y Rotación de Pantalla

**Contexto:** El login requería usuario/contraseña cada vez, sin opción de acceso rápido. La app forzaba orientación vertical con posibilidad de rotar en ciertas pantallas.

**Decision:** Integrar `expo-local-authentication` para autenticación biométrica y `expo-screen-orientation` para control de rotación.

**Cambios:**
- `src/shared/hooks/useBiometricAuth.ts`: hook que envuelve `LocalAuthentication` y retorna `{ success, error }`.
- `src/shared/hooks/useScreenOrientation.ts`: hook que desbloquea la rotación globalmente.
- `app/_layout.tsx`: llama a `useScreenOrientation` y, si `biometricEnabled`, autentica automáticamente al arrancar.
- `src/features/auth/screens/LoginScreen.tsx`: bloquea orientación a portrait, añade prompt de activación biométrica post‑login y botón de ingreso con huella.
- `src/features/auth/store/authStore.ts`: guarda token en almacén separado (`biometric-auth-token`) para que el login biométrico use siempre las credenciales del usuario que lo habilitó, sin importar logueos posteriores.
- `docs/IOS.md`: documentación específica de iOS (permisos, simulación).

**Consecuencias:**
- Login habilitado mediante Face ID / huella.
- Rotación libre en toda la app, con bloqueo a portrait en login.
- Token biométrico aislado del token de sesión activa, evitando autenticación cruzada entre usuarios.
- Dependencias añadidas: `expo-local-authentication`, `expo-screen-orientation`, `expo-secure-store`.

---

## ADR-007: SQLite como Fuente de Datos Offline-First

**Contexto:** La app dependía exclusivamente de llamadas API en vivo para obtener datos de referencia (estaciones, pacientes, dietas, comidas). Sin conexión, la app no mostraba nada. El carrito persistía en AsyncStorage sin garantías transaccionales.

**Decisión:** Migrar a SQLite como fuente primaria de datos de referencia usando `expo-sqlite`, y `expo-sqlite/kv-store` para persistencia del carrito.

**Componentes:**

| Componente | Rol |
|---|---|
| `database.ts` | Schema, migración (`PRAGMA user_version`), CRUD helpers (`upsertRows`, `getAllRows`, `deleteWhere`), `getDb()` (single shared connection via `setDb`/`getDb` pattern) |
| `sync.ts` | `syncAll(db)`: descarga stations, patients, dietas, comidas en paralelo via API y hace upsert. `flushQueue(db)`: lee `pedidos_queue`, POSTea cada uno, elimina en éxito |
| `useNetworkStatus.ts` | Hook que envuelve `@react-native-community/netinfo`, expone `{ isConnected, isLoading }` |
| `ConnectivityBanner.tsx` | Banner animado (Reanimated) que se muestra cuando `isConnected === false` |
| `pedidos_queue` | Tabla SQLite: `id, pacienteId, pacienteNombre, items (JSON), failed_attempts, created_at` |

**Flujo offline:**

1. Login → `syncAll(db)` carga datos de referencia a SQLite
2. UI lee dietas/comidas desde SQLite (no necesita red)
3. Cart persiste en SQLite vía `SQLiteStorage`
4. Envío: `submitOrder()` chequea `NetInfo.fetch()` → POST si online, INSERT en `pedidos_queue` si offline
5. Reconexión: NetInfo listener gatilla `flushQueue()` que envía pedidos pendientes

**Consecuencias:**
- La app funciona sin conexión para consultas de menú y carrito.
- Los pedidos se encolan localmente y se envían al recuperar conectividad.
- Single db connection evita race conditions de migración (`SQLiteProvider.onInit` abre, `getDb()` retorna la misma).
- `expo-sqlite/kv-store` reemplaza AsyncStorage para carrito con mejor rendimiento y transaccionalidad.
- Dependencias nuevas: `expo-sqlite`, `@react-native-community/netinfo`.
