@echo off
REM --- Start Game Server ---

set "ROOT_DIR=%~dp0"
if "%ROOT_DIR:~-1%"=="\" set "ROOT_DIR=%ROOT_DIR:~0,-1%"
set "GAME_DIR=%ROOT_DIR%\Game"
set "PATH=%ROOT_DIR%\.local-node;%PATH%"

if not exist "%GAME_DIR%" (
    echo [ERROR] Game folder not found! Run setup_expo.bat first.
    pause
    exit /b
)

cd /d "%GAME_DIR%"

echo Starting Expo...
call npx expo start -c
pause