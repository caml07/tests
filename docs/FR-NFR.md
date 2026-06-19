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

| ID    | Nombre                | Estado       | Descripcion                                                                                                                                                            |
| ----- | --------------------- | ------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| FR-01 | Autenticacion         | ✅ **Hecho** | Login con user/pass contra mock API. Recordarme opcional (guarda sesion en AsyncStorage solo si se marca). Logout. Fade-out splash con logo HVP mientras hidrata auth. |
| FR-02 | Seleccion de estacion | ✅ **Hecho** | Listar estaciones desde la API. Scroll horizontal tipo cookies.                                                                                                        |
| FR-03 | Info del paciente     | ✅ **Hecho** | Ver datos basicos, dieta asignada, alergias. Busqueda por nombre.                                                                                                      |
| FR-04 | Exploracion de menu   | ❌ Pendiente | Arbol expandible: tiempo > comidas > subcomidas > ingredientes.                                                                                                        |
| FR-05 | Comanda               | ❌ Pendiente | Agregar comida al carrito con flag Hoy/Mañana + nota.                                                                                                                  |
| FR-06 | Carrito global        | ❌ Pendiente | Items cross-paciente. Remover items. Persistencia local.                                                                                                               |
| FR-07 | Envio a cocina        | ❌ Pendiente | Confirmacion, POST a API, feedback, limpiar carrito.                                                                                                                   |
| FR-08 | Historial             | ❌ Pendiente | Historial de pedidos enviados, filtro por paciente.                                                                                                                    |

---

## NFR — Requisitos No Funcionales

| ID     | Nombre             | Descripcion                                                                                                                                                                             |
| ------ | ------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| NFR-01 | Conectividad       | Indicador de conexion. Timeouts. Manejo de errores de red. _(pendiente)_                                                                                                                |
| NFR-02 | Rendimiento        | FlatList/FlashList, cache de menus. _(pendiente)_                                                                                                                                       |
| NFR-03 | UX                 | Touch >= 44px. Skeleton screens (no spinners). Bottom sheets (no Alert). Animaciones Reanimated. Transiciones suaves (splash fade-out). _(parcial: splash fade-out listo)_              |
| NFR-04 | Seguridad          | Auth guard con Redirect por screen. Recordarme opcional. AsyncStorage para dev → **react-native-encrypted-storage antes de prod**. No persistir credenciales si no se marca Recordarme. |
| NFR-05 | Persistencia       | Carrito via Zustand persist en AsyncStorage. _(pendiente)_                                                                                                                              |
| NFR-06 | Responsive         | react-native-responsive-screen para phones + tablets. _(pendiente)_                                                                                                                     |
| NFR-07 | Clean Architecture | `app/` = routing + screens tontas. `src/` = components/hooks/services/store. Separacion clara de capas.                                                                                 |
| NFR-08 | Plataforma         | Android + iOS + Web (Expo Go).                                                                                                                                                          |
| NFR-09 | Tests              | Vitest + testing-library. Tests en `tests/` (no co-located). Testeamos auth store, api, validation.                                                                                     |

---

## Flujo actual (implementado)

```
App inicia
  ↓
SplashScreen (logo HVP + azul primary) con fade-out 400ms
  ↓
hydrate() lee AsyncStorage
  ├── ¿Hay @dietas:auth guardado (Recordarme)?
  │   ├── Sí → restaura sesión → (app)/
  │   └── No  → login.tsx (público)
  ↓
LoginScreen
  ├── Input usuario + input contraseña (react-hook-form + zod)
  ├── Checkbox "Recordarme"
  ├── Botón "Ingresar"
  ├── api.login() → fetch /nurses → filter local (workaround json-server v1)
  │   ├── Match → authStore.login(credentials, rememberMe)
  │   │   ├── rememberMe=true  → storage.saveAuth() → AsyncStorage
  │   │   └── rememberMe=false → solo en memoria (Zustand)
  │   └── No match → error "Credenciales inválidas"
  ↓
Logout → storage.clearAuth() → limpia Zustand → redirect a /login
```

## Flujo futuro (completo)

1. Login → user/pass → token
2. Seleccionar estacion → lista de pacientes
3. Seleccionar paciente → ver dieta, alergias, notas
4. Elegir tiempo (D/A/M/C) → ver menu expandible
5. Agregar al carrito → flag Hoy/Mañana + nota
6. Revisar carrito → remover si es necesario
7. Enviar → confirmar → POST a API → feedback

---

## Fixes aplicados

- **json-server v1** no soporta multi-query (`?usuario=x&password=y`): traemos todas las enfermeras y filtramos en JS
- **Conditional Stack.Screen** rompe el router: siempre renderizamos ambos grupos, cada screen se protege con `<Redirect />`
