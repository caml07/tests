---
name: Dietas
description: App movil de comanda de dietas para enfermeria. Enfermeros comandan dietas para pacientes de su estacion contra API existente del hospital.
stack: React Native + TypeScript + Expo SDK 56
fonts:
  display: Plus Jakarta Sans
  weights: variable (200-800)
  italic: Lora Italic (500)
colors:
  primary: "#0284c7"
  primaryLight: "#e0f2fe"
  primaryDark: "#0369a1"
  secondary: "#0ea5e9"
  background: "#f5f2ed"
  surface: "#f5f2ed"
  surfaceAlt: "#ede8e3"
  textPrimary: "#1a1a1a"
  textSecondary: "#5c5c5c"
  textTertiary: "#9c9c9c"
  success: "#22c55e"
  error: "#ef4444"
  warning: "#f59e0b"
  white: "#ffffff"
  border: "transparent"
  card: "#ffffff"
iconSet: lucide-react-native
touchTarget: 44px
glassmorphism: true
---

# Dietas -- Design Spec

## Overview

App movil para que **enfermeros/as** comanden dietas para pacientes de su
estacion. Reemplaza el sistema actual en papel. Consume una mock API local
(json-server) que provee pacientes, dietas, menus y recibe pedidos.

**Stack:** React Native + TypeScript + Expo SDK 56
**Router:** expo-router (file-based routing)
**State:** Zustand 5 + @tanstack/react-query
**Consume:** Mock API REST (json-server) -- migrar a API hospitalaria con JWT en prod

---

## Design Identity

Estilo **Zen Browser aesthetic** -- minimalista, limpio, con toques de
glassmorphism en elementos flotantes. Inspirado en la calma y claridad visual.

Senales de identidad:
- Fondo calido (`#f5f2ed`) en lugar de blanco puro
- Bordes transparentes en cards -- la jerarquia se logra con sombras suaves y espaciado generoso
- Glassmorphism en tab bar y bottom sheets via `BlurView` + `backdropFilter`
- Lora Italic para acentos textuales (notas, labels decorativos)
- Avatar con icono en vez de iniciales
- Sin badges de fondo en dietas -- icono + texto limpios

---

## Color System

### Light

| Token | Hex | Uso |
|---|---|---|
| `primary` | `#0284c7` | Botones, links, active states |
| `primaryLight` | `#e0f2fe` | Avatar bg, estacion seleccionada |
| `primaryDark` | `#0369a1` | Hover/pressed |
| `secondary` | `#0ea5e9` | Indicadores |
| `background` | `#f5f2ed` | Fondo general (off-white calido) |
| `surface` | `#f5f2ed` | Fondo de contenedores |
| `surfaceAlt` | `#ede8e3` | Headers, botones secundarios |
| `textPrimary` | `#1a1a1a` | Texto principal |
| `textSecondary` | `#5c5c5c` | Texto secundario |
| `textTertiary` | `#9c9c9c` | Iconos, textos muy secundarios |
| `success` | `#22c55e` | Confirmaciones |
| `error` | `#ef4444` | Errores, alertas |
| `warning` | `#f59e0b` | Advertencias |
| `white` | `#ffffff` | Cards, texto sobre primary |
| `card` | `#ffffff` | Fondo de tarjetas |
| `overlay` | `rgba(0,0,0,0.4)` | Backdrop modales |
| `border` | `transparent` | Cards sin borde (solo sombra) |

### Dark

| Token | Hex |
|---|---|
| `primary` | `#38bdf8` |
| `background` | `#1a1a1a` |
| `surface` | `#1a1a1a` |
| `surfaceAlt` | `#2a2a2a` |
| `textPrimary` | `#f0ece4` |
| `textSecondary` | `#a8a096` |
| `textTertiary` | `#706860` |
| `card` | `#2a2a2a` |

Definidos en `src/shared/utils/tokens.ts`, expuestos via `constants/Colors.ts`
como `Colors[colorScheme].primary/text/etc`.

