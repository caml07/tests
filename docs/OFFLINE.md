# Arquitectura Offline-First

## Stack

| Componente | Tecnología |
|---|---|
| Base de datos local | expo-sqlite (SQLite nativo) |
| KV store para Zustand | expo-sqlite/kv-store (`SQLiteStorage`) |
| Detección de red | @react-native-community/netinfo |
| Sincronización | Custom (`sync.ts`) |
| Conexión compartida | `setDb()` / `getDb()` pattern |

## Esquema SQLite (`nutricion.db`)

```sql
CREATE TABLE IF NOT EXISTS agrupaciones (
  id TEXT PRIMARY KEY,
  nombre TEXT NOT NULL,
  icon TEXT NOT NULL DEFAULT ''
);

CREATE TABLE IF NOT EXISTS stations (
  id TEXT PRIMARY KEY,
  nombre TEXT NOT NULL,
  agrupacionId TEXT NOT NULL DEFAULT ''
);

CREATE TABLE IF NOT EXISTS patients (
  id TEXT PRIMARY KEY,
  nombre TEXT NOT NULL,
  stationId TEXT,
  habitacion TEXT,
  cama TEXT,
  dietaId TEXT,
  alergias TEXT,   -- JSON array
  notas TEXT
);

CREATE TABLE IF NOT EXISTS dietas (
  id TEXT PRIMARY KEY,
  nombre TEXT NOT NULL,
  tiempos TEXT,     -- JSON array
  simbolo TEXT
);

CREATE TABLE IF NOT EXISTS comidas (
  id TEXT PRIMARY KEY,
  dietaId TEXT,
  nombre TEXT NOT NULL,
  tiempo TEXT,
  subcomidas TEXT   -- JSON array
);

CREATE TABLE IF NOT EXISTS pedidos_queue (
  id TEXT PRIMARY KEY NOT NULL,
  items TEXT NOT NULL DEFAULT '[]',
  pacienteId TEXT NOT NULL,
  pacienteNombre TEXT NOT NULL,
  timestamp TEXT NOT NULL,
  failed_attempts INTEGER NOT NULL DEFAULT 0
);
```

## Flujo de Datos

### 1. Login — Carga inicial

```
Login exitoso
    ↓
syncAll(db)
    ├── GET /agrupaciones → upsertRows('agrupaciones', data)
    ├── GET /stations     → upsertRows('stations', data)
    ├── GET /patients     → upsertRows('patients', data)
    ├── GET /dietas       → upsertRows('dietas', data)
    └── GET /comidas      → upsertRows('comidas', data)
    ↓
UI lista desde SQLite (o API directa para pedidos)
```

### 2. Durante el uso

```
Navegación normal
    ↓
├── Estaciones    → GET /stations (API) o SQLite
├── Pacientes     → GET /patients?estacion=X (API)
├── Dietas/Comidas → SQLite lookup (ya cacheados)
├── Carrito       → Zustand (SQLiteStorage persist)
└── Historial     → GET /pedidos (API) + pacientes desde SQLite para Hab./Cama
```

### 3. Envío de pedido

```
Usuario toca "Enviar a cocina"
    ↓
cartStore.submitOrder(patientId, patientNombre)
    ↓
NetInfo.fetch() → ¿hay conexión?
    ├── Sí → POST /pedidos → ok → toast "Pedido enviado"
    └── No  → INSERT pedidos_queue → toast "Guardado localmente, se enviará al reconectar"
    ↓
clearByPatient(patientId) — limpia carrito
```

### 4. Reconexión

```
NetInfo listener detecta isConnected = true
    ↓
DatabaseSync component
    ↓
flushQueue(db)
    ↓
SELECT * FROM pedidos_queue WHERE failed_attempts < 5
    ↓
Por cada fila:
    ├── POST /pedidos con items
    ├── Éxito → DELETE FROM pedidos_queue WHERE id = ?
    └── Error → UPDATE failed_attempts += 1
    ↓
Toast: "N pedido(s) enviado(s)" o "Error al enviar N pedido(s)"
```

## Conexión Compartida (Single Db)

Para evitar race conditions de migración, se usa un patrón de referencia compartida:

```typescript
// database.ts
let db: SQLiteDatabase | null = null;

export function setDb(instance: SQLiteDatabase) {
  db = instance;
}

export function getDb(): SQLiteDatabase {
  if (!db) throw new Error('getDb() llamado sin conexión activa');
  return db;
}
```

`app/_layout.tsx` llama `initDatabase().then(setDb)` al montar. Si falla (DB corrupta), automaticamente borra y recrea el archivo. Cualquier componente que necesite la DB usa `getDbSync()` o `getDb()`.

## Componentes UI

### ConnectivityBanner (`src/shared/atoms/ConnectivityBanner.tsx`)

- Barra roja "Sin conexión — los pedidos se guardarán localmente"
- Animada con Reanimated (slide in/out en UI thread)
- Se renderiza globalmente en `Screen.tsx`

### Screen (`src/shared/organisms/Screen.tsx`)

- `position: relative`
- Renderiza `<ConnectivityBanner />` arriba de todo
- Todos los componentes que usan `Screen` tienen el banner automáticamente

### DatabaseSync (`app/_layout.tsx`)

- No tiene UI propia
- Escucha `useNetworkStatus` para `isConnected`
- Cuando pasa de `false` a `true`, ejecuta `flushQueue(db)`
- Muestra toasts de resultado (éxito/error)

## Hooks

### useNetworkStatus (`src/shared/hooks/useNetworkStatus.ts`)

```typescript
function useNetworkStatus(): { isConnected: boolean | null; isLoading: boolean }
```

Wrapper sobre `@react-native-community/netinfo`. Retorna `isConnected` y `isLoading`. Usado por `ConnectivityBanner` y `DatabaseSync`.

## Archivos Clave

| Archivo | Rol |
|---|---|
| `src/shared/services/database.ts` | Schema, migrate, CRUD helpers, `getDb()`/`setDb()` |
| `src/shared/services/sync.ts` | `syncAll(db)`, `flushQueue(db)` |
| `src/shared/hooks/useNetworkStatus.ts` | Hook de conectividad |
| `src/shared/atoms/ConnectivityBanner.tsx` | Banner offline animado |
| `src/shared/organisms/Screen.tsx` | Renderiza ConnectivityBanner global |
| `app/_layout.tsx` | SQLiteProvider, DatabaseSync, NetInfo listener |
| `src/features/cart/store/cartStore.ts` | `submitOrder()` con offline queue |
| `src/features/auth/screens/LoginScreen.tsx` | `syncAll()` post-login |
| `app/(app)/(tabs)/history.tsx` | Lee pacientes desde SQLite |
| `src/shared/services/api.ts` | `getAllPatients()`, `getComidas()`, timeout 10s |

## Consideraciones

- **expo-sqlite requiere native build**: `npx expo run:android`, no Expo Go.
- **Sync no es incremental**: `syncAll` trunca y re-puebla todo. Para mejorar, agregar `updated_at` y sync incremental.
- **Límite de reintentos**: `flushQueue` filtra `failed_attempts < 5` para evitar bucles infinitos con pedidos corruptos.
- **`submitOrder` se llama desde `PatientCartSheet`**: reemplazó el hook `useSubmitOrder`. El botón "Enviar a cocina" ahora es async con toast de feedback inmediato.
