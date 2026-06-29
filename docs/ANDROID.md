# Android — Guía de fixes y configuración (Samsung Galaxy A54)

Status: ✅ Fixes en `fix/android-ui` branch

## Conexión a API en físico

```powershell
# 1. Arrancar API local
npx json-server docs/db.json --port 3001

# 2. Tunnel ADB (cada vez que se reconecta cable)
adb reverse tcp:3001 tcp:3001

# 3. Build + dev server con URL correcta
$env:EXPO_PUBLIC_API_URL="http://127.0.0.1:3001"; npm run android
```

**Importante:** `EXPO_PUBLIC_API_URL` se lee via `process.env` en `src/shared/utils/config.ts`. En Android físico, `127.0.0.1` funciona gracias a ADB reverse. No se usa `10.0.2.2` (emulador).

**Nota:** Hay DOS archivos de config (`utils/config.ts` y `config/api.ts`). El que realmente usa `api.ts` para las requests es `utils/config.ts` (importado en línea 3). `config/api.ts` es código muerto — considerar eliminar.

**Si el login falla, verificá:**
```bash
curl http://127.0.0.1:3001/nurses              # API responde?
adb reverse --list                               # Tunnel activo?
npx expo logs:android | grep "[API]"            # Qué URL usa la app?
```

## Fixes aplicados

### 1. `app.json` — keyboard + StatusBar  ✅

```json
"softwareKeyboardLayoutMode": "resize",
"androidStatusBar": {
  "barStyle": "dark-content",
  "backgroundColor": "#00000000",
  "translucent": true
}
```

### 2. `Screen.tsx` — StatusBar translucent  ✅

`backgroundColor: 'transparent'`, `translucent: true` en Android, para que dibuje bajo la barra.

### 3. `LoginScreen.tsx` — layout corregido  ✅

| Antes | Después |
|-------|---------|
| `flexGrow: 1` (ScrollView se estira al viewport completo) | `justifyContent: 'center'` |
| `behavior={Platform.OS === 'ios' ? 'padding' : undefined}` | `behavior={Platform.OS === 'ios' ? 'padding' : 'height'}` |
| solo `paddingTop: insets.top + space[12]` | + `paddingBottom: insets.bottom + space[4]` |

### 4. `BottomSheet.tsx` — teclado + insets  ✅

- Envuelto en `KeyboardAvoidingView behavior="padding"`
- Agregado `useSafeAreaInsets`
- `paddingBottom: Math.max(insets.bottom, space[4])` en vez de fijo

### 5. `AddToCartSheet.tsx` / `ConfirmOrderSheet.tsx`  ✅

- `KeyboardAvoidingView` con `behavior="padding"` universal
- Gesture manual → `<Pressable>` (evita conflictos)
- `insets.bottom` en padding
- Removido `Platform` del import

### 6. `Input.tsx` — iconSlot + cleanup  ✅

| Antes | Después |
|-------|---------|
| `height: '100%'` en iconSlot (0 en Android sin padre con altura) | `paddingVertical: space[3]` |
| `marginTop: space[0]` (no-op) | removido |
| `minHeight: 52` | `minHeight: 44` (Material3 standard) |
| sin `backgroundColor: transparent` | agregado |

### 7. `Skeleton.tsx` — cancelAnimation  ✅

```ts
useEffect(() => {
  // ...
  return () => cancelAnimation(opacity.value) // cleanup
}, [])
```

### 8. `FloatingTabBar.tsx` — tokens + insets  ✅

- Colores hardcodeados → `colors.card` / `colors.surfaceAlt`
- Posicionamiento con `insets.bottom` + `space[6]`

### 9. Shadows — tokens.ts  ✅

Reemplazado `elevation` por:

```ts
android: { borderWidth: 0.5, borderColor: 'rgba(0,0,0,0.04)' }
```

### 10. BlurView / BlurWrapper — fallback Android  ✅

**Fase 1 (commit `7842903`):** `blurMethod="dimezisBlurViewSdk31Plus"` para SDK 56.

**Fase 2 (commit `ba4bc02`):** Se creó `BlurWrapper` (`src/shared/atoms/BlurWrapper.tsx`) que wrappea `BlurView` en iOS y en Android usa un `View` con `backgroundColor` semitransparente. Reemplazó el `BlurView` directo en 6 modales/componentes, eliminando el glitch visual que daba el blur nativo en algunos dispositivos Android.

### 11. FlatList optimizations  ✅

| Archivo | Cambio |
|---------|--------|
| `app/(app)/(tabs)/history.tsx` | `OrderCard` con `React.memo`, FlatList `windowSize={5}`, `maxToRenderPerBatch={10}` |
| `src/features/patients/components/MenuItem.tsx` | `React.memo` wrapper |
| `app/(app)/paciente/[stationId]/[patientId].tsx` | FlatList `windowSize={5}`, `maxToRenderPerBatch={10}`, `removeClippedSubviews`, loading/error con ScrollView en vez de FlatList+vacío |

### 12. API URL — conexión en físico  ✅

