## **Plan Detallado: Implementación de Vistas para iPad**

Este plan se enfoca en adaptar la aplicación para una experiencia óptima y estable en iPad y Tablets Android, utilizando una combinación de Sidebar con Navigation Rail para navegación principal, y diseño adaptativo en componentes. **Con un enfoque 100% estable, cross-platform y basado en las mejores prácticas de Flexbox y `expo-router`**.

## Decisiones de Arquitectura (ADRs)

Estas decisiones se tomaron durante la implementación y son vinculantes para fases futuras:

| # | Decisión | Razón |
|---|----------|-------|
| ADR-01 | `useResponsive` en `src/shared/hooks/` (no en features/) | Evita dependencia cruzada entre features (auth, stations, pacientes todos lo necesitan). Está en shared porque es device/infra, no lógica de negocio |
| ADR-02 | `BREAKPOINTS` en `src/shared/utils/` | Misma razón que ADR-01. Además `tokens.ts` (shared) ya lo importa |
| ADR-03 | `isTablet = width >= 744 \|\| deviceType === TABLET` | `expo-device` retorna `null` en emuladores Android y tablets chinas. El ancho es la fuente de verdad primaria |
| ADR-04 | `<Tabs>` se mantiene con `tabBar={isTablet ? () => null : ...}` en vez de `<Slot />` | `<Tabs>` mantiene las pantallas montadas en memoria. `<Slot />` las desmonta al cambiar de pestaña, perdiendo scroll y estado |
| ADR-05 | Sidebar con **ancho fijo** (260px / 80px), nunca `flex: 1` | `flex: 1` hace que el sidebar compita con el contenido por el espacio disponible, resultando en layouts impredecibles |
| ADR-06 | `<BlurWrapper>` de shared/atoms (no `<BlurView>` directo) | El proyecto ya abstrae BlurView para dar fallback semi-transparente en Android donde BlurView no funciona igual |

## Gotchas Técnicos (aprendidos en implementación)

| Gotcha | Contexto | Solución |
|--------|----------|----------|
| `@/*` resuelve a `./*` no a `./src/*` | TypeScript falla si importas `@/features/hooks/...` en vez de `@/src/features/hooks/...` | Siempre usar `@/src/...` para archivos dentro de `src/` |
| `tabBarStyle` no existe como prop en `<Tabs>` de Expo Router (TS error) | Intentar pasar `tabBarStyle` como prop directo da error de tipos | Pasarlo dentro de `screenOptions` o mejor: condicionar el `tabBar` prop directamente |
| `ScreenOrientation.addOrientationChangeListener` cambió en SDK 56 | El método `removeOrientationChangeListeners(subscription)` ya no existe | Usar `subscription.remove()` (el objeto retornado por `addOrientationChangeListener` tiene método `.remove()`) |
| `usePathname()` en expo-router no retorna `/` para tabs | Comparar `pathname === '/'` para detectar ruta activa nunca funciona | Usar `pathname.startsWith('/(app)/(tabs)')` o comparar con la ruta exacta del tab |
| `BlurView` se comporta distinto en Android vs iOS | En Android el blur puede ser más lento o no funcionar con ciertos tint | Usar `<BlurWrapper>` de shared/atoms que da fallback automático |

## Feature-Sliced Design (FSD) — Reglas de este proyecto

```
src/
├── features/   ← feature modules (auth, stations, patients, cart)
│   └── <name>/
│       ├── components/
│       ├── hooks/
│       ├── screens/
│       ├── services/
│       └── store/
└── shared/     ← código reusable cross-feature
    ├── atoms/       (Button, Input, Icon, BlurWrapper)
    ├── hooks/       (useResponsive, useScreenOrientation, useToast)
    ├── molecules/   (EmptyState, ErrorState, FloatingTabBar, PatientCard)
    ├── organisms/   (Screen, ScreenLoading, ScreenError)
    ├── services/    (api, database, sync, mmkvStorage)
    ├── types/       (interfaces compartidas)
    └── utils/       (tokens, breakpoints, validation, config)
```

**Regla de hierro:** Un archivo en `features/a/` **no puede importar** de `features/b/`. Si dos features necesitan lo mismo, va a `shared/`.

**Validación:** Después de cada fase, grepear `src/features/` imports desde otra feature. Ejemplo:
```bash
rg "src/features/(auth|stations|patients|cart)/" src/features/ | grep -v "src/features/\w\+/\1/"
```

### **Fase 1: Infraestructura Responsiva y Detección**

1.  **Constantes de Breakpoints:**
    *   **Archivo:** `src/shared/utils/breakpoints.ts`
    *   **Acción:** Ya existe. Definir los breakpoints clave:
        ```typescript
        export const BREAKPOINTS = {
          tablet: 744, // Ancho mínimo para considerarse tablet
          desktop: 1024, // Ancho mínimo para sidebar expandido
        };
        ```