---

## Typography

**Display:** Plus Jakarta Sans (variable 200-800)
**Acentos:** Lora Italic (weight 500) -- para notas, pies, labels decorativos

| Style | Size | Weight | Line H | Font | Uso |
|---|---|---|---|---|---|
| `display` | 34px | 700 | 41px | Plus Jakarta | Titulos de pantalla |
| `title1` | 28px | 700 | 34px | Plus Jakarta | Titulos grandes |
| `title2` | 22px | 700 | 28px | Plus Jakarta | Secciones |
| `title3` | 20px | 600 | 25px | Plus Jakarta | Nombres estacion |
| `headline` | 17px | 600 | 22px | Plus Jakarta | Nombres paciente/comida |
| `body` | 17px | 400 | 22px | Plus Jakarta | Texto general |
| `callout` | 16px | 400 | 21px | Plus Jakarta | Llamados |
| `subhead` | 15px | 400 | 20px | Plus Jakarta | Subtitulos |
| `footnote` | 13px | 400 | 18px | Plus Jakarta | Texto secundario |
| `caption1` | 12px | 400 | 16px | Plus Jakarta | Texto pequeno |
| `caption2` | 11px | 400 | 13px | Plus Jakarta | Tags |
| `loraItalic` | 15px | 500 | 20px | Lora Italic | Notas, acentos |
| `loraCaption` | 12px | 500 | 16px | Lora Italic | Captions decorativos |
| `loraLabel` | 13px | 500 | 18px | Lora Italic | Labels |
| `label` | 12px | 600 | 16px | Plus Jakarta | Labels form (uppercase, letter-spacing 0.5) |
| `button` | 16px | 600 | 22px | Plus Jakarta | Botones |
| `tab` | 11px | 500 | 14px | Plus Jakarta | Tab bar |

---

## UX Principles

| Principio | Implementacion |
|---|---|
| **Thumb zone** | Acciones primarias en tercio inferior. FloatingTabBar inferior. |
| **Touch targets >= 44px** | Todos los elementos interactivos. |
| **Jerarquia sin bordes** | Cards diferenciadas por sombra y espaciado, no por bordes. |
| **Glassmorphism** | Tab bar y bottom sheets con blur traslucido. |
| **Feedback inmediato** | Haptics + spring scale (Reanimated) en botones. |
| **Gestos nativos** | Pan-to-dismiss en bottom sheets via Gesture Handler. |
| **Confirmaciones** | Bottom sheets con glass effect, nunca Alert nativo. |
| **Accesibilidad** | `accessibilityLabel`, `accessibilityRole`, `accessibilityState`. |
| **Reducir carga cognitiva** | Maximo 3 pasos por accion. Texto sin jerga. |

---

## Screens

### Login

- Hero con logo del hospital sobre circulo primary
- Form card: input usuario + contrasena con iconos Lucide
- Checkbox "Recordarme" (Zustand persist)
- Boton "Ingresar" grande (56px) con icono + loading state
- Error state inline rojo

```
+------------------+
|    +--------+    |
|    | LOGO   |    |
|    +--------+    |
|     Dietas       |
|  Hospital V.P.   |
|                  |
|  + Usuario ----+ |
|  | person.fill | |
|  +-------------+ |
|  + Contrasena + |
|  | lock.fill   | |
|  +-------------+ |
|  [ ] Recordarme  |
|  +-------------+ |
|  |  INGRESAR > | |
|  +-------------+ |
+------------------+
```

### Estaciones

- Header con avatar (icono person.fill), nombre del enfermero, boton "Salir"
- Grid de StationCards (2 columnas, 47% width)
- Card: icono building.2.fill centrado + nombre
- Estado selected: fondo primaryLight + borde primary 1.5px + sombra md
- Estado normal: fondo card blanco + sombra sm, sin borde
- Skeleton loading (3 cards), ErrorState, EmptyState
- Pull-to-refresh

