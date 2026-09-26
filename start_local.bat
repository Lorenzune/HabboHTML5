@echo off
setlocal
cd /d "%~dp0"

title Habbo Classic - Local Polaris Emulator Console

set "TICKET=%~1"
set "SERVER=local"

if "%TICKET%"=="" (
    echo =====================================================================
    echo  HABBO CLASSIC - LOCAL EMULATOR LAUNCHER
    echo =====================================================================
    echo  Target: ws://localhost:2096/websocket (Polaris-Emulator)
    echo.
    echo  Tip: Set an auth_ticket in your Polaris database:
    echo       UPDATE users SET auth_ticket = 'test-ticket' WHERE id = 1;
    echo =====================================================================
    echo.
    set /p "TICKET=Enter your SSO ticket (press ENTER for 'test-ticket'): "
)

if "%TICKET%"=="" (
    set "TICKET=test-ticket"
)

echo.
echo =====================================================================
echo  [*] Connecting to Local Polaris Emulator...
echo  [*] Server: %SERVER% (ws://localhost:2096/websocket)
echo  [*] SSO Ticket: %TICKET%
echo  [*] Live Network & Packet stream active below
echo  [*] DevTools: Press F12 or Ctrl+Shift+I in Habbo window
echo =====================================================================
echo.

set ELECTRON_ENABLE_LOGGING=1
"Habbo.exe" --enable-logging -server %SERVER% -ticket %TICKET% 2>&1

echo.
echo =====================================================================
echo  [Habbo local session closed]
echo =====================================================================
pause
