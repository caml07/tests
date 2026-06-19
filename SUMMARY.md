# Notas Rápidas — Feature Registry

Fuente: `docs/FR-NFR.md`

## Estado de FRs

| ID    | Nombre                | Estado       |
|-------|-----------------------|--------------|
| FR-01 | Autenticacion         | ✅ **Hecho** |
| FR-02 | Seleccion de estacion | ✅ **Hecho** |
| FR-03 | Info del paciente     | ✅ **Hecho** |
| FR-04 | Exploracion de menu   | ❌ Pendiente |
| FR-05 | Comanda               | ❌ Pendiente |
| FR-06 | Carrito global        | ❌ Pendiente |
| FR-07 | Envio a cocina        | ❌ Pendiente |
| FR-08 | Historial             | ❌ Pendiente |

---

## FR-01 — Autenticacion ✅

- Login con user/pass contra mock API (`/nurses`)
- `useAuth` hook: `login()`, `logout()`, `isAuthenticated`, `isHydrated`
- Recordarme opcional (AsyncStorage)
- Splash screen con fade-out 400ms mientras hidrata auth + fonts
- Logout → limpia sesión y redirect a `/login`
- `src/screens/auth/LoginScreen.tsx` — form con react-hook-form + zod
- Users en `docs/db.json` (nurses con `usuario`, `password`, `estaciones`)
- Fix: json-server v1 no soporta multi-query → traemos todas y filtramos en JS

### Archivos clave
- `app/login.tsx` — ruta pública con redirect si autenticado
- `src/hooks/useAuth.ts`
- `src/store/authStore.ts` (Zustand + persist)
- `app/_layout.tsx` — root Stack con splash

---

## FR-02 — Seleccion de estacion ✅

- `app/(app)/(tabs)/index.tsx` — EstacionesScreen
- Grid de tarjetas de estación con `StationCard`
- `useStations` hook: fetch `/stations`
- `stationStore` (Zustand): estación seleccionada
- Avatar con iniciales, greeting, botón Salir
- Skeleton loading (3 items), ErrorState, EmptyState
- Pull-to-refresh via `refetch`

### Archivos clave
- `src/hooks/useStations.ts`
- `src/store/stationStore.ts`
- `src/components/molecules/StationCard.tsx`
- `src/components/atoms/Skeleton.tsx`

---

## FR-03 — Info del paciente ✅

- `app/paciente/[stationId].tsx` — PatientListScreen
- `app/paciente/[stationId]/[patientId].tsx` — PatientMenuScreen
- PatientCard: nombre, habitacion/cama, dieta badge con icono, chevron
- `usePatients` hook: filtrado por stationId + search query
- Búsqueda por nombre con plain `useState` (sin RHF/Zod)
- `ScreenLoading` / `ScreenError` reutilizables
- Pull-to-refresh en ambas pantallas
- PatientMenuHeader con avatar, habitacion, badge de dieta + variante Skeleton
- Tiempo chips con iconos SF Symbols (sunrise, sun.max, cup.and.saucer, moon)
- MenuItem expandible con Reanimated, barra de acento, ingredientes con bullet, botón "Agregar"
- `useMenu` hook: resuelve menuByTiempo desde dietaId
- Skeleton 6 items

### Archivos clave
- `src/hooks/usePatients.ts`
- `src/hooks/useMenu.ts`
- `src/components/organisms/PatientMenuHeader.tsx`
- `src/components/organisms/ScreenLoading.tsx`
- `src/components/organisms/ScreenError.tsx`
- `src/components/molecules/PatientCard.tsx`
- `src/components/molecules/MenuItem.tsx`
- `src/components/molecules/MenuItemSkeleton.tsx`

---

## FR-04 — Exploracion de menu ❌ Pendiente

Arbol expandible: tiempo > comidas > subcomidas > ingredientes.  
Lo implementado parcialmente en FR-03 (MenuItem expandible, tiempo chips) puede considerarse base.

---

## FR-05 — Comanda ❌ Pendiente

Agregar comida al carrito con flag Hoy/Mañana + nota. Falta AddToCartSheet.

---

## FR-06 — Carrito global ❌ Pendiente

Items cross-paciente. Remover items. Persistencia local.  
Stub: `app/(app)/(tabs)/cart.tsx` con empty state.

---

## FR-07 — Envio a cocina ❌ Pendiente

Confirmacion, POST a API, feedback, limpiar carrito.

---

## FR-08 — Historial ❌ Pendiente

Historial de pedidos enviados, filtro por paciente.  
Stub: `app/(app)/(tabs)/history.tsx` con empty state.

---

## Arquitectura de rutas (actual)

