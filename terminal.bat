@echo off
chcp 65001 >nul

:: Определяем пути от корня
set "ROOT_DIR=%~dp0"
if "%ROOT_DIR:~-1%"=="\" set "ROOT_DIR=%ROOT_DIR:~0,-1%"
set "GAME_DIR=%ROOT_DIR%\Game"
set "PATH=%ROOT_DIR%\.local-node;%PATH%"

title Локальный терминал Expo (Game)
color 0A

echo =======================================================
echo Локальный терминал активирован!
echo Рабочая директория: %GAME_DIR%
echo =======================================================
echo.

if not exist "%GAME_DIR%" mkdir "%GAME_DIR%"
cd /d "%GAME_DIR%"
cmd.exe /k