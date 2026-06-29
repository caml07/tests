# iOS – Guia de configuración y notas

## 1. Orientación de pantalla
- `app.json` tiene **`"orientation": "default"`** (valor por defecto) lo que permite que la app rote libremente en iOS.
- Si alguna pantalla necesita forzar *portrait* (por ej. **LoginScreen**), usar:
  ```ts
  import * as ScreenOrientation from 'expo-screen-orientation';
  await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT);
  ```
  y desbloquear al desmontar:
  ```ts
  await ScreenOrientation.unlockAsync();
  ```

## 2. Autenticación biométrica
- **Permiso en Info.plist**
  ```xml
  <key>NSFaceIDUsageDescription</key>
  <string>Se necesita Face ID/Touch ID para iniciar sesión rápidamente.</string>
  ```
- Instalar el módulo:
  ```bash
  expo install expo-local-authentication
  ```
- Hook de ejemplo (`src/features/auth/hooks/useBiometricAuth.ts`):
  ```ts
  import * as LocalAuthentication from 'expo-local-authentication';
  export const useBiometricAuth = async () => {
    const hasHardware = await LocalAuthentication.hasHardwareAsync();
    const isEnrolled = await LocalAuthentication.isEnrolledAsync();
    if (!hasHardware || !isEnrolled) return { success: false, error: 'Biometría no disponible' };
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: 'Inicia sesión con Face ID',
      fallbackLabel: 'Usar contraseña',
    });
    return result;
  };
  ```
- Guardar la preferencia del usuario (ej. `biometricEnabled`) en **SecureStore** (o AsyncStorage en dev) y, al iniciar la app, ejecutar la autenticación automática si está habilitada.

## 3. Safe Area y `Screen`
- iOS respeta `edges={['top','bottom']}` por defecto en el componente `<Screen />`. No es necesario añadir `edges` explícitos salvo que se quiera sobrescribir.
- Mantener `useSafeAreaInsets` para padding de nav‑bars y notch.

## 4. Fuente variable (Lora‑Italic) en iOS
- La fuente variable funciona sin recorte en iOS; el estilo está definido en `LoginScreen.tsx` como:
  ```ts
  appName: {
    ...Typography.loraItalic,
    fontSize: 34,
    lineHeight: 44,
    paddingBottom: 4,
  }
  ```
- No se requieren ajustes adicionales.

## 5. Ejecutar la app en iOS
- **Simulador**: `npm run ios` (usa Xcode). Asegúrate de tener Xcode 15+ y la versión de iOS soportada por Expo SDK 56.
- **Dispositivo físico**: conectar vía USB, confiar en el certificado y ejecutar `npm run ios`. Las mismas variables de entorno (`EXPO_PUBLIC_API_URL`) funcionan sin ADB reverse.

## 6. Notas de depuración
- Ver logs de iOS con:
  ```bash
  npx expo logs:ios
  ```
- El `console.log('[API] BASE_URL:', API_BASE)` se muestra solo en modo `__DEV__`.

---

*Este archivo resume los pasos y configuraciones necesarias para la orientación de pantalla, la autenticación biométrica y consideraciones específicas de iOS.*