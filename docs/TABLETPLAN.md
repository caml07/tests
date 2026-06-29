## **Plan Detallado: Implementación de Vistas para iPad (Revisión Final)**

Este plan se enfoca en adaptar la aplicación para una experiencia óptima y estable en iPad y Tablets Android, utilizando una combinación de Sidebar para navegación principal, SplitView (Master-Detail) para vistas complejas, y diseño adaptativo. Ahora, **con un enfoque 100% estable, cross-platform y basado en las mejores prácticas de Flexbox y `expo-router`**.

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
        *   **Modo expandido** (≥1024px, iPad Pro landscape): 260px de ancho, glassmorphism (BlurView), borde derecho sutil. Muestra icono + label de texto.
        *   **Modo colapsado / Navigation Rail** (744–1024px, iPad Mini portrait, iPad Pro portrait): ~72px de ancho, solo iconos centrados. Inspirado en Twitter/X y YouTube.
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
    *   **Acción:** Modificar este archivo para ser el punto de entrada condicional **universal**:
        *   Usar el hook `useResponsive` para detectar `isTablet`.
        *   Si `isTablet`, renderizar `TabletHomeShell` (que usará el `Sidebar` y un `<Slot />` para las subrutas).
        *   Si no (`isPhone`), renderizar el `<Stack>` actual (para la navegación de teléfono).

2.  **Adaptación del Navegador de Tabs (`(tabs)/_layout.tsx`):**
    *   **Archivo:** `app/(app)/(tabs)/_layout.tsx`
    *   **Acción:** **CORRECCIÓN CRÍTICA — No reemplazar `<Tabs>` por `<Slot />`.**
        *   Mantener el `<Tabs>` intacto para preservar el estado de las pantallas (scroll, datos, suscripciones) al cambiar de pestaña.
        *   Condicionar la visibilidad de `FloatingTabBar` con `tabBarStyle: { display: isTablet ? 'none' : undefined }`.
        *   Así el sidebar en tablet maneja la navegación, pero las pantallas dentro de `(tabs)` mantienen su estado montado.
        *   El `<Tabs>` solo tendrá las rutas `index` (estaciones) e `history` (historial).

3.  **Zustand Store para Estado del Paciente Seleccionado:**
    *   **Archivo:** `src/features/patients/store/patientUIStore.ts`
    *   **Acción:** **CORRECCIÓN CRÍTICA — Estado compartido entre Master y Detail Column.**
        *   Crear un mini-store con Zustand que exponga `selectedPatientId` y `setSelectedPatientId`.
        *   Esto evita depender de la URL o de props para saber qué paciente está activo en el SplitView.
        *   La `PatientList` (Master Column) llama a `setSelectedPatientId` al seleccionar.
        *   La `Detail Column` lee `selectedPatientId` para saber qué mostrar.
        ```typescript
        import { create } from 'zustand';

        interface PatientUIState {
          selectedPatientId: string | null;
          setSelectedPatientId: (id: string | null) => void;
        }

        export const usePatientUIStore = create<PatientUIState>((set) => ({
          selectedPatientId: null,
          setSelectedPatientId: (id) => set({ selectedPatientId: id }),
        }));
        ```

4.  **Adaptación de la Ruta `paciente` (`app/(app)/paciente/_layout.tsx`):**
    *   **Archivo:** `app/(app)/paciente/_layout.tsx`
    *   **Acción:** Crear este archivo para el SplitView *específico* de pacientes:
        ```tsx
        import { Slot, Stack, useLocalSearchParams } from 'expo-router';
        import { View } from 'react-native';
        import { useResponsive } from '@/src/shared/hooks/useResponsive';
        import { PatientList } from '@/features/patients/components/PatientList';

        export default function PatientLayout() {
          const { isTablet } = useResponsive();
          const { stationId } = useLocalSearchParams();

          if (isTablet) {
            return (
              <View style={{ flex: 1, flexDirection: 'row' }}>
                {/* Master Column: renderizado explícito */}
                <View style={{ width: 320, borderRightWidth: 1, borderColor: 'lightgray' }}>
                   <PatientList stationId={stationId as string} />
                </View>

                {/* Detail Column: Slot con animación de entrada */}
                <View style={{ flex: 1 }}>
                  <Slot />
                </View>
              </View>
            );
          }

          return <Stack />;
        }
        ```

5.  **Adaptación de `app/(app)/paciente/[stationId].tsx`:**
    *   **Archivo:** `app/(app)/paciente/[stationId].tsx`
    *   **Acción:** En tablet, esta pantalla se convierte en el placeholder de la Detail Column:
        ```tsx
        export default function StationScreen() {
          const { isTablet } = useResponsive();
          const { stationId } = useLocalSearchParams();

          if (isTablet) {
             return <EmptyState message="Seleccione un paciente de la lista" icon="users" />;
          }

          return <PatientList stationId={stationId as string} />;
        }
        ```

6.  **Transiciones Animadas en Detail Column:**
    *   **Archivo:** `app/(app)/paciente/_layout.tsx`
    *   **Acción:** **CORRECCIÓN CRÍTICA — El `<Slot />` cambia en seco.**
        *   Envolver el `<Slot />` en un `Animated.View` con `entering={FadeIn.duration(200).delay(100)}` y `exiting={FadeOut.duration(150)}` de Reanimated.
        *   Esto da una transición suave al seleccionar diferentes pacientes en la Master Column.

7.  **Adaptación de Pantallas Individuales:**
    *   **Estaciones (`index.tsx`):**
        *   Se renderiza dentro del `<Tabs>` pero con la tab bar oculta en tablet. Al seleccionar una estación se navega a `/paciente/[stationId]` que activa el SplitView de pacientes.
    *   **Menú del Paciente (`paciente/[stationId]/[patientId].tsx`):**
        *   Ocupa la **Detail Column** del SplitView de pacientes. Sheets (cart, history) siguen funcionando igual.
    *   **Historial (`history.tsx`):**
        *   Se renderiza dentro del `<Tabs>`. Si se desea SplitView para historial, se necesitará un layout anidado similar a `app/(app)/paciente/_layout.tsx`.

8.  **Componente `Screen.tsx` Adaptativo:**
    *   **Archivo:** `src/shared/organisms/Screen.tsx`
    *   **Acción:** Añadir lógica para ajustar `paddingHorizontal` y estilos basado en `isTablet` y `isLandscape`.

9.  **Componentes de Tarjeta Adaptativos:**
    *   **Archivos:** `StationCard.tsx`, `PatientCard.tsx`
    *   **Acción:** Modificar estilos para que en tablet las tarjetas se muestren en grid con más columnas o sean más grandes.

### **Fase 6: Pulido y Verificación**

1.  **Transiciones:** Dentro del SplitView la experiencia es de actualización de paneles. Las transiciones del `<Slot />` en la Detail Column se manejan con Reanimated (`FadeIn`/`FadeOut`). Entre rutas principales (sidebar -> tabs) las transiciones son instantáneas por diseño.
2.  **Manejo de Teclado:** Asegurar que el teclado en pantalla no interfiera con la interfaz en tablet.
3.  **Testing:**
    *   Probar exhaustivamente en simuladores de iPad y tablets Android (varios tamaños y orientaciones).
    *   Verificar el funcionamiento en dispositivos físicos (especialmente tablets chinas con `deviceType` incorrecto).
    *   Ejecutar `npx tsc --noEmit` para verificar la tipografía.
    *   Ejecutar linters/formatters del proyecto (si aplican).
