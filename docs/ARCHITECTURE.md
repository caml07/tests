# Dietas — Architecture

## Stack

| Capa | Tecnología |
|------|-----------|
| Framework | Expo SDK 56 (React Native 0.85, React 19) |
| Navigation | expo-router (file-based, typed routes) |
| Server state | @tanstack/react-query v5 |
| Client state | Zustand v5 + persist (AsyncStorage / SQLiteStorage vía expo-sqlite/kv-store) |
| Local DB | expo-sqlite (SQLite, schema: stations, patients, dietas, comidas, pedidos_queue) |
| Network | @react-native-community/netinfo |
| Animations | Reanimated 4 + Gesture Handler |
| Forms | react-hook-form + zod |
| API mock | json-server (docs/db.json, port 3001) |
| Icons | lucide-react-native |
| Glassmorphism | expo-blur (BlurView) |
| Fonts | Plus Jakarta Sans + Lora Italic (expo-font) |

## Platform

- **Mobile-first**: Single-column, thumb-zone friendly
- **Tablet**: Breakpoint at 768px (no implementado aún)
- **Android físico**: Samsung Galaxy A54 (desarrollo)
- **iOS**: Compatible (no testeado en físico)

---

## Routing Architecture

```
app/
  _layout.tsx                    Root Stack + Providers
  login.tsx                      Pantalla pública
  (app)/
    _layout.tsx                  Stack con auth guard
    (tabs)/
      _layout.tsx                Tabs con FloatingTabBar (glass, 2 tabs)
      index.tsx                  StationsScreen
      history.tsx                HistoryScreen (pedidos globales)
    paciente/
      [stationId].tsx            PatientListScreen (FlatList + search)
      [stationId]/
        [patientId].tsx          PatientMenuScreen (FlatList + tiempo selector)
```

---

## SQLite Offline Architecture

### Schema

```typescript
// nutricion.db — 4 tablas de referencia + 1 cola offline
tables:
  stations:   id, nombre
  patients:   id, nombre, stationId, habitacion, cama, dietaId, alergias (JSON), notas
  dietas:     id, nombre, tiempos (JSON), simbolo
  comidas:    id, dietaId, nombre, tiempo, subcomidas (JSON)
  pedidos_queue: id (TEXT PK), items (JSON), pacienteId, pacienteNombre, timestamp, failed_attempts
```

### Data Flow (offline-first)

```
Login exitoso
  ↓
syncAll(db) descarga en paralelo: stations + patients + dietas + comidas
  ↓
Upsert a SQLite (las tablas se truncan y re-pueblan en cada sync)
  ↓
UI lee desde:
  ├── SQLite directo: patients (history.tsx), stations (futuro)
  ├── API directa: pedidos (GET /pedidos siempre online)
  └── Zustand (SQLiteStorage): carrito

Envío de pedido:
  cartStore.submitOrder()
    ├── ¿Hay conexión? → POST /pedidos → OK
    └── No conexión → INSERT en pedidos_queue → toast "guardado localmente"

Reconexión:
  NetInfo listener detecta change → flushQueue(db)
    ├── Lee pedidos_queue ordenado por created_at
    ├── POST /pedidos para cada uno
    ├── DELETE en éxito, incrementa failed_attempts en fallo
    └── Toast: "N pedido(s) enviado(s)" / "Error al enviar N pedido(s)"
```

### Sync

- `syncAll(db)`: `Promise.all` de 4 fetches GET, upsertRows por tabla, catch silencioso.
- `flushQueue(db)`: lectura batch con `failed_attempts < 5`, POST secuencial, delete on success.

### Offline UI

- **ConnectivityBanner**: barra roja "Sin conexión — los pedidos se guardarán localmente", animada con Reanimated slide in/out. Renderizada globalmente en `Screen.tsx`.
- **ConnectivityBanner** usa `useNetworkStatus` hook (NetInfo wrapper).
- **DatabaseSync** en `_layout.tsx`: escucha reconexión, ejecuta flushQueue, muestra toasts.

---

## Navigation Flow

```
Login → Stations → Patients → Patient Menu
                                  ├── AddToCartSheet (per comida)
                                  ├── PatientCartSheet (badge en header)
                                  └── PatientHistorySheet (reloj en header)
```

**Flujo de carrito por paciente:**
1. Enfermero selecciona estación → paciente
2. Ve el menú del paciente, agrega comidas al carrito local
3. Badge en icono de carrito muestra cantidad
4. Toca carrito → abre `PatientCartSheet` (solo items del paciente actual)
5. "Enviar a cocina" → POST /pedidos → limpia carrito de ese paciente
6. Vuelve a lista de pacientes → selecciona otro paciente → repite

---

## Data Flow

