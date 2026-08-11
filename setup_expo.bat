@echo off
REM --- Project Environment Setup ---

set "ROOT_DIR=%~dp0"
if "%ROOT_DIR:~-1%"=="\" set "ROOT_DIR=%ROOT_DIR:~0,-1%"

set "GAME_DIR=%ROOT_DIR%\Game"
set "LOCAL_NODE_DIR=%ROOT_DIR%\.local-node"

echo =======================================================
echo Initializing Expo Environment (Local Structure)
echo =======================================================
echo.

set "NODE_VERSION=v22.13.1"

if not exist "%LOCAL_NODE_DIR%\node.exe" (
    echo [1/5] Engine not found. Downloading Node.js %NODE_VERSION% locally...
    cd /d "%ROOT_DIR%"
    curl -# -o "node.zip" "https://nodejs.org/dist/%NODE_VERSION%/node-%NODE_VERSION%-win-x64.zip"
    tar -xf "node.zip"
    move "node-%NODE_VERSION%-win-x64" ".local-node" >nul
    del "node.zip"
) else (
    echo [1/5] Local Node.js is already installed.
)

set "PATH=%LOCAL_NODE_DIR%;%PATH%"

echo [2/5] Checking Node.js readiness:
call node -v
call npm -v

echo.
echo [3/5] Preparing Game directory...
cd /d "%ROOT_DIR%"
if exist "Game" rd /s /q "Game"
if exist "game" rd /s /q "game"
timeout /t 2 /nobreak >nul

echo.
echo [4/5] Installing stable Expo (SDK 54)...
call npx --yes create-expo-app@latest Game --template expo-template-blank-typescript@54 --yes

if %errorlevel% neq 0 (
    echo.
    echo [ERROR] Expo installation failed.
    pause
    exit /b
)

echo.
echo [5/5] Installing additional game libraries...
cd /d "%GAME_DIR%"
call npm install zustand react-native-mmkv @shopify/flash-list @react-navigation/native @react-navigation/bottom-tabs react-native-screens react-native-safe-area-context

echo.
echo =======================================================
echo DONE! Project successfully deployed.
echo Game folder: \Game
echo You can now use start.bat
echo =======================================================
pause