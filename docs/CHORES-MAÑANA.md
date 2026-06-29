# CHORES - Tests y Login Infinito

## Prioridad ALTA - Tests

### vitest.setup.ts
- [ ] Eliminar `vi.mock('@testing-library/react-native', () => ({...}))`
- [ ] Agregar `import '@testing-library/react-native/extend-expect'` al inicio
- [ ] Agregar `Pressable` al mock de `react-native-reanimated`:
```ts
vi.mock('react-native-reanimated', () => {
  const RN = require('react-native')
  return {
    useSharedValue: (v: number) => ({ value: v }),
    useAnimatedStyle: (cb) => cb(),
    createAnimatedComponent: (comp) => comp,
    withSpring: (v) => v,
    withTiming: (v) => v,
    withSequence: (...vals) => vals[vals.length - 1],
    interpolateColor: () => '#000',
    Pressable: RN.Pressable,
    default: { createAnimatedComponent: (comp) => comp, View: 'View', Text: 'Text', Pressable: RN.Pressable },
  }
})
```

### vitest.config.ts
- [ ] Agregar `esbuild: { jsx: 'automatic', jsxImportSource: 'react' }`
- [ ] Agregar `exclude: ['tmp/**', 'node_modules/**']` en test config
- [ ] Cambiar alias a regex exacto: `{ find: /^react-native$/, ... }`
- [ ] Eliminar funciones `stripFlowImportPlugin` y `debugResolvePlugin`

### src/shared/atoms/Button.test.tsx
- [ ] Corregir userEvent API en líneas ~79 y ~87:
```ts
// Cambiar: const { userEvent } = render(...)
// Por:
render(...)
const user = userEvent.setup()
await user.press(button)
```

---

## Prioridad ALTA - Login Infinito

### src/shared/providers/ToastProvider.tsx
- [ ] Memoizar value del contexto:
```tsx
const value = useMemo(() => ({ show }), [show])
<ToastContext.Provider value={value}>
```

### app/_layout.tsx
- [ ] Línea 52: Cambiar sin selector
```ts
// const { isAuthenticated } = useAuthStore()
// Por:
const isAuthenticated = useAuthStore(s => s.isAuthenticated)
```

- [ ] Línea 89: useMemo para persister
```ts
// const persister = createSyncStoragePersister(...)
// Por:
const persister = useMemo(
  () => createSyncStoragePersister({ storage: queryPersisterStorage }),
  []
)
```

- [ ] Líneas 24-45: Ignorar `null` en DatabaseSync
```ts
useEffect(() => {
  if (netInfo.isConnected === null) return
  if (isConnected && wasOffline.current) {
    // ...toast logic
  }
  wasOffline.current = !isConnected
}, [isConnected, netInfo.isConnected, toast])
```

---

## Verificación post-fix

```bash
# Tests
npx vitest run src/shared/atoms/Button.test.tsx --reporter=verbose

# App en Android (si se arregla el login)
npm run android
```