```
+------------------------------+
| [person] Hola, Andrea  Salir |
| Elegi una estacion           |
|                              |
| +--------+ +--------+        |
| |building| |building|        |
| | 3er    | | 5to    |        |
| | Piso   | | Piso   |        |
| +--------+ +--------+        |
| +--------+                   |
| |building|                   |
| | UTI    |                   |
| +--------+                   |
+------------------------------+
```

### Pacientes

- Header con nombre de estacion + back button
- Search bar con lupa + filtrado local
- FlatList de PatientCards
- Card: avatar (person.fill icon), nombre, habitacion/cama, dieta con icono + texto, alergias con icono warning, notas, chevron
- Sin borde en card, solo sombra suave
- Spaciado generoso (padding 20, gap 12)
- Skeleton (6 items), EmptyState, Pull-to-refresh

```
+------------------------------+
| < building 3er Piso          |
| + search Buscar paciente... +|
| +----------------------------+|
| | [person] Juan Perez       ||
| | bed.double 301 - Cama A   ||
| | heart.fill Hiposodica   > ||
| +----------------------------+|
| +----------------------------+|
| | [person] Maria Lopez      ||
| | bed.double 302 - Cama B   ||
| | heart.fill Diabetica ! > ||
| +----------------------------+|
+------------------------------+
```

### Menu del Paciente

- PatientMenuHeader: avatar, nombre, habitacion/cama, badge de dieta
- Tiempo chips horizontal scroll (D/A/M/C) con iconos Lucide
- FlatList de MenuItems expandibles con Reanimated
- MenuItem: nombre + chevron rotado 90deg al expandir
- Expandido: subcomidas con ingredientes, bullet, boton "Agregar"
- Skeleton (6 items)

```
+------------------------------+
| < [person] Juan Perez        |
|    Hab. 301 - Cama A         |
|    heart.fill Hiposodica     |
|                              |
| [sunrise D] [sun A] [moon C] |
|                              |
| +----------------------------+|
| | Pollo al horno        >   ||
| | ---                        ||
| | * Pechuga de pollo        ||
| |   Ingredientes: pollo, sal||
| | * Pure de papas            ||
| | [ + Agregar ]              ||
| +----------------------------+|
+------------------------------+
```

### Carrito (stub)

- FloatingTabBar con badge de cantidad
- Lista de items agrupados por paciente
- Badge Hoy / Manana

### Historial (stub)

- FlatList de pedidos enviados
- Filtro por paciente

---

## Glassmorphism

Elementos que usan el efecto glass:

| Componente | iOS | Web |
|---|---|---|
| FloatingTabBar | `BlurView intensity={80}` | `backdropFilter: blur(20px)` + `background: rgba(255,255,255,0.75)` |
| BottomSheet | `BlurView intensity={80}` | `backdropFilter: blur(20px)` + `background: rgba(255,255,255,0.85)` |

En dark mode: `rgba(26,26,26,0.75)` para tab bar, `rgba(26,26,26,0.85)` para sheet.

---

## Routing Architecture

```
app/
  _layout.tsx              Root Stack + QueryClientProvider + Zustand persist
  +not-found.tsx           404
  +html.tsx                Shell HTML (web)
  login.tsx                pantalla publica
  (app)/
    _layout.tsx            Stack con auth guard
    (tabs)/
      _layout.tsx          Tabs con FloatingTabBar (glass)
      index.tsx            EstacionesScreen
      cart.tsx             CartScreen (stub)
      history.tsx          HistoryScreen (stub)
  (app)/paciente/
    [stationId].tsx        PatientListScreen
    [stationId]/
      [patientId].tsx      PatientMenuScreen
```

---

## Component Architecture

### Atoms (`src/shared/atoms/`)

- **Button** -- 4 variants, icon prop, spring scale + haptics
- **Input** -- animated focus border (interpolateColor), leftIcon Lucide, label + error
- **Checkbox** -- PressableScale + icon checkmark
- **Chip** -- 36px minHeight, icon + label, haptic
- **Skeleton** -- shimmer animado
- **Spinner** -- fullScreen variant
- **Icon** -- Lucide unificado cross-platform
- **PressableScale** -- spring scale wrapper