**Síntoma:** Login tiraba `Failed to fetch` en Samsung físico, aunque `curl http://127.0.0.1:3001/nurses` funcionaba desde la PC y `adb reverse --list` mostraba el tunnel activo.

**Causa raíz:** El API base se resolvía a `http://10.0.2.2:3001` en Android (IP de emulador), aunque el usuario usaba ADB reverse con `127.0.0.1`.

**Archivos:** `src/shared/utils/config.ts`, `src/shared/config/api.ts` (éste último no se usaba, pero estaba como duplicado con otra IP hardcodeada).

**Fix:**

| Antes | Después |
|-------|---------|
| `Constants.expoConfig?.extra?.apiUrl` (no captura `EXPO_PUBLIC_API_URL`) | `process.env.EXPO_PUBLIC_API_URL \|\| ...` |
| `android: devApiUrl.replace('localhost', '10.0.2.2')` | `android: devApiUrl` (sin reemplazo, `localhost` funciona con ADB reverse) |
| `LAN_IP = "10.84.32.35"` hardcodeada en `config/api.ts` | usa `process.env.EXPO_PUBLIC_API_URL` igual que `utils/config.ts` |

**Para debuggear:** se agregó `console.log('[API] BASE_URL:', API_BASE)` en `src/shared/services/api.ts` — visible con `npx expo logs:android`.

**Flujo correcto:**
1. `$env:EXPO_PUBLIC_API_URL="http://127.0.0.1:3001"` en PowerShell
2. Metro bundler inlinea `process.env.EXPO_PUBLIC_API_URL` → `"http://127.0.0.1:3001"`
3. ADB reverse mapea device:3001 → host:3001
4. App hace fetch a `http://127.0.0.1:3001/nurses` → OK

### 13. Infinite loop en PatientCartSheet  ✅

**Síntoma:** `"The result of getSnapshot should be cached to avoid an infinite loop"` al abrir el carrito de un paciente.

**Causa raíz:** Selector de Zustand con `.filter()` crea un nuevo array en cada render, causando re-render en cascada.

**Fix:**
| Antes | Después |
|-------|---------|
| `useCartStore((s) => s.items.filter(...))` | `useCartStore((s) => s.items)` + `useMemo(() => items.filter(...), [items, pacienteId])` |
| `cartCount` con filter directo en store | `allItems` extraído + `.length` derivado |

**Archivos:** `PatientCartSheet.tsx`, `[patientId].tsx`

### 14. Lora Italic "Dietas" recortada  ✅

**Síntoma:** En Android, el texto "Dietas" aparece cortado en la parte inferior (bounding box issue de la fuente variable).

**Causa:** Lora-Italic variable font tiene un bounding box que no coincide con el `fontSize` de 34 en Android.

**Fix:** `lineHeight: 44` + `paddingBottom: 4` en el estilo `appName` de LoginScreen.

**Archivo:** `LoginScreen.tsx`

### 15. Safe Areas — contenido bajo StatusBar  ✅

**Síntoma:** En Android con StatusBar translúcida, el contenido de todas las pantallas aparecía detrás de la barra de estado porque ninguna usaba `edges={['top']}`.

**Causa:** El stack layout tiene `headerShown: false`, y las screens en `app/(app)/` usaban `edges={['bottom']}` exclusive, omitiendo el padding del notch/status bar.

**Fix:**

| Pantalla | Antes | Después |
|----------|-------|---------|
| `(tabs)/index.tsx` | `edges={['bottom']}` | `edges={['top']}` (bottom lo maneja TabBar) |
| `(tabs)/history.tsx` | `edges={['bottom']}` | `edges={['top']}` |
| `[stationId].tsx` | `edges={['bottom']}` | `edges={['top', 'bottom']}` |
| `[patientId].tsx` (3 instances) | `edges={['bottom']}` | sin `edges` (default top+bottom) |

**Archivo:** `Screen.tsx` tiene default `edges = ['top', 'bottom']` — el fix fue corregir el uso en cada pantalla.

## Pendiente

- **Variable fonts `[wght]` en Samsung**: No se ha reportado problema, pero si ocurre, generar TTF estáticos de PlusJakartaSans y Lora-Italic.
- **Tablet adaptation**: `supportsTablet: true` en app.json pero ningún layout responde a `useWindowDimensions`.
- **LoginScreen no usa `<Screen>`**: LoginScreen tiene su propio KAV + ScrollView; cubre insets manualmente pero no usa el componente `<Screen>`. Si se agregan más fixes de StatusBar, considerar migrar.
- **`cart.tsx` inactivo**: archivo `app/(app)/(tabs)/cart.tsx` existe pero no se declara en `_layout.tsx` (el carrito es por paciente, no global).
- **`config/api.ts` duplicado**: código muerto, no se importa en ningún lado.

## Build warnings (no urgentes)

```
CXX5304: build-tools duplicados → limpiar SDK
usesCleartextTraffic → correcto para dev
Deprecated Gradle features → no urgente
```
