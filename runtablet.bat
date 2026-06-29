@echo off
chcp 65001 > nul

:: Detectar ruta del Android SDK
if defined ANDROID_HOME (
    set SDK_ROOT=%ANDROID_HOME%
) else if defined ANDROID_SDK_ROOT (
    set SDK_ROOT=%ANDROID_SDK_ROOT%
) else (
    set SDK_ROOT=%LOCALAPPDATA%\Android\Sdk
)
set EMULATOR=%SDK_ROOT%\emulator\emulator

echo Levantando el emulador en segundo plano...

:: Cambia esto por el nombre exacto de tu emulador (puedes verlo corriendo: %EMULATOR% -list-avds)
set AVD_NAME=Pixel_Tablet_API_35

:: El comando 'start /B' levanta el proceso en segundo plano en Windows
start /B %EMULATOR% -avd "%AVD_NAME%" -no-snapshot-load > nul 2>&1

echo Esperando a que el tablet arranque...
adb wait-for-device

:: Le damos 5 segundos extra para que la interfaz se estabilice
timeout /t 5 /nobreak > nul

echo Levantando JSONserver en segundo plano...
start /B npx json-server docs/db.json --port 3001 > nul 2>&1

echo Compilando e instalando development build...
:: 10.0.2.2 es el loopback del emulador hacia la maquina host (json-server)
set EXPO_PUBLIC_API_URL=http://10.0.2.2:3001
npm run android
