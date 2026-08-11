@echo off
chcp 65001 >nul

:: Определяем корневую папку проекта
set "ROOT_DIR=%~dp0"
if "%ROOT_DIR:~-1%"=="\" set "ROOT_DIR=%ROOT_DIR:~0,-1%"

:: Устанавливаем правильные пути внутри корня (с заглавной G)
set "GAME_DIR=%ROOT_DIR%\Game"
set "LOCAL_NODE_DIR=%ROOT_DIR%\.local-node"

echo =======================================================
echo Инициализация среды Expo (Локальная структура)
echo =======================================================
echo.

:: Шаг 1: ПОДКЛЮЧЕНИЕ ДВИЖКА
set "NODE_VERSION=v22.13.1"

if not exist "%LOCAL_NODE_DIR%\node.exe" (
    echo [1/5] Движок не найден. Скачиваем Node.js %NODE_VERSION% локально...
    cd /d "%ROOT_DIR%"
    curl -# -o "node.zip" "https://nodejs.org/dist/%NODE_VERSION%/node-%NODE_VERSION%-win-x64.zip"
    tar -xf "node.zip"
    move "node-%NODE_VERSION%-win-x64" ".local-node" >nul
    del "node.zip"
) else (
    echo [1/5] Локальный Node.js на месте.
)

:: Подключаем Node.js в текущую сессию
set "PATH=%LOCAL_NODE_DIR%;%PATH%"

echo [2/5] Проверка готовности Node.js:
call node -v
call npm -v

echo.
echo [3/5] Подготовка директории Game...
cd /d "%ROOT_DIR%"
if exist "Game" rd /s /q "Game"
if exist "game" rd /s /q "game"
:: Даем Windows секунду на освобождение файловых хэндлов
timeout /t 2 /nobreak >nul

echo.
echo [4/5] Установка стабильной версии Expo (SDK 54)...
call npx --yes create-expo-app@latest Game --template expo-template-blank-typescript@54 --yes

if %errorlevel% neq 0 (
    echo.
    echo [ОШИБКА] Установка Expo прервалась.
    pause
    exit /b
)

echo.
echo [5/5] Установка дополнительных игровых библиотек...
cd /d "%GAME_DIR%"
call npm install zustand react-native-mmkv @shopify/flash-list @react-navigation/native @react-navigation/bottom-tabs react-native-screens react-native-safe-area-context

echo.
echo =======================================================
echo ГОТОВО! Проект успешно развернут.
echo Папка игры: \Game
echo Теперь вы можете использовать start.bat
echo =======================================================
pause