### Molecules (`src/shared/molecules/`)

- **EmptyState** -- icon + title + message
- **ErrorState** -- icon + message + retry button
- **FloatingTabBar** -- glassmorphism con BlurView, 3 tabs

### Organisms (`src/shared/organisms/`)

- **Screen** -- SafeArea-aware wrapper
- **ScreenLoading** -- skeleton placeholder
- **ScreenError** -- error + retry
- **BottomSheet** -- glassmorphism + Gesture Handler pan-to-dismiss
- **PatientMenuHeader** -- header + Skeleton variant
- **ToastProvider** + **useToast** -- slide-up, 3s auto-dismiss

---

## Data Flow & State

| Capa | Tecnologia | Proposito |
|---|---|---|
| **Server state** | @tanstack/react-query v5 | Pacientes, dietas, menus, estaciones |
| **Client state** | Zustand v5 | Auth (user, token), estacion seleccionada |
| **Persistencia** | Zustand persist + AsyncStorage | Sesion (condicional a rememberMe) |
| **API calls** | `src/shared/services/api.ts` | request con auto-inyeccion de token |
| **Validation** | react-hook-form + zod | Login |

---

## Core Entities

Definiciones en `src/shared/types/index.ts`:

- **User:** id, nombre, estaciones
- **Station:** id, nombre
- **Patient:** id, nombre, stationId, habitacion, cama, dietaId, alergias[], notas
- **Dieta:** id, nombre, tiempos[], simbolo
- **Comida:** id, dietaId, nombre, tiempo, subcomidas[]
- **Subcomida:** id, nombre, descripcion, ingredientes[]
- **Ingrediente:** id, nombre, descripcion
- **CartItem:** id, comidaId, comidaNombre, pacienteId, pacienteNombre, flagHoy, nota
- **Order:** id, items[], pacienteId, timestamp, status

---

## NFRs Implementation

| ID | Nombre | Implementacion |
|---|---|---|
| NFR-01 | Conectividad | React Query retry + ErrorState con onRetry |
| NFR-02 | Rendimiento | FlatList + Query cache (staleTime) + lazy expansion |
| NFR-03 | UX | Touch targets >= 44px, haptics, Reanimated, skeleton loading, pull-to-refresh |
| NFR-04 | Seguridad | Zustand persist + AsyncStorage. Prod: encrypted storage |
| NFR-05 | Persistencia | Zustand persist (auth condicional, carrito pendiente) |
| NFR-06 | Responsive | react-native-responsive-screen, grid adaptativo |
| NFR-07 | Arquitectura | Features por dominio, TypeScript estricto |
| NFR-08 | Plataforma | iOS + Android + Web. Glassmorphism via BlurView nativo / backdropFilter web |

---

## Dependencias principales

- Expo SDK 56, expo-router
- React Native 0.85, React 19
- Reanimated 4, Gesture Handler
- Zustand 5 + @tanstack/react-query v5
- lucide-react-native + react-native-svg
- expo-blur (glassmorphism)
- react-hook-form + zod
- expo-haptics, expo-font
- react-native-safe-area-context
- json-server (mock API local)
- @react-native-async-storage/async-storage

## Paths

- `@/*` -> `./*` (raiz)
- Iconos: `src/shared/atoms/Icon.tsx`
- Colores: `constants/Colors.ts`
- Tokens: `src/shared/utils/tokens.ts`
- API: `src/shared/services/api.ts`
- DB mock: `docs/db.json`

## Commands

| Comando | Accion |
|---|---|
| `npm start` | Dev server |
| `npm run web` | Web dev server |
| `npm run android` | Android |
| `npm run ios` | iOS |
| `npx json-server docs/db.json --port 3001` | Mock API |
| `npm test` | Vitest |
| `npx tsc --noEmit` | TypeScript check |
