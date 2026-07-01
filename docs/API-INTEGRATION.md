# API Integration — Fase 1: Login + Censo

## Resumen

Migrar de REST API mock (json-server localhost:3001) a API real de HVP Vivian Pellas.
La API real no es REST — es un endpoint único command-based (Interface HIS Pattern).

**Scope Fase 1** (solo esto):
- Login contra API real
- Sincronizar censo de pacientes
- Ver todas las estaciones
- Ver pacientes por estación con su info (habitación, cama, alergias)
- Sin dietas asignadas aún
- Sin cambios en lógica de pedidos/carrito

---

## Arquitectura target

```
┌──────────┐     POST /Interface/HIS?strSystem=HVPDietaApp     ┌──────────────────┐
│   App    │ ────────────────────────────────────────────────→  │  HVP HIS Portal  │
│          │ ←────────────────────────────────────────────────  │                  │
│  api.ts  │     [{ strToken, strInterfaceMsg, strU, ... }]    │  portalvivian    │
└────┬─────┘                                                    │  pellas.com.ni   │
     │                                                          └──────────────────┘
     │ syncAll() parsea listCenso
     ▼
┌──────────┐
│  SQLite  │ ← agrupaciones, stations, patients
└────┬─────┘
     │ Hooks leen de SQLite (offline-first)
     ▼
┌──────────┐
│  UI      │
└──────────┘
```

## API endpoint

```
URL:     https://www.portalvivianpellas.com.ni/EME4/Interface/HIS?strSystem=HVPDietaApp
Method:  POST
Body:    [{ strToken, strInterfaceMsg, strU, strP?, strTokenTransaccion?, ... }]
```

### Static token

```
df9d848b-e164-49ee-a9f0-602468375674
```

---

## Endpoints (commands)

### 1. login

**Request:**
```json
[{
  "strToken": "df9d848b-e164-49ee-a9f0-602468375674",
  "strInterfaceMsg": "login",
  "strU": "andrea",
  "strP": "1234"
}]
```

**Response:**
```json
[{
  "strMsg": "Token transaccion generado!",
  "strMsgType": "success",
  "strTokenTransaccion": "B97E4FA3-3E8B-4281-BFA3-FFEE88838FB3",
  "intMsgError": 0,
  "datResponse": "2026-06-30T08:41:13.087"
}]
```

**Output**: Se guarda `strTokenTransaccion` en auth store.

### 2. censo

**Request:**
```json
[{
  "strToken": "df9d848b-e164-49ee-a9f0-602468375674",
  "strInterfaceMsg": "censo",
  "strU": "andrea",
  "strTokenTransaccion": "B97E4FA3-..."
}]
```

**Response:**
```json
[{
  "strMsg": "Lista Censo!",
  "strMsgType": "success",
  "intMsgError": 0,
  "listCenso": [
    {
      "decPaciente": 4656906,
      "decCuenta": 207453,
      "strPacienteNombresApellidos": "MR VICHAI SERMTHAVISUB",
      "strAreaServicio": "EGY",
      "intHabitacion": 3,
      "intCama": 5,
      "strAlergias": "No Refiere Alergias",
      "strAgrupacion": "EMERGENCIA",
      "intAgrupacion": 1,
      "strSexo": "M",
      "strEdad": "59 años",
      "strMotivoConsulta": "..."
    }
  ]
}]
```

**Output**: Se parsea en agrupaciones, stations, patients → SQLite.

---

## Mapeo de datos

### CensoPatient → Patient

| Campo API | Nuestro tipo | Notas |
|---|---|---|
| `decCuenta` | `Patient.id` | Cuenta de admisión = ID único (pueden visitar varias veces) |
| `decPaciente` | `Patient.decPaciente` (nuevo campo) | ID permanente del paciente |
| `strPacienteNombresApellidos` | `Patient.nombre` | Nombre limpio, sin HTML |
| `strAreaServicio` | `Patient.stationId` | Código de estación |
| `intHabitacion` | `Patient.habitacion` | Número de habitación |
| `intCama` | `Patient.cama` | Número de cama |
| `strAlergias` | `Patient.alergias` | String plano (no array) |
| `strMotivoConsulta` | `Patient.notas` | Motivo/notas |