2.  **Hook de Responsividad (`useResponsive.ts`):**
    *   **Archivo:** `src/shared/hooks/useResponsive.ts`
    *   **Acción:** Modificar el hook existente con **detección híbrida y prioridad de ancho de pantalla**:
        *   `isTablet` se determina así:
            1. **Primario:** `screenWidth >= BREAKPOINTS.tablet` (matemática pura, infalible)
            2. **Secundario:** `Device.deviceType === Device.DeviceType.TABLET` (para metadata)
            3. **Resultado:** `isTablet = screenWidth >= BREAKPOINTS.tablet || deviceType === TABLET`
        *   Esto evita que tablets chinas o emuladores con `deviceType` erroneo rompan la UI.
        *   Exponer valores:
            *   `isTablet: boolean`
            *   `isLandscape: boolean` (true si `width > height`)
            *   `isPhone: boolean` (true si `!isTablet`)
            *   `screenWidth: number`, `screenHeight: number`
            *   `isDesktop: boolean` (true si `width >= BREAKPOINTS.desktop`)
            *   `isCollapsed: boolean` (true si tablet pero width < 1024)

3.  **Actualización de Tokens (`tokens.ts`):**
    *   **Archivo:** `src/shared/utils/tokens.ts`
    *   **Acción:** Ya exporta `BREAKPOINTS`. Verificar que esté accesible.

### **Fase 2: Gestión de Orientación y Bloqueo**

1.  **Configuración de `app.json`:**
    *   **Archivo:** `app.json`
    *   **Acción:** Modificar `"orientation": "portrait"` a `"orientation": "default"`. Esto permitirá que la aplicación cambie entre portrait y landscape en *todos* los dispositivos que lo soporten (iPads y tablets Android).

2.  **Lógica de Bloqueo de Orientación en `_layout.tsx` (raíz):**
    *   **Archivo:** `app/_layout.tsx`
    *   **Acción:** El hook `useScreenOrientation()` actual solo hace `unlockAsync()`, lo cual es correcto. No necesita cambios — simplemente no bloquear nunca.

3.  **Lógica de Bloqueo en `LoginScreen.tsx`:**
    *   **Archivo:** `src/features/auth/screens/LoginScreen.tsx`
    *   **Acción:** El `useEffect` que bloquea a `PORTRAIT` debe ejecutarse solo si `isPhone`. En tablet, no bloquear orientación (permitir landscape/portrait libre).

### **Fase 3: Sidebar de Navegación (Tablet) — Navigation Rail Colapsable**

1.  **Componente `Sidebar.tsx`:**
    *   **Archivo:** `src/features/layout/molecules/Sidebar.tsx`
    *   **Acción:** Crear un nuevo componente con **dos modos** según el ancho:
        *   **Modo expandido** (≥1024px, iPad Pro landscape): 260px de ancho, glassmorphism (`<BlurWrapper>`), borde derecho sutil. Muestra icono + label de texto.
        *   **Modo colapsado / Navigation Rail** (744–1024px, iPad Mini portrait, iPad Pro portrait): ~72px de ancho, solo iconos centrados. Inspirado en Twitter/X y YouTube.
        *   **Anclaje crítico:** El contenedor raíz debe tener **ancho fijo** (260 o 72 según modo), **nunca `flex: 1`**, para no competir con el contenido del `<Slot />`.
        *   **Glassmorphism:** Usar `<BlurWrapper>` de `@/src/shared/atoms/BlurWrapper` (no `<BlurView>` directo) — da fallback semi-transparente en Android.
        *   **Ruta activa:** No comparar con `pathname === '/'`. Usar `pathname.startsWith('/(app)/(tabs)')` o comparar con la ruta exacta del tab (`/(app)/(tabs)/history`, etc.).
        *   **Transición:** Animación con Reanimated `useAnimatedStyle` para el ancho y opacidad del texto.
        *   **Contenido:** Elementos de navegación (`Estación`, `Historial`) con `Icon` SF Symbols. Usar **`Link` de `expo-router`** para navegar.
        *   **Integración:** Se renderizará en el layout principal de tablet (`TabletHomeShell.tsx`).

### **Fase 4: Contenedor SplitView con Flexbox y `<Slot />`**

1.  **Componente `TabletHomeShell.tsx` (Root Layout para Tablets):**
    *   **Archivo:** `src/features/layout/screens/TabletHomeShell.tsx`
    *   **Acción:** Crear este archivo. Será el layout principal para tablets (iPad y Android):
        *   Contendrá una `View` con `flexDirection: 'row'` y `flex: 1`.
        *   A la izquierda, renderizará el `Sidebar` (ancho según modo: 260px expandido, 72px colapsado).
        *   A la derecha, renderizará un `<Slot />` que inyecta el contenido de las rutas hijas.
        *   **Importante:** El `<Slot />` es correcto aquí porque actúa como contenedor del `(tabs)` layout completo, que a su vez mantiene su propio `<Tabs>` internamente para preservar el estado de las pestañas.

