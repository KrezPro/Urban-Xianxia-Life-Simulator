@echo off
chcp 65001 >nul

:: Определяем пути
set "ENGINE_DIR=%~dp0"
set "GAME_DIR=%ENGINE_DIR%..\game"
set "PATH=%ENGINE_DIR%.local-node;%PATH%"

if not exist "%GAME_DIR%" (
    echo [ОШИБКА] Папка game не найдена! Сначала запустите setup_expo.bat
    pause
    exit /b
)

cd /d "%GAME_DIR%"

:: Запуск с очисткой кэша
npx expo start -c
pause