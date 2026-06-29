# Pendientes pre‑producción

## Resueltos ✅

| # | Item | Fix |
|---|------|-----|
| A | 🔴 ToastProvider desenchufado | Envuelto `_layout.tsx` con `<ToastProvider>` |
| B | 🔴 `postPedido` hardcodea `en_cocina` | Cambiado a `'sent'` en `api.ts:84` |
| 4 | Alta — `config/api.ts` duplicado | Eliminado (era idéntico a `utils/config.ts`) |
| C | 🟡 `ConfirmOrderSheet` código muerto | Eliminado |
| 3 | LoginScreen white space | Migrado a `<Screen edges={['top','bottom']} scroll>` |
| E | 🟡 `clearSelection()` nunca llamada | Agregado en `authStore.logout()` |
| H | 🟡 `removeClippedSubviews` en history | Agregado a FlatList en `history.tsx` |
| I | 🟡 `PatientAccordion` sin memo | Envuelto con `memo()` en `history.tsx` |
| 8 | Media — Debug log en producción | Envuelto con `if (__DEV__)` |
| J | 🟢 `SplashScreen.tsx` código muerto | Integrado en `_layout.tsx` (render mientras hidrata) |
| 10 | Baja — Flecos biométricos | `login()` limpia `biometric-auth-token` si existe |
| F | 🟢 Tipo `Tiempo` no usado | Eliminado de `types/index.ts` |
| D | 🟡 Hab./Cama vacío en history | `history.tsx` lee pacientes desde SQLite via `getAllRows<Patient>(db, 'patients')` para poblar habitación y cama; badge oculto si vacío |
| 1 | Baja — `cart.tsx` en tabs | Eliminado de tabs + archivo borrado |
| 6 | 🔴 Alta — Conectividad offline (NFR-01) | Implementado: SQLite offline-first con syncAll en login, pedidos_queue para offline, ConnectivityBanner global, flushQueue en reconectar vía NetInfo |

---

## Pendientes

| Prioridad | Item | Esfuerzo |
|-----------|------|----------|
| 🟡 Media | 2 – Tablet adaptation (NFR-06) | 1–2 días |
| 🟡 Media | K – Tests de componentes con testing-library | ½ día |
| 🟡 Media | 7 – iOS testing | ½ día |
