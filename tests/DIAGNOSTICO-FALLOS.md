# Diagnóstico: Fallos de Tests Vitest

## Estado Actual

### Tests que FALLAN
- **Todos los tests** tienen errores de diferente naturaleza

### Errores Identificados

#### 1. Mock incompleto de `@testing-library/react-native`
```
TypeError: screen.getByText is not a function
TypeError: screen.getByRole is not a function  
TypeError: screen.queryByText is not a function
```
**Ubicación:** `vitest.setup.ts:42-49`

**Problema:** El mock solo define `render` y `screen: {}` vacío, pero los tests usan métodos de screen que no existen.

#### 2. Export faltante de `Pressable` en mock de `react-native-reanimated`
```
No "Pressable" export is defined on the "react-native-reanimated" mock
```
**Ubicación:** Error al importar en `Button.tsx:9`

**Problema:** `createAnimatedComponent(Pressable)` busca `Pressable` dentro del mock de reanimated, no en `react-native`.

#### 3. vitest.config.ts código temporal no limpiado
```typescript
// plugins: [stripFlowImportPlugin(), debugResolvePlugin()],
```
Los plugins están comentados pero no se limpió el código.

## Archivos Involucrados

| Archivo | Acción |
|---------|--------|
| `vitest.setup.ts` | Completar mock de @testing-library/react-native |
| `vitest.config.ts` | Limpiar código comentado |
| `__mocks__/react-native/index.js` | Verificar que Pressable está exportado correctamente |

## Solución Requerida

1. Completar mock de `@testing-library/react-native` con:
   - `getByText`, `getByRole`, `queryByText`
   - `toBeOnTheScreen`, `not` matcher

2. Asegurar disponibilidad de `Pressable` para `createAnimatedComponent`

3. Limpiar `vitest.config.ts` removiendo código comentado