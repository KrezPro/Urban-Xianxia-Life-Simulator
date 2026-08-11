@echo off
chcp 65001 >nul

:: Берем текущую папку (там, где лежит сам батник)
set "PROJECT_ROOT=%~dp0"
cd /d "%PROJECT_ROOT%"

echo =======================================================
echo Интеграция с AiCoder и подключение к GitHub
echo =======================================================
echo.

:: 1. Проверка и настройка Git для AiCoder
echo [1/4] Настройка профиля Git...
set /p GIT_NAME="Введите ваше имя (на английском, например John Doe): "
set /p GIT_EMAIL="Введите ваш email (например john@example.com): "

git config --global user.name "%GIT_NAME%"
git config --global user.email "%GIT_EMAIL%"

:: 2. Инициализация репозитория
echo.
echo [2/4] Инициализация локального Git-репозитория...
git init
    
:: Создаем служебную папку AiCoder, если ее нет
if not exist ".aicoder" mkdir ".aicoder"

:: 3. Подключение к GitHub
echo.
echo [3/4] Подключение к GitHub...
set /p GITHUB_URL="Вставьте ПОЛНУЮ ссылку на репозиторий (начинается с https://): "
    
if not "%GITHUB_URL%"=="" (
    git remote add origin %GITHUB_URL%
    git branch -M main
    echo Успешно подключено к: %GITHUB_URL%
) else (
    echo Подключение к GitHub пропущено.
)

:: 4. Первый коммит
echo.
echo [4/4] Сохранение базовой структуры проекта...
git add .
git commit -m "Инициализация проекта Urban Xianxia, структуры папок и инфраструктуры"

if not "%GITHUB_URL%"=="" (
    echo Отправка файлов на GitHub...
    git push -u origin main
)

echo.
echo =======================================================
echo ГОТОВО!
echo =======================================================
pause