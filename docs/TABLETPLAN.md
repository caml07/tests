## **Plan Detallado: Implementación de Vistas para iPad (Revisión Final)**

Este plan se enfoca en adaptar la aplicación para una experiencia óptima y estable en iPad y Tablets Android, utilizando una combinación de Sidebar para navegación principal, SplitView (Master-Detail) para vistas complejas, y diseño adaptativo. Ahora, **con un enfoque 100% estable, cross-platform y basado en las mejores prácticas de Flexbox y `expo-router`**.

### **Fase 1: Infraestructura Responsiva y Detección**

1.  **Constantes de Breakpoints:**
    *   **Archivo:** `src/features/layout/constants/breakpoints.ts`
    *   **Acción:** Crear este archivo y definir los breakpoints clave:
        ```typescript
        export const BREAKPOINTS = {
          tablet: 744, // Ancho mínimo para considerarse tablet (para orientación horizontal en phones, etc.)
          desktop: 1024, // Ancho mínimo para considerar pantallas más grandes
        };
        ```

2.  **Hook de Responsividad (`useResponsive.ts`):**
    *   **Archivo:** `src/features/layout/hooks/useResponsive.ts`
    *   **Acción:** Crear este archivo y definir un hook personalizado y **verdaderamente universal**:
        *   Importar `* as Device from 'expo-device'`.
        *   Utilizar `useWindowDimensions` para obtener `width` y `height`.
        *   Determinar `isTablet` mediante `Device.deviceType === Device.DeviceType.TABLET` (esto funciona para iOS y Android).
        *   Exponer valores como:
            *   `isTablet: boolean` (determinada por `expo-device`)
            *   `isLandscape: boolean` (true si `width > height`)
            *   `isPhone: boolean` (true si `!isTablet`)
            *   `screenWidth: number`, `screenHeight: number`
            *   `orientationLockActive: boolean` (detecta si el `app.json` está forzando portrait, y si `isTablet` debería anularlo).

3.  **Actualización de Tokens (`tokens.ts`):**
    *   **Archivo:** `src/shared/utils/tokens.ts`
    *   **Acción:** Exportar `BREAKPOINTS` para que otros módulos puedan acceder a ellos.

### **Fase 2: Gestión de Orientación y Bloqueo**

1.  **Configuración de `app.json`:**
    *   **Archivo:** `app.json`
    *   **Acción:** Modificar `"orientation": "portrait"` a `"orientation": "default"`. Esto permitirá que la aplicación cambie entre portrait y landscape en *todos* los dispositivos que lo soporten (iPads y tablets Android).

2.  **Lógica de Bloqueo de Orientación en `_layout.tsx` (raíz):**
    *   **Archivo:** `app/_layout.tsx`
    *   **Acción:** Modificar el `useEffect` que llama a `ScreenOrientation.lockAsync()`:
        *   Condicionar el bloqueo a `isPhone` (obtenido del nuevo hook `useResponsive`). En tablets (iOS y Android), no se debe bloquear la orientación.

3.  **Lógica de Bloqueo en `LoginScreen.tsx`:**
    *   **Archivo:** `src/features/auth/screens/LoginScreen.tsx`
    *   **Acción:** Similar al punto anterior, el `useEffect` que bloquea a `PORTRAIT` debe ejecutarse solo si `isPhone`.

### **Fase 3: Sidebar de Navegación (Tablet)**

1.  **Componente `Sidebar.tsx`:**
    *   **Archivo:** `src/features/layout/molecules/Sidebar.tsx`
    *   **Acción:** Crear un nuevo componente para la barra lateral de navegación principal:
        *   **Estilo:** Ancho fijo (~260px), glassmorphism (usando `BlurView`), borde derecho sutil.
        *   **Contenido:** Elementos de navegación (`Estación`, `Historial`) con `Icon` SF Symbols y labels. Utilizar **`Link` de `expo-router`** para navegar.
        *   **Animaciones:** `react-native-reanimated` para el indicador de selección.
        *   **Integración:** Se renderizará en el layout principal de tablet (`TabletHomeShell.tsx`).

### **Fase 4: Contenedor SplitView con Flexbox y `<Slot />`**

1.  **Componente `TabletHomeShell.tsx` (Root Layout para Tablets):**
    *   **Archivo:** `src/features/layout/screens/TabletHomeShell.tsx`
    *   **Acción:** Crear este archivo. Será el layout principal para tablets (iPad y Android):
        *   Contendrá una `View` con `flexDirection: 'row'`.
        *   A la izquierda, renderizará el `Sidebar` (ancho fijo, ej: `260px`).
        *   A la derecha, renderizará un **único** `<Slot />` que inyectará el contenido de las rutas hijas (ej: `(tabs)` o `paciente`).

### **Fase 5: Integración y Modificación de Rutas (usando Flexbox y `<Slot />`)**

1.  **Bifurcación de Layout en `(app)/_layout.tsx`:**
    *   **Archivo:** `app/(app)/_layout.tsx`
    *   **Acción:** Modificar este archivo para ser el punto de entrada condicional **universal**:
        *   Usar el hook `useResponsive` para detectar `isTablet`.
        *   Si `isTablet`, renderizar `TabletHomeShell` (que usará el `Sidebar` y un `Slot` para las subrutas).
        *   Si no (`isPhone`), renderizar el `<Stack>` actual (para la navegación de teléfono).

