# Comanda de Comidas — App Enfermeria

**Documento**: FR / NFR  
**Proyecto**: App mobile de comanda de comidas para enfermeria  
**Stack**: React Native + TypeScript + Expo SDK 56  
**Mock API**: json-server (puerto 3001), reemplazar por API real del hospital

---

## Actores

| Actor                      | Descripcion                                                                |
| -------------------------- | -------------------------------------------------------------------------- |
| **Enfermero/a**            | Usuario de la app. Comanda comidas para pacientes de su estacion.          |
| **API mock (json-server)** | `docs/db.json` con datos ficticios de nurses, stations, patients, comidas. |
| **API existente**          | Backend real del hospital (a futuro — hoy usamos mock).                    |
| **Cocina**                 | Receptor de los tickets (fuera del alcance de la app).                     |

---

## FR — Requisitos Funcionales

| ID    | Nombre                | Estado       | Descripcion |
| ----- | --------------------- | ------------ | ----------- |
| FR-01 | Autenticacion         | ⚠️ **Parcial** | Login con user/pass contra mock API. Recordarme opcional (guarda sesion en AsyncStorage solo si se marca). Logout. ⚠️ Fade-out splash con logo HVP **no implementado** — `SplashScreen.tsx` es código muerto, nunca se renderiza. El layout retorna `null` mientras hidrata. |
| FR-02 | Seleccion de estacion | ✅ **Hecho** | Listar estaciones desde la API. StationCard con icono y nombre. Boton Salir en header. |
| FR-03 | Info del paciente     | ✅ **Hecho** | Ver datos basicos, dieta asignada, alergias, notas. Busqueda por nombre. Room chip badge destacado (Hab. X · Cama Y). |
| FR-04 | Exploracion de menu   | ✅ **Hecho** | Tiempos (Desayuno/Almuerzo/Merienda/Cena) como chips horizontales. FlatList de comidas por tiempo. MenuItem con nombre (no hay campo `price` en el tipo `Comida`). AddToCartSheet con flag Hoy/Mañana + nota. Subcomidas expandibles con `SubcomidaAccordion` (ya implementado). |
| FR-05 | Carrito por paciente  | ✅ **Hecho** | Zustand store con persist (SQLiteStorage via expo-sqlite/kv-store). Carrito individual por paciente. Badge en icono carrito con contador. PatientCartSheet: lista de items, remover individual, boton "Enviar a cocina (N)". |
| FR-06 | Envio a cocina        | ✅ **Hecho** | Submit via cartStore.submitOrder que detecta conectividad: POST a API si online, queue en `pedidos_queue` (SQLite) si offline. Toast feedback funcional (ToastProvider envuelto en `_layout.tsx`). Haptics. Limpia carrito del paciente. |
| FR-07 | Historial del paciente| ⚠️ **Parcial** | PatientHistorySheet: pedidos filtrados por paciente, agrupados por fecha relativa (Hoy/Ayer/dd/mm), items con boton "Repetir" (+ haptics). ⚠️ **Toast feedback roto** (mismo problema FR-06). |
| FR-08 | Historial global      | ✅ **Hecho** | Tab "Historial" en FloatingTabBar. Solo pedidos `en_cocina`. Acordeon por paciente: card con nombre + room, expande para ver pedidos agrupados por fecha, status chip amber, boton "Repetir" con haptics. Hab./Cama resuelto: `history.tsx` lee pacientes desde SQLite para poblar habitacion y cama. |
| FR-09 | Login biométrico      | ✅ **Hecho** | Autenticación mediante huella/Face ID después de login exitoso si el usuario habilita la opción. Token guardado separadamente para evitar autenticación cruzada. |

---

## NFR — Requisitos No Funcionales

