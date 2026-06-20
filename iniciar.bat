@echo off
chcp 65001 >nul
echo Iniciando el sistema de inventario...
start "Inventario - Backend (API)" cmd /k "cd /d %~dp0backend && npm run dev"
start "Inventario - Frontend (Web)" cmd /k "cd /d %~dp0frontend && npm run dev"
echo.
echo Dos ventanas se abrieron (Backend y Frontend).
echo Espera unos segundos y abre en tu navegador:  http://localhost:5180
echo.
echo (Para detener todo, cierra esas dos ventanas.)
pause