2.  **Adaptación del Navegador de Tabs (`(tabs)/_layout.tsx`):**
    *   **Archivo:** `app/(app)/(tabs)/_layout.tsx`
    *   **Acción:** Este layout no renderizará `FloatingTabBar` cuando `isTablet`. En su lugar, simplemente renderizará un **único** `<Slot />` para sus pantallas hijas (`index`, `history`), ya que el `Sidebar` global de `TabletHomeShell` se encargará de la navegación principal entre ellas.

3.  **Adaptación de la Ruta `paciente` (`app/(app)/paciente/_layout.tsx`):**
    *   **Archivo:** `app/(app)/paciente/_layout.tsx`
    *   **Acción:** Crear este archivo (si no existe) y estructurarlo para crear el SplitView *específico* para la sección de pacientes:
        ```tsx
        import { Slot, Stack, useLocalSearchParams } from 'expo-router';
        import { View } from 'react-native';
        import { useResponsive } from '@/features/layout/hooks/useResponsive';
        import { PatientList } from '@/features/patients/components/PatientList'; // Asumiendo que PatientList es un componente visual puro

        export default function PatientLayout() {
          const { isTablet } = useResponsive();
          const { stationId } = useLocalSearchParams();

          if (isTablet) {
            return (
              <View style={{ flex: 1, flexDirection: 'row' }}>
                {/* Master Column: Renderizado explícito, NO ES UN SLOT */}
                <View style={{ width: 320, borderRightWidth: 1, borderColor: 'lightgray' }}>
                   <PatientList stationId={stationId as string} />
                </View>

                {/* Detail Column: Expo Router inyecta la sub-ruta activa AQUÍ (ej: [patientId].tsx) */}
                <View style={{ flex: 1 }}>
                  <Slot />
                </View>
              </View>
            );
          }

          // Comportamiento de teléfono
          return <Stack />;
        }
        ```

4.  **Adaptación de la pantalla padre de la Master Column (`app/(app)/paciente/[stationId].tsx`):**
    *   **Archivo:** `app/(app)/paciente/[stationId].tsx`
    *   **Acción:** Modificar esta pantalla para que, en tablet, sirva como placeholder en la Detail Column si no hay paciente seleccionado, evitando duplicidad:
        ```tsx
        import { useResponsive } from '@/features/layout/hooks/useResponsive';
        import { useLocalSearchParams } from 'expo-router'; // Necesario para obtener stationId
        import { PatientList } from '@/features/patients/components/PatientList';
        import { EmptyState } from '@/src/shared/molecules/EmptyState'; // Asegurar la importación correcta

        export default function StationScreen() {
          const { isTablet } = useResponsive();
          const { stationId } = useLocalSearchParams(); // Obtener stationId para el PatientList

          // En Tablet, la lista ya está a la izquierda (Master Column).
          // El Slot de la derecha (Detail Column) mostrará un placeholder si no hay paciente seleccionado.
          if (isTablet) {
             return <EmptyState message="Seleccione un paciente de la lista" icon="users" />;
          }

          // En Teléfono, la pantalla funciona normal y muestra la lista completa
          return <PatientList stationId={stationId as string} />;
        }
        ```

5.  **Adaptación de Pantallas Individuales (continuación):**
    *   **Estaciones (`index.tsx`):**
        *   Se convertirá en una pantalla regular cuando se muestre a través del `TabletHomeShell`, ocupando el `<Slot />` principal. Al seleccionar una estación se navegará a `/paciente/[stationId]` que activará el SplitView de pacientes.
    *   **Menú del Paciente (`paciente/[stationId]/[patientId].tsx`):**
        *   Este componente ocupará la **Detail Column** del `SplitView` de pacientes.
        *   Las sheets (cart, history) seguirán funcionando igual.
    *   **Historial (`history.tsx`):**
        *   Se renderizará en el `<Slot />` principal del `TabletHomeShell`. Si se desea un SplitView Master/Detail para el historial, se necesitará un layout anidado similar a `app/(app)/paciente/_layout.tsx` dentro de `app/(app)/(tabs)/history/_layout.tsx`.

6.  **Componente `Screen.tsx` Adaptativo:**
    *   **Archivo:** `src/shared/organisms/Screen.tsx`
    *   **Acción:** Añadir lógica para ajustar `paddingHorizontal` y otros estilos basado en `isTablet` y `isLandscape`.

7.  **Componentes de Tarjeta Adaptativos:**
    *   **Archivos:** `StationCard.tsx`, `PatientCard.tsx`
    *   **Acción:** Modificar los estilos del contenedor (`wrapper` o similar) para que, en tablet, las tarjetas se muestren en un grid con más columnas o sean más grandes.

### **Fase 6: Pulido y Verificación**

1.  **Transiciones:** Las transiciones de `expo-router` seguirán funcionando, pero dentro del `SplitView` la experiencia será de actualización de paneles, no de push/pop.
2.  **Manejo de Teclado:** Asegurar que el teclado en pantalla no interfiera con la interfaz en tablet.
3.  **Testing:**
    *   Probar exhaustivamente en simuladores de iPad y tablets Android (varios tamaños y orientaciones).
    *   Verificar el funcionamiento en dispositivos físicos.
    *   Ejecutar `npx tsc --noEmit` para verificar la tipografía.
    *   Ejecutar linters/formatters del proyecto (si aplican).
