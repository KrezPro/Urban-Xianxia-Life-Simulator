@echo off
chcp 65001 >nul

:: Определяем папку со скриптами (engine) и папку с игрой (game)
set "ENGINE_DIR=%~dp0"
if "%ENGINE_DIR:~-1%"=="\" set "ENGINE_DIR=%ENGINE_DIR:~0,-1%"
set "PROJECT_ROOT=%ENGINE_DIR%\.."
set "GAME_DIR=%PROJECT_ROOT%\game"

:: Создаем папку game, если ее нет
if not exist "%GAME_DIR%" mkdir "%GAME_DIR%"

echo =======================================================
echo Инициализация среды Expo (Раздельная структура)
echo =======================================================
echo.

echo [1/6] Очистка старых файлов в папке game...
cd /d "%GAME_DIR%"
if exist "node_modules" rd /s /q "node_modules"
if exist "assets" rd /s /q "assets"
if exist "app" rd /s /q "app"
if exist "components" rd /s /q "components"
if exist "package.json" del /q "package.json"
if exist "package-lock.json" del /q "package-lock.json"
if exist "app.json" del /q "app.json"
if exist "App.tsx" del /q "App.tsx"
if exist "tsconfig.json" del /q "tsconfig.json"
if exist "babel.config.js" del /q "babel.config.js"

:: Шаг 2: ПОДКЛЮЧЕНИЕ ДВИЖКА (в папке engine)
set "NODE_VERSION=v22.13.1"
set "LOCAL_NODE_DIR=%ENGINE_DIR%\.local-node"

cd /d "%ENGINE_DIR%"
if not exist "%LOCAL_NODE_DIR%\node.exe" (
    echo [2/6] Движок не найден. Скачиваем в папку engine...
    curl -# -o "node.zip" "https://nodejs.org/dist/%NODE_VERSION%/node-%NODE_VERSION%-win-x64.zip"
    tar -xf "node.zip"
    move "node-%NODE_VERSION%-win-x64" ".local-node" >nul
    del "node.zip"
) else (
    echo [2/6] Локальный Node.js на месте.
)

:: Временно подключаем Node.js
set "PATH=%LOCAL_NODE_DIR%;%PATH%"

echo [3/6] Проверка готовности...
call node -v

echo.
echo [4/6] Установка стабильной версии Expo (SDK 54)...
cd /d "%PROJECT_ROOT%"
if exist "temp-app" rd /s /q "temp-app"
call npx create-expo-app@latest temp-app --template expo-template-blank-typescript@54 --yes

if %errorlevel% neq 0 (
    echo.
    echo [ОШИБКА] Установка прервалась.
    pause
    exit /b
)

echo.
echo [5/6] Перенос файлов проекта в папку game...
robocopy temp-app "%GAME_DIR%" /E /MOVE >nul
if exist "temp-app" rd /s /q "temp-app"

echo.
echo [6/6] Финальная синхронизация пакетов...
cd /d "%GAME_DIR%"
call npm install

echo.
echo =======================================================
echo ГОТОВО! Проект успешно развернут.
echo Движок лежит в \engine, игра лежит в \game.
echo =======================================================
pause