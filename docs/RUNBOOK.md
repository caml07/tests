# Runbook — comandos rápidos

## Desarrollo local (web)
```bash
npx json-server docs/db.json --port 3001
npm start
```

## Probar en Android físico (ADB Reverse, bypass firewall)

### Paso a paso

1. Conectar celular por USB (debugging USB activado).

2. **Terminal 1 — json-server:**
   ```bash
   npx json-server docs/db.json --port 3001
   ```

3. **Terminal 2 — Túnel ADB:**
   ```bash
   adb reverse tcp:3001 tcp:3001
   ```
   *Necesario cada vez que se desconecta y reconecta el cable.*

4. **Terminal 3 — Compilar e instalar app + Metro:**
   ```powershell
   $env:EXPO_PUBLIC_API_URL="http://127.0.0.1:3001"; npm run android
   ```
   (CMD: `set EXPO_PUBLIC_API_URL=http://127.0.0.1:3001 && npm run android`)

### Notas

- `EXPO_PUBLIC_API_URL` sobreescribe la IP por defecto en `src/shared/utils/config.ts`. Sin esa env var, Android usa `10.0.2.2` (loopback del emulador) que no funciona en físico.
- La app instalada via `npm run android` es un *development build* (expo-dev-client), no Expo Go. Abrir desde el launcher con ícono de exponente naranja.
- `adb reverse tcp:3001 tcp:3001` redirige el puerto 3001 del celular al 3001 de la PC a través del cable USB, evitando el Wi-Fi del hospital.
