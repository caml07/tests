@echo off
set PKG=com.hvp.dietas
set LOGS_DIR=%~dp0..\logs
if not exist "%LOGS_DIR%" mkdir "%LOGS_DIR%"

echo Pulling nutricion.db...
adb exec-out run-as %PKG% cat databases/nutricion.db > "%LOGS_DIR%\nutricion.db" 2>nul
if %ERRORLEVEL% equ 0 (
    echo Saved to logs\nutricion.db
) else (
    echo Device not found or DB not accessible.
)
