---
name: Dietas
description: App movil de comanda de dietas para enfermeria. Enfermeros comandan dietas para pacientes de su estacion contra API existente del hospital.
stack: React Native + TypeScript + Expo SDK 56
colors:
  primary: "#0284c7"
  on-primary: "#ffffff"
  primary-hover: "#0369a1"
  secondary: "#0ea5e9"
  surface: "#f8fafc"
  on-surface: "#0f172a"
  on-surface-muted: "#64748b"
  outline: "#e2e8f0"
  error: "#ef4444"
  success: "#22c55e"
  warning: "#f59e0b"
typography:
  fontFamily: Inter
  title:
    fontSize: 17px
    fontWeight: 600
  body:
    fontSize: 15px
    fontWeight: 400
  caption:
    fontSize: 13px
    fontWeight: 400
  label:
    fontSize: 12px
    fontWeight: 500
    textTransform: uppercase
rounded:
  sm: 6px
  md: 10px
  lg: 16px
touchTarget: 44px
iconSet: phosphor
---

# Dietas — Design Spec

## Overview

App movil para que **enfermeros/as** comanden dietas para pacientes de su estacion. Reemplaza el sistema actual en papel. Consume una API hospitalaria existente que provee pacientes, dietas, menus, y recibe pedidos.

**Stack:** React Native + TypeScript + Expo SDK 56  
**Consume:** API existente del hospital (JWT, REST)

---

## Color System

Azul como color principal, inspirado en paletas healthcare que transmiten **confianza, calma y profesionalismo**.

| Token | Hex | Uso |
|---|---|---|
| `primary` | `#0284c7` | Botones principales, links, active states |
| `primary-hover` | `#0369a1` | Hover/pressed de primary |
| `secondary` | `#0ea5e9` | Badges, chips, indicadores secundarios |
| `surface` | `#f8fafc` | Fondo de pantallas y cards |
| `on-surface` | `#0f172a` | Texto principal, headings |
| `on-surface-muted` | `#64748b` | Texto secundario, placeholders |
| `outline` | `#e2e8f0` | Bordes de cards, inputs, separadores |
| `error` | `#ef4444` | Alergias, errores, alertas criticas |
| `success` | `#22c55e` | Confirmaciones, exito, delivered |
| `warning` | `#f59e0b` | NPO, advertencias |

---

## UX Principles (User-Friendly)

Basado en buenas practicas de mobile UX y accesibilidad para React Native:

| Principio | Implementacion |
|---|---|
| **Thumb zone** | Acciones primarias siempre en tercio inferior. Navegacion inferior. |
| **Touch targets ≥ 44px** | Todos los botones, chips, items de lista, iconos tapables. |
| **Jerarquia visual clara** | Cards con sombra suave, espacio blanco generoso. |
| **Feedback inmediato** | Toasts en acciones exitosas/fallidas. Indicador de conectividad permanente. |
| **Confirmaciones** | Bottom sheets, nunca alert nativo. Boton destructivo alejado del confirmar. |
| **Accesibilidad** | `accessibilityLabel`, `accessibilityRole`, `role` en todos los elementos. Soportar VoiceOver/TalkBack. |
| **Reducir carga cognitiva** | Maximo 3 pasos para completar accion principal. Texto claro, sin jerga. |
| **Modo offline** | Cache de menus, carrito persistente, indicador de conectividad. |

---

## Estaciones como Cookies

Las estaciones se muestran como **chips grandes (cookies)** horizontal scroll en la parte superior de la pantalla.

```
┌──────────────────────────────────────────┐
│  [ 3er Piso ]  [ 5to Piso ]  [ UTI ]    │ ← scroll horizontal
│                    ●                      │ ← indicador de paginacion
└──────────────────────────────────────────┘
```

- Altura minima: 52px / touch target ≥ 44px
- Chip seleccionado: `primary` bg + texto blanco + check icon
- Chip no seleccionado: `outline` border + `on-surface-muted` texto
- Persiste entre sesiones (AsyncStorage)

---

## Screens

### Login (`FR-01`)
- Centered card, input de user + password
- Boton "Ingresar" grande (≥ 56px height)
- Error state: mensaje inline rojo debajo del boton
- Al exito: naviga a estaciones
- Al expirar token: modal de re-login que preserva carrito

```
┌──────────────┐
│   Hospital   │
│  ┌────────┐  │
│  │ Usuario │  │
│  └────────┘  │
│  ┌────────┐  │
│  │ Contrase│  │
│  └────────┘  │
│  [ Ingresar ]│ ← primary, full-width, 56px
└──────────────┘
```

### Estaciones (`FR-02`)
- Cookies horizontal scroll (ver seccion arriba)
- Al seleccionar: muestra lista de pacientes de esa estacion
- Transition animada al cambiar de estacion

### Pacientes (`FR-03`)
- Search bar en top con icono de lupa
- FlatList virtualizada de pacientes
- Cada card:

```
┌─────────────────────────────────┐
│  🛏️ 301A    Juan Perez          │
│  Dieta: Hiposodica       ⚠️     │ ← badge alergia si aplica
│  Notas: Sin sal              ›  │
└─────────────────────────────────┘
```