### **Fase 5: Integración y Modificación de Rutas**

1.  **Bifurcación de Layout en `(app)/_layout.tsx`:**
    *   **Archivo:** `app/(app)/_layout.tsx`
    *   **Acción:** Modificar para ser el punto de entrada condicional **universal**:
        *   Usar `useResponsive` para detectar `isTablet`.
        *   Si `isTablet`, renderizar `TabletHomeShell` con `<Slot />`.
        *   Si no (`isPhone`), renderizar el `<Stack>` actual.

2.  **Adaptación del Navegador de Tabs (`(tabs)/_layout.tsx`):**
    *   **Archivo:** `app/(app)/(tabs)/_layout.tsx`
    *   **Acción:** Mantener `<Tabs>` intacto para preservar estado.
        *   Ocultar `FloatingTabBar` en tablet con `tabBar={isTablet ? () => null : ...}`.
        *   El sidebar maneja la navegación en tablet, pero las pantallas dentro de `(tabs)` siguen montadas.

3.  **Componente `Screen.tsx` Adaptativo:**
    *   **Archivo:** `src/shared/organisms/Screen.tsx`
    *   **Acción:** Añadir `paddingHorizontal` responsive usando `useResponsive`:
        *   Phone (< 744px): `0` (cada screen maneja su padding, como ahora)
        *   Tablet colapsado (744-1024px): `Spacing.screen` (40)
        *   Tablet/Desktop expandido (≥ 1024px): `Spacing.xl` (48) o `Spacing.xxl` (64)
        *   Estrategia: aplicar el padding como estilo condicional basado en `isTablet`, sin romper el `style` prop que cada screen ya pasa.

4.  **Grid de Estaciones (`index.tsx`) — Adaptativo:**
    *   **Archivo:** `app/(app)/(tabs)/index.tsx`
    *   **Acción:** El grid de `StationCard` usa `flexWrap: 'wrap'` con porcentaje por columna.
        *   Phone (< 744px): `width: '47%'` → 2 columnas (actual, sin cambios)
        *   Tablet (744-1024px): `width: '47%'` → 2 columnas más grandes (más espacio disponible)
        *   Desktop (≥ 1024px): `width: '30%'` → 3 columnas
        *   El porcentaje se define condicionalmente en el estilo del wrapper o en la card.

5.  **Lista de Pacientes (`[stationId].tsx`) — Adaptativo:**
    *   **Archivo:** `app/(app)/paciente/[stationId].tsx`
    *   **Acción:** El `FlatList` actual usa single column.
        *   Phone (< 744px): `numColumns={1}` (actual, sin cambios)
        *   Tablet (≥ 744px): `numColumns={2}` con `columnWrapperStyle={{ gap: Spacing.md }}`
        *   Nota: `numColumns` requiere que el keyExtractor e ItemSeparator sean compatibles.

6.  **Navegación en Tablet (sin SplitView):**
    *   La experiencia tablet es de navegación secuencial, igual que en phone:
        *   Estaciones → tap → lista de pacientes (ocupa el content completo)
        *   Paciente → tap → menú del paciente (ocupa el content completo)
        *   El `<Slot />` en `TabletHomeShell` se encarga de renderizar cada ruta
        *   Sin cambios en las rutas `paciente/[stationId]` ni `[stationId]/[patientId]`
        *   Sheets (cart, history) funcionan igual que en phone

### **Fase 6: Pulido y Verificación**

1.  **Navegación:** Sin SplitView, la navegación es secuencial (sidebar → content). Las transiciones entre rutas son las nativas de expo-router. Dentro de `(tabs)`, el `<Tabs>` mantiene el estado montado.
2.  **Manejo de Teclado:** Asegurar que el teclado en pantalla no interfiera con la interfaz en tablet.
3.  **FSD Audit:** Después de cada fase, verificar que no hay imports entre features:
    ```bash
    rg "src/features/(auth|stations|patients|cart)/" src/features/ | grep -v "src/features/\w\+/\1/"
    ```
    Si el comando produce output, hay una violación FSD. Mover el código compartido a `src/shared/`.

4.  **TypeScript:** Ejecutar `npx tsc --noEmit` y resolver **todos** los errores del proyecto (ignorar `_scratch/` y `tmp/`).

5.  **Testing:**
    *   Probar exhaustivamente en simuladores de iPad y tablets Android (varios tamaños y orientaciones).
    *   Verificar el funcionamiento en dispositivos físicos (especialmente tablets chinas con `deviceType` incorrecto).