```
Enfermero autenticado (via /nurses)
       ↓
  syncAll(db) → descarga stations + patients + dietas + comidas a SQLite
       ↓
  UI lee estaciones desde API (GET /stations) o desde SQLite
       ↓
  Selecciona estación → GET /patients?estacion=X (API) o SQLite lookup
       ↓
  Selecciona paciente → SQLite: dietas + comidas (ya cacheados)
       ↓
  Menú del paciente (agrupado por tiempo: D/A/M/C)
       ↓
  Agrega al carrito → Zustand store (SQLiteStorage, Items[] por pacienteId)
       ↓
  Enviar pedido → cartStore.submitOrder()
       ├── Online → POST /pedidos → json-server guarda
       └── Offline → INSERT pedidos_queue (SQLite) → flushQueue al reconectar
       ↓
  Carrito se limpia (solo de ese paciente)
```

---

## Core Entities

Definiciones en `src/shared/types/index.ts`:

```typescript
interface User { id, nombre, estaciones }
interface Station { id, nombre }
interface Patient { id, nombre, stationId, habitacion, cama, dietaId, alergias[], notas }
interface Dieta { id, nombre, tiempos[], simbolo }
interface Comida { id, dietaId, nombre, tiempo, subcomidas[] }
interface Subcomida { id, nombre, descripcion, ingredientes[] }
interface Ingrediente { id, nombre }
interface CartItem { id, comidaId, comidaNombre, pacienteId, pacienteNombre, flagHoy, nota }
interface Order { id, items[], pacienteId, timestamp, status: 'sent' | 'en_cocina' }
```

---

## Cart Architecture (Zustand + SQLiteStorage)

```typescript
interface CartState {
  items: CartItem[]          // flat array, filtrable por pacienteId
  addItem: (item) => void
  removeItem: (itemId) => void
  clearCart: () => void
  clearByPatient: (patientId) => void
  getItemsByPatient: (patientId) => CartItem[]  // selector
  getCountByPatient: (patientId) => number      // badge
  submitOrder: (patientId, patientNombre) => Promise<void>  // online POST o offline queue
}
```

### Persistencia

- `createJSONStorage(() => new SQLiteStorage('dietas-cart-db'))` via `expo-sqlite/kv-store`.
- `onRehydrateStorage` llama a `clearStaleItems()` (filtra items con `createdAt` anterior a hoy).
- `partialize` persiste solo `items` (no acciones).

### Submit Order (offline-aware)

```typescript
submitOrder: async (patientId, patientNombre) => {
  const items = get().items.filter(i => i.pacienteId === patientId);
  const isOnline = (await NetInfo.fetch()).isConnected;
  if (isOnline) {
    await api.postPedido(items);      // POST /pedidos
  } else {
    await db.runAsync(                 // INSERT pedidos_queue
      'INSERT INTO pedidos_queue ...', [patientId, patientNombre, JSON.stringify(items)]
    );
  }
  get().clearByPatient(patientId);
}
```

El store es plano (no agrupado internamente) pero expone selectores por `pacienteId`. La UI del carrito solo muestra items del paciente actual.

---

## Key Decisions (ADRs)

| ADR | Decisión | Fecha |
|-----|----------|-------|
| ADR-001 | Feature-Sliced architecture + Expo Router | 2026-06-16 |
| ADR-002 | Zustand para client state, React Query para server state | 2026-06-16 |
| ADR-003 | Carrito por paciente, no global | 2026-06-23 |
| ADR-004 | Glassmorphism (BlurView) para tab bar y sheets | 2026-06-16 |
| ADR-005 | Ordenes status: 'sent' | 'en_cocina' | 2026-06-23 |
| ADR-006 | ADB reverse + EXPO_PUBLIC_API_URL para físico | 2026-06-23 |
| ADR-007 | Offline-first con SQLite (expo-sqlite) | 2026-06-24 |

---

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | /nurses | Login (validación cliente-side) |
| GET | /stations | Lista de estaciones |
| GET | /patients | Pacientes (filtro por estación en cliente) |
| GET | /dietas | Tipos de dieta |
| GET | /comidas | Catálogo de comidas con subcomidas |
| GET | /pedidos | Historial de pedidos (todos) |
| POST | /pedidos | Crear nuevo pedido (status: 'sent') |

Mock API: `npx json-server docs/db.json --port 3001`

---

## Screen States

Every data screen handles these states:

| State | UX |
|-------|-----|
| Loading | Skeleton cards with shimmer animation |
| Empty | Icon + title + message (centrado) |
| Error | Error message + retry button |
| Success | Actual content (list, cards, menu) |
| Offline | Top banner (ConnectivityBanner rojo, "Sin conexión") + offline queue para pedidos |

---

## Security

- Dev: mock auth via json-server (no encriptación)
- Prod: JWT + expo-secure-store (pendiente)
- Credenciales nunca commiteadas

---

## Performance

| Técnica | Dónde |
|---------|-------|
| FlatList con windowSize + maxToRenderPerBatch | history, patient menu, patient list |
| React.memo en items de lista | OrderCard, MenuItem |
| Reanimated en UI thread | animaciones de acordeón, tab bar |
| Zustand persist async | carrito, auth |
| removeClippedSubviews | patient menu FlatList |
