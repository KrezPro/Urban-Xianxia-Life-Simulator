@echo off
chcp 65001 >nul

:: Определяем пути от корня
set "ROOT_DIR=%~dp0"
if "%ROOT_DIR:~-1%"=="\" set "ROOT_DIR=%ROOT_DIR:~0,-1%"
set "GAME_DIR=%ROOT_DIR%\Game"
set "PATH=%ROOT_DIR%\.local-node;%PATH%"

if not exist "%GAME_DIR%" (
    echo [ОШИБКА] Папка Game не найдена! Сначала запустите setup_expo.bat
    pause
    exit /b
)

cd /d "%GAME_DIR%"

:: Запуск с очисткой кэша
npx expo start -c
pause