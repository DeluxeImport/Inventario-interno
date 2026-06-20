@echo off
chcp 65001 >nul
echo ============================================
echo   Instalando Sistema de Inventario
echo ============================================
echo.
echo [1/3] Instalando dependencias del backend...
cd /d "%~dp0backend"
call npm install
if errorlevel 1 goto error
echo.
echo [2/3] Creando base de datos, productos y usuario admin...
call npx prisma generate
call npx prisma db push
call node prisma/seed.js
call node prisma/seed_admin.js
call node prisma/seed_tiendas.js
call node prisma/seed_areas.js
if errorlevel 1 goto error
echo.
echo [3/3] Instalando dependencias del frontend...
cd /d "%~dp0frontend"
call npm install
if errorlevel 1 goto error
echo.
echo ============================================
echo   Listo. Ejecuta  iniciar.bat  para arrancar.
echo ============================================
pause
exit /b 0
:error
echo.
echo *** Ocurrio un error durante la instalacion. ***
pause
exit /b 1
