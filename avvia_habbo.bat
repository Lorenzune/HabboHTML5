@echo off
setlocal
cd /d "%~dp0"

title Habbo Classic - Console di Rete e Log

set "TICKET=%~1"

if "%TICKET%"=="" (
    set /p "TICKET=Incolla il ticket di Habbo: "
)

if "%TICKET%"=="" (
    echo Nessun ticket inserito. Chiusura...
    pause
    exit /b 1
)

echo.
echo =====================================================================
echo  HABBO CLASSIC - CONSOLE RICHIESTE DI RETE
echo =====================================================================
echo  [*] Server: hhit (Habbo Italia)
echo  [*] Console: rimarra' aperta per mostrare le richieste in tempo reale
echo  [*] DevTools: premi F12 o Ctrl+Shift+I nella finestra di Habbo
echo =====================================================================
echo.

set ELECTRON_ENABLE_LOGGING=1
"Habbo.exe" --enable-logging -server hhit -ticket %TICKET% 2>&1

echo.
echo =====================================================================
echo  [Habbo terminato]
echo =====================================================================
pause
