# Arquitectura

## Estructura de carpetas

```
Dietas/
├── app/                        # expo-router (file-based routing)
│   ├── _layout.tsx             # Root: splash → hydrate → Stack (login | app)
│   ├── login.tsx               # Ruta pública, redirect si autenticado
│   ├── (app)/                  # Grupo protegido (requiere auth)
│   │   ├── _layout.tsx         # Tabs: Pacientes, Carrito, Historial
│   │   ├── index.tsx           # Pacientes (placeholder)
│   │   ├── cart.tsx            # Carrito (placeholder)
│   │   └── history.tsx         # Historial (placeholder)
│   ├── +not-found.tsx          # 404
│   └── +html.tsx               # Web shell
│
├── src/
│   ├── components/
│   │   ├── atoms/              # Button, Input, Spinner, Checkbox
│   │   ├── molecules/          # (pendiente)
│   │   └── organisms/          # SplashScreen
│   ├── screens/
│   │   └── auth/
│   │       └── LoginScreen.tsx # Formulario login + Recordarme
│   ├── hooks/
│   │   └── useAuth.ts          # Hook que expone authStore
│   ├── services/
│   │   ├── api.ts              # Mock API: login, getEstaciones, etc.
│   │   └── storage.ts          # AsyncStorage wrapper
│   ├── store/
│   │   └── authStore.ts        # Zustand: login/logout/hydrate
│   ├── types/
│   │   └── index.ts            # Interfaces compartidas
│   └── utils/
│       ├── config.ts           # API_BASE con Platform.select
│       ├── validation.ts       # Zod schema para login
│       └── tokens.ts           # (pendiente) spacing, typo, shadows
│
├── constants/
│   └── Colors.ts               # Paleta azul healthcare + dark mode
│
├── tests/                      # Tests centralizados
│   ├── services/api.test.ts    # 7 tests
│   ├── store/authStore.test.ts # 7 tests
│   └── utils/validation.test.ts# 4 tests
│
└── docs/                       # Documentacion del proyecto
    ├── ARCHITECTURE.md
    ├── FR-NFR.md
    ├── DECISIONS.md
    ├── STYLING.md
    ├── COMPONENTS.md
    ├── SETUP.md
    ├── API.md
    ├── diagrama-flujo.puml
    └── db.json
```

## Capas (Clean Architecture)

```
PRESENTATION (UI)
app/ + src/screens/ + src/components/
  ● app/ = solo routing + auth guard (screens tontas)
  ● screens/ = pantallas completas (sin logica, solo hooks)
  ● components/ = UI reutilizable
        │ llama hooks
        ▼
DOMAIN / APPLICATION
src/hooks/
  ● Custom hooks con logica de negocio
  ● Orquestan services + stores
        │ usan services / stores
        ▼
DATA
src/services/ + src/store/
  ● services/api.ts = fetch contra json-server (mock)
  ● services/storage.ts = AsyncStorage (token/user persist)
  ● store/ = Zustand (estado global)
        │ tipos
        ▼
TYPES
src/types/index.ts
  ● Interfaces compartidas entre todas las capas
```

## Reglas

1. **Screens** son tontas: solo render + llaman hooks
2. **Hooks** tienen la logica de negocio
3. **Services** hablan con API/Storage (sin logica)
4. **Stores** (Zustand) manejan estado global
5. **Types** compartidos entre todas las capas
6. **Tests** en `tests/`, nunca co-locados con source

## Auth guard

No usamos conditional `Stack.Screen` (rompe expo-router). En su lugar:

```
app/login.tsx:
  if (isAuthenticated) return <Redirect href="/(app)" />

app/(app)/_layout.tsx:
  if (!isAuthenticated) return <Redirect href="/login" />
```

Ambos grupos siempre estan registrados en el Stack. Cada screen se protege sola.

## Splash screen

```
app/_layout.tsx
  ├── hydrate() en useEffect
  ├── Mientras !isHydrated: SplashScreen (logo HVP + azul)
  └── Cuando isHydrated: fade-out 400ms → Stack (login | app)
```

## Flujo de datos (ejemplo: login)

```
1. Nurse toca "Ingresar" en LoginScreen
2. LoginScreen llama useAuth().login({ usuario, password }, rememberMe)
3. useAuth llama authStore.login(credentials, rememberMe)
4. authStore llama api.login(credentials)
5. api.login hace fetch GET /nurses → filter local
6. Si match: authStore setea user + token + isAuthenticated
7. Si rememberMe: storage.saveAuth() a AsyncStorage
8. LoginScreen re-renderiza → isAuthenticated=true → Redirect
```
