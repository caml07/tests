# Fix offline — pendiente

## Logrado

- `api.ts`: cada método GET tiene try/catch con fallback a SQLite (`tryDeserialize` parsea JSON strings)
- `api.ts`: timeout reducido 30s → 5s
- `api.ts`: `postPedido` chequea `NetInfo` antes de intentar API. Sin WiFi → queuea directo
- `usePatients.ts`: simplificado, normaliza `alergias` en useMemo
- `PatientCard.tsx`: guard `?.` en `showAlergias`
- `[patientId].tsx`: normaliza `alergias`/`tiempos` al setear state
- `cartStore.ts`: `submitOrder` simplificado, usa `order.status === 'local_pending'` para saber si se queueó

## Pendiente

### 1. Sincronización de pedidos_queue al volver el WiFi
Cuando se hace un pedido sin conexión, se guarda en `pedidos_queue` con status `PENDING`. Al volver el WiFi, **no hay código que sincronice automáticamente** esos pedidos pendientes al servidor.

**Afecta:** el error que salió al reconectar WiFi ("error al enviar 1 pedido")

**Posible fix:** crear un hook `useSyncQueue` que:
- Escuche cambios de conectividad (`NetInfo.addEventListener`)
- Cuando vuelva el WiFi, lea todos los `pedidos_queue` con status `PENDING`
- Los envíe al servidor uno por uno con `api.postPedido` (con idempotency key para evitar duplicados)
- Si el envío es exitoso, actualice status a `SENT` o elimine el registro
- Se puede llamar también al entrar a la app y periódicamente

### 2. Pantalla de historial sin datos offline
`getPedidos` en `api.ts` fallbackea a `pedidos_queue` pero solo muestra los que están PENDING. Los pedidos históricos enviados antes de perder conexión no están en SQLite.

**Afecta:** `PatientHistorySheet` puede mostrar vacío offline.

**Posible fix:** sincronizar periódicamente los pedidos enviados a una tabla `pedidos` (o cachear responses de `getPedidos` en SQLite).

### 3. Migración de DB silenciosa
En `database.ts` el catch de migración marca la DB como migrada aunque falle (`PRAGMA user_version = ${DATABASE_VERSION}`). Si la migración falla, las tablas pueden no tener las columnas esperadas.

**Afecta:** si en el dispositivo la DB se corrompió, `getAllAsync` puede devolver filas sin `alergias`, `tiempos`, etc.

**Posible fix:** en lugar de `catch` silencioso, loggear el error y reintentar, o borrar y recrear la DB.

### 4. Prueba de concepto completa sin servidor
Para probar offline real en Android con USB:
- Detener json-server (`Ctrl+C` en la terminal donde corre)
- Desactivar WiFi en el celular
- La app debe: cargar pacientes, ver detalle, ver menú, enviar pedido (queuea)
- Reconectar WiFi: los pedidos queueados deben enviarse solos

### Archivos modificados

| Archivo | Cambio |
|---------|--------|
| `src/shared/services/api.ts` | SQLite fallback en todos los métodos + timeout 5s + NetInfo en postPedido |
| `src/shared/services/database.ts` | Export `tryDeserialize` |
| `src/features/patients/hooks/usePatients.ts` | Simplificado, normaliza alergias |
| `src/features/patients/components/PatientCard.tsx` | Guard `?.` en showAlergias |
| `app/(app)/paciente/[stationId]/[patientId].tsx` | Normaliza alergias/tiempos |
| `src/features/cart/store/cartStore.ts` | Simplificado submitOrder |