```
app/
  _layout.tsx              Stack (solo login)
  login.tsx                pantalla pública
  (app)/
    _layout.tsx            Stack con auth check → (tabs)
    (tabs)/
      _layout.tsx          Tabs con CustomTabBar (Estación, Carrito, Historial)
      index.tsx            EstacionesScreen
      cart.tsx             CartScreen
      history.tsx          HistoryScreen
  paciente/
    _layout.tsx            Stack con auth check
    [stationId].tsx        PatientListScreen
    [stationId]/
      [patientId].tsx      PatientMenuScreen
```

### Por qué paciente está fuera de (app)
- El tab bar debe estar oculto en pantallas de paciente
- Intentos fallidos de ocultarlo condicionalmente:
  1. `NullTabBar` con `display: none` → dejaba espacio en blanco
  2. `usePathname` en CustomTabBar → crasheaba en web (Invalid hook call)
  3. `useState`/`useSharedValue` en CustomTabBar → mismo crash
  4. Paciente dentro del Stack de (app) → tab bar visible debajo en web
- Solución: paciente es un grupo Stack separado, fuera del Tabs

---

## Design System & Componentes

### Tokens (`src/utils/tokens.ts`)
- Colores light/dark con alias semánticos
- Tipografía Plus Jakarta Sans (variable weight + italic)
- Escala de spacing (`space[0]`–`space[10]`)
- Radios (sm, md, lg, full)
- Sombras (iOS + Android)
- Presets de spring (snappy, gentle, wobbly)

### Iconos (`src/components/atoms/Icon.tsx`)
- iOS: `expo-symbols` (SymbolView)
- Android/Web: `@expo/vector-icons` (MaterialCommunityIcons)
- Mapping SF_TO_MATERIAL (26 entradas)
- Punto único de entrada — no importar vector-icons directo

### Componentes atómicos
- `PressableScale` — spring scale + haptics
- `Button` — variants (primary, secondary, ghost), icon prop, haptic
- `Input` — Reanimated interpolateColor en focus/blur, leftIcon
- `Checkbox` — Recordarme toggle
- `Chip` — compacto (minHeight: 36), icon + label, haptic
- `Skeleton` — shimmer animado
- `Spinner` — fullScreen variant

### Componentes moleculares
- `StationCard` — icono flotante, barra de acento
- `PatientCard` — badge de dieta, chevron
- `MenuItem` — expandible con Reanimated, ingredientes con bullet
- `EmptyState`, `ErrorState`

### Componentes de organismo
- `Screen` — SafeArea-aware
- `CustomTabBar` — puro (sin hooks en el parent), TabItem child con Reanimated
- `BottomSheet` — icon + label buttons, backdrop
- `PatientMenuHeader` — header + Skeleton variant
- `SplashScreen` — logo HVP
- `ToastProvider` + `useToast` — slide-up, 3s auto-dismiss

---

## Attempted & Failed

### 1. NullTabBar con display:none
- En `(app)/_layout.tsx`, detectar `/paciente/` y swappear tabBar
- Falló: dejaba espacio en blanco en web

### 2. usePathname en CustomTabBar
- Detectar ruta activa y return null
- Falló: "Invalid hook call" en web (React duplicate instance)

### 3. useState/useSharedValue en CustomTabBar
- Animaciones + tracking de ruta
- Falló: mismo crash #2

### 4. Paciente dentro del Stack de (app)
- `(app)/_layout.tsx` como Stack con (tabs) + paciente
- Falló: tab bar visible debajo en web (z-order del Stack)

### 5. Hooks en TabItem child
- `useColorScheme`, `useSharedValue` en TabItem (hijo de CustomTabBar)
- ✅ **Funcionó** — hooks seguros en child components
- Limitación: el CustomTabBar parent debe ser pure function

### 6. Tab bar visible en login
- Raíz: root layout solo declara `login` explícitamente
- `(app)` y `paciente` son grupos descubiertos por file-based routing
- ✅ Tab bar ausente del contexto login
- **Aún roto**: iconos faltan en tab bar web

---

## Comandos

| Comando | Acción |
|---------|--------|
| `npm start` | Dev server |
| `npm run web` | Web dev server |
| `npm run android` | Android |
| `npm run ios` | iOS |
| `npx json-server docs/db.json` | Mock API (port 3000) |
| `npx tsc --noEmit` | TypeScript check |
| `npm test` | Vitest |

## Dependencias principales
- Expo SDK 56, expo-router v4
- React Native 0.85, React 19
- Reanimated 4, Zustand 5
- @expo/vector-icons, expo-symbols
- expo-haptics, expo-font
- react-native-safe-area-context
- react-hook-form + zod
- json-server (mock API)
- Plus Jakarta Sans (variable font)

## Paths
- `@/*` → `./*` (raíz del proyecto)
- Icons: `src/components/atoms/Icon.tsx`
- Colors: `constants/Colors.ts` → `Colors[colorScheme].tint/text/etc`
- Tokens: `src/utils/tokens.ts`
- API: `src/services/api.ts`
- DB: `docs/db.json`