- Busqueda por nombre con debounce 300ms
- Al tap: navega al menu de ese paciente

### Menu Expandible (`FR-04`)
- Chips de tiempo: **D**esayuno / **A**lmuerzo / **M**erienda / **C**ena
- Selector de tiempo persiste entre pacientes
- Arbol expandible:

```
┌─────────────────────────────────┐
│  ▼ Pollo al horno               │
│  │  • Pechuga de pollo          │
│  │  • Pure de papas             │
│  │    ───────────────────       │
│  │    Ingredientes: pollo,      │
│  │    papa, leche, manteca      │
│  │  • Ensalada de lechuga       │
│  │    ───────────────────       │
│  │    Ingredientes: lechuga,    │
│  │    tomate, cebolla           │
│  [Agregar al carrito]           │ ← CTA grande
└─────────────────────────────────┘
```

- Animacion suave de expansion (Reanimated)
- Tap en comida → expande subcomidas
- Tap en subcomida → expande ingredientes
- Boton "Agregar al carrito" al final de cada comida

### Carrito Global (`FR-05`, `FR-06`)
- Bottom sheet o pantalla separada
- Items agrupados por paciente
- Cada item:

```
┌─────────────────────────────────┐
│  Juan Perez (301A)              │
│  Pollo al horno — Hoy     [🗑️]  │
│  Nota: Sin sal                  │
├─────────────────────────────────┤
│  Maria Lopez (302B)             │
│  Sopa de verduras — Mañana [🗑️] │
└─────────────────────────────────┘
```

- Swipe to remove con confirmacion
- Flag Hoy/Mañana como badge (Hoy = `primary`, Mañana = `warning`)
- Persiste en AsyncStorage via Zustand persist

### Envio a Cocina (`FR-07`)
- Bottom sheet de confirmacion:

```
┌─────────────────────────────────┐
│   Enviar a cocina               │
│                                 │
│   5 items de 3 pacientes        │
│   Se enviaran a cocina ahora    │
│                                 │
│       [Cancelar]  [Enviar]      │
└─────────────────────────────────┘
```

- Loader durante POST
- Success toast: "Pedido enviado" + carrito se limpia
- Error toast: "Error al enviar" + reintentar

### Historial (`FR-08`)
- FlatList de pedidos enviados
- Filtro por paciente (dropdown/bottom sheet)
- Cada card: fecha, hora, items del pedido, paciente

---

## Flujo Principal

```
Login → Seleccionar estacion → Ver pacientes → Elegir paciente
→ Elegir tiempo (D/A/M/C) → Explorar menu expandible
→ Agregar al carrito (Hoy/Mañana + nota) → Revisar carrito
→ Enviar a cocina → Confirmar → POST → Feedback → Carrito limpio
```

---

## Core Entities

```typescript
interface User {
  id: string
  nombre: string
  estaciones: StationId[]
  token: string         // JWT
}

interface Station {
  id: string
  nombre: string        // "3er Piso", "UTI", etc.
}

interface Patient {
  id: string
  nombre: string
  habitacion: string
  cama: string
  dietaId: string
  alergias: string[]
  notas: string
}

interface Dieta {
  id: string
  nombre: string        // "Hiposodica", "Diabetica", etc.
  tiempos: TiempoComida[]
}

interface Comida {
  id: string
  nombre: string
  subcomidas: Subcomida[]
}

interface Subcomida {
  id: string
  nombre: string
  descripcion: string
  ingredientes: Ingrediente[]
}

interface Ingrediente {
  id: string
  nombre: string
  descripcion: string
}

interface CartItem {
  id: string
  comidaId: string
  comidaNombre: string
  pacienteId: string
  flagHoy: boolean       // true = Hoy, false = Mañana
  nota: string
}

interface Order {
  id: string
  items: CartItem[]
  pacienteId: string
  timestamp: string
  status: "sent" | "delivered"
}
```

---

## NFRs Implementation

| ID | Nombre | Implementacion |
|---|---|---|
| NFR-01 | Conectividad | Indicador en status bar. Timeout configurable (default 10s). Retry en errores. Offline banner. |
| NFR-02 | Rendimiento | FlatList virtualizada. Cache de menus (TTL 5min). Lazy loading de arbol expandible. |
| NFR-03 | UX | Touch targets ≥ 44px. Arbol con animaciones. Botones grandes. Confirmaciones en acciones destructivas. |
| NFR-04 | Seguridad | JWT en react-native-encrypted-storage. HTTPS. No persistir credenciales. |
| NFR-05 | Persistencia | Carrito en Zustand persist (AsyncStorage). Relogin modal preserva carrito. |
| NFR-06 | Responsive | react-native-responsive-screen. Phones y tablets. Grid adaptativo. |
| NFR-07 | Clean Architecture | Separation UI / business logic / data. TypeScript estricto. Custom hooks. |
| NFR-08 | Plataforma | Android + iOS via Expo. |

---

## Diagrama de Flujo

Ver `docs/diagrama-flujo.puml` para el diagrama de secuencia detallado.