| ID     | Nombre             | Descripcion                                                                                                                                                                                                                             |
| ------ | ------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| NFR-01 | Conectividad       | ✅ **Hecho** | ConnectivityBanner global (Rojo "Sin conexión" con Reanimated slide in/out). Tiempo de espera 10s en API calls (AbortController). Offline queue: pedidos se guardan en `pedidos_queue` (SQLite) cuando offline, flush automático al reconectar vía NetInfo listener. |
| NFR-02 | Rendimiento        | ⚠️ **Parcial** | ✅ `windowSize={5}`, `maxToRenderPerBatch={10}` en ambas FlatLists. ⚠️ `removeClippedSubviews` solo en `[patientId].tsx`, **falta en `history.tsx`**. ⚠️ `React.memo` solo en MenuItem, **no en PatientAccordion**. ✅ Accordion con `LinearTransition`. ✅ `staleTime: 5min`. ✅ Skeleton en loading. |
| NFR-03 | UX                 | ✅ Touch >= 44px (input minHeight). Skeleton screens (no spinners). Bottom sheets modales con BlurWrapper. Animaciones Reanimated (spring/withTiming). Transiciones suaves. Haptics en acciones clave. Safe areas con `edges` config. |
| NFR-04 | Seguridad          | ⚠️ **Parcial** | ⚠️ Auth guard con `<Stack.Protected>` (API no estándar de expo-router) en `_layout.tsx`. No hay `<Redirect />`. ⚠️ Prod usa `expo-secure-store`, no `react-native-encrypted-storage`. ✅ Recordarme opcional. ✅ No persiste credenciales si no se marca. |
| NFR-05 | Persistencia       | ✅ **Hecho** | Carrito via Zustand persist con `SQLiteStorage` (expo-sqlite/kv-store). AuthStore con persist condicional via AsyncStorage (solo si Recordarme). Referencia de pacientes/estaciones/dietas/comidas en SQLite (syncAll en login). |
| NFR-06 | Responsive         | ❌ Pendiente — `supportsTablet: true` en app.json. `useWindowDimensions` se usa solo en `FloatingTabBar` para ancho de tabs. Sin layouts adaptativos para tablet.                                                                        |
| NFR-07 | Clean Architecture | ⚠️ **Parcial** | ✅ `app/` = routing. `src/features/` = modulos (auth, stations, patients, cart). `src/shared/` = atoms, molecules, organisms, hooks, services. ⚠️ History implementado directamente en `app/(app)/(tabs)/history.tsx` en vez de `src/features/history/`. `cart.tsx` en tabs existe pero no registrado (dead code). |
| NFR-08 | Plataforma         | Parcial — probado en Android fisico (Samsung A54). iOS no testeado. Web no testeado.                                                                                                                                                    |
| NFR-09 | Tests              | ⚠️ **Parcial** | ✅ Vitest. 4 suites en `tests/` (api, authStore, validation, useBiometricAuth). ⚠️ `@testing-library/react-native` instalado pero **sin tests de componentes** que lo usen. Solo tests de servicios y hooks. |
| NFR-10 | Rotación           | ✅ Rotación libre, login bloqueado a portrait. Usa `expo-screen-orientation`.                                                                                                                                                           |

---

## Flujo actual (implementado)

```
App inicia
  ↓
null (Zustand hydrate + font load) — SplashScreen.tsx es código muerto
  ↓
useAuthStore.persist.onFinishHydration()
  ├── ¿Hay auth-storage persistido (Recordarme)?
  │   ├── Sí → restaura sesión → (app)/
  │   └── No  → login.tsx (público)
  ↓
LoginScreen
  ├── Input usuario + input contraseña (react-hook-form + zod)
  ├── Checkbox "Recordarme"
  ├── Botón "Ingresar"
  ├── api.login() → fetch /nurses → filter local (workaround json-server v1)
  │   ├── Match → authStore.login(credentials, rememberMe)
  │   │   ├── rememberMe=true  → Zustand partialize persiste en AsyncStorage
  │   │   └── rememberMe=false → solo en memoria (Zustand)
  │   └── No match → error "Credenciales inválidas"
  ↓
Logout → authStore.logout() → limpia estado → layout renderiza login
```

## Flujo actual (completo)

1. Login → user/pass → token o error → syncAll (descarga stations, patients, dietas, comidas a SQLite)
2. Seleccionar estacion → lista de pacientes
3. Buscar paciente por nombre
4. Seleccionar paciente → ver header con nombre, room chip, dieta
5. Elegir tiempo (Desayuno/Almuerzo/Merienda/Cena) → ver comidas
6. Tocar comida → AddToCartSheet con flag Hoy/Mañana + nota opcional
7. Icono carrito en header con badge contador → PatientCartSheet
8. Remover items si es necesario
9. "Enviar a cocina" → cartStore.submitOrder: POST si online, queue en SQLite si offline → toast feedback
10. Historial: Tab "Historial" → accordion por paciente con Hab./Cama desde SQLite
11. Offline: ConnectivityBanner rojo global; pedidos pendientes se envían al reconectar

---

## Fixes aplicados

- **json-server v1** no soporta multi-query (`?usuario=x&password=y`): traemos todas las enfermeras y filtramos en JS
- **Conditional Stack.Screen** rompe el router: siempre renderizamos ambos grupos. ⚠️ Se usa `<Stack.Protected>` (no estándar) en vez de `<Redirect />`
- **Zustand selector con `.filter()`** causa infinite loop: extraer items con selector plano + `useMemo` para filtrar
- **Dual SQLite connection** en login: `SQLiteProvider.onInit` y `LoginScreen.getDb()` abren conexiones separadas, causando race condition. Fix: store ref compartida via `setDb()`/`getDb()`.
- **ToastProvider no renderizado**: envuelto `_layout.tsx` correctamente.
- **Hab./Cama vacío**: historia ahora lee `patients` desde SQLite en lugar de hardcodear `''`.
- **Pedidos offline**: `cartStore.submitOrder` usa `NetInfo.fetch()` para decidir POST vs queue en `pedidos_queue`; `flushQueue()` en reconectar.
- **BlurView en Android** sin `blurTarget` se cae a "none": `BlurWrapper` usa View semitransparente en Android, BlurView nativo en iOS
- **Accordion con hidden measurer** janky en Android: reescrito con `LinearTransition` + `FadeIn`/`FadeOut` (UI thread)
- **Safe areas**: todas las screens con `edges` explicitos (top / bottom / ambos) segun contexto
- **Lora-Italic** recortada en Android: `lineHeight: 44` + `paddingBottom: 4`
- **API URL** en Android fisico: `EXPO_PUBLIC_API_URL` via `process.env` + ADB reverse (`127.0.0.1`)
- **Login layout**: `justifyContent: 'center'`, KAV `behavior='height'`, `paddingBottom` con insets