### CensoPatient → Station y Agrupacion (derivados)

De cada paciente se extraen valores únicos:

```typescript
station = {
  id: "EGY",
  nombre: "EGY"  // código como nombre por ahora
  agrupacionId: "1"
}

agrupacion = {
  id: "1",
  nombre: "EMERGENCIA",
  icon: "cross.case"  // icono fijo según tipo
}
```

---

## Cambios por archivo

### 1. `src/shared/utils/config.ts`

Agregar:

```typescript
export const STATIC_TOKEN = 'df9d848b-e164-49ee-a9f0-602468375674'
export const INTERFACE_URL = 'https://www.portalvivianpellas.com.ni/EME4/Interface/HIS'
export const INTERFACE_SYSTEM = 'HVPDietaApp'
```

### 2. `src/shared/types/index.ts`

- Agregar `CensoPatient`, `InterfaceResponse<T>`
- `AuthResponse` → `{ strTokenTransaccion: string, strU: string }`
- `Patient.alergias`: `string` → `string[] | string`
- `Patient` agregar `decPaciente?: number`

### 3. `src/shared/services/api.ts`

**Rewrite completo del módulo.**

- Nuevo helper `interfaceRequest<T>(command, extra?, noAuth?)`
- Nuevas funciones: `login(usuario, password)`, `getCenso()`
- REST endpoints se convierten en lecturas de SQLite (ya no hacen fetch):
  - `getEstaciones()` → SQLite
  - `getAgrupaciones()` → SQLite  
  - `getAllPatients()` → SQLite
  - `getPacientes(stationId)` → SQLite
  - `getPatient(id)` → SQLite
- Se quedan igual:
  - `getDietas()` (mock local)
  - `getComidas()` (mock local)
  - `getMenu()`, `getMenuByDieta()` (mock local)
  - `postPedido()` (offline queue)
  - `getPedidos()` (offline queue)

### 4. `src/features/auth/services/authService.ts`

- Eliminar `MOCK_NURSES` y la rama `if (__DEV__)`
- Siempre llamar `api.login(usuario, password)`

### 5. `src/features/auth/store/authStore.ts`

- `user.id` = `strU` (username)
- `user.nombre` = `strU` (login no devuelve nombre real)
- `user.estaciones` = `undefined` (se ven todas)
- Guardar `strU` en el store persistido

### 6. `src/shared/services/sync.ts`

`syncAll()` cambia de 5 llamadas REST a 1 llamada + parseo:

```typescript
export async function syncAll(db, queryClient) {
  const censo = await api.getCenso()  // única llamada
  const { agrupaciones, stations, patients } = parseCenso(censo.listCenso)
  await upsertRows(db, 'agrupaciones', agrupaciones)
  await upsertRows(db, 'stations', stations)
  await upsertRows(db, 'patients', patients)
  setQueryCache(queryClient, { agrupaciones, stations, patients })
}
```

### 7. `src/shared/services/database.ts`

- Schema: `patients.strAlergias` como TEXT (string plano, no JSON array)
- No se requiere migración (el schema actual ya soporta texto)

---

## Comportamiento offline

| Situación | Qué pasa |
|---|---|
| Sin internet al login | Error "No hay conexión" |
| Login OK, sin internet al sync | Último censo en SQLite funciona |
| Sin internet al navegar | Datos del último sync en SQLite |
| Sin internet al enviar pedido | Se encola (sin cambios) |

---

## Features fuera de scope (vienen después)

| Feature | Estado |
|---|---|
| Dietas (catálogo) | Seed local desde mock data |
| Comidas (catálogo) | Seed local desde mock data |
| Asignar dieta a paciente | No existe en API aún |
| POST pedido a cocina | Offline queue (sin cambios) |
| GET pedidos historial | Desde SQLite local (sin cambios) |
| PATCH status pedido | No existe en API aún |

---

## Testing

1. `EXPO_PUBLIC_API_URL` no afecta — se usa `INTERFACE_URL`
2. Login real: `andrea` / `1234` (según API)
3. Verificar censo: todas las estaciones, pacientes con datos reales
4. Sin ADB reverse necesario (HTTPS público)
