@echo off
setlocal
cd /d "%~dp0"

title Habbo Classic - Network & Log Console

set "TICKET=%~1"
set "SERVER=%~2"

if "%SERVER%"=="" (
    set "SERVER=hhit"
)

if "%TICKET%"=="" (
    set /p "TICKET=Paste your Habbo SSO ticket: "
)

if "%TICKET%"=="" (
    echo No ticket provided. Exiting...
    pause
    exit /b 1
)

echo.
echo =====================================================================
echo  HABBO CLASSIC - NETWORK LOGGING CONSOLE
echo =====================================================================
echo  [*] Target Hotel Server: %SERVER%
echo  [*] Console: Keeping output attached for live network request stream
echo  [*] DevTools: Press F12 or Ctrl+Shift+I inside the Habbo window
echo =====================================================================
echo.

set ELECTRON_ENABLE_LOGGING=1
"Habbo.exe" --enable-logging -server %SERVER% -ticket %TICKET% 2>&1

echo.
echo =====================================================================
echo  [Habbo session closed]
echo =====================================================================
pause
