@echo off
chcp 65001 >nul

:: Определяем пути
set "ENGINE_DIR=%~dp0"
set "GAME_DIR=%ENGINE_DIR%..\game"
set "PATH=%ENGINE_DIR%.local-node;%PATH%"

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