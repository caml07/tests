@echo off
set PKG=com.hvp.dietas
set LOGS_DIR=%~dp0..\logs
if not exist "%LOGS_DIR%" mkdir "%LOGS_DIR%"

echo Pulling db-dump.json...
adb exec-out run-as %PKG% cat files/db-dump.json > "%LOGS_DIR%\db-dump.json" 2>nul
if %ERRORLEVEL% equ 0 (
    echo Saved to logs\db-dump.json
) else (
    echo Device not found or file missing. Run dump from the app first.
    echo If ADB fails, try adb shell and inspect manually.
)
