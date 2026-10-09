@echo off
chcp 65001 >nul
echo ========================================================
echo   Inicializando Base de Datos con Docker - SysAdmin Pro
echo ========================================================
echo.

if not exist .env (
    echo [*] Archivo .env no encontrado. Copiando desde .env.example...
    copy .env.example .env >nul
)

echo [*] Levantando contenedor de MySQL con Docker Compose...
docker compose up -d

if errorlevel 1 (
    echo.
    echo [ERROR] No se pudo conectar a Docker. Asegurate de que Docker Desktop este abierto y ejecutandose.
    echo.
    pause
    exit /b 1
)

echo [*] Esperando a que MySQL este listo y saludable...
:wait_loop
timeout /t 2 /nobreak >nul
docker inspect --format="{{.State.Health.Status}}" cuarto_servidores_db 2>nul | findstr "healthy" >nul
if errorlevel 1 (
    echo     ... esperando a MySQL ...
    goto wait_loop
)

echo [*] Base de datos activa y lista.
echo [*] Sembrando usuario administrador y credenciales iniciales...
call npm --prefix backend run seed

echo.
echo ========================================================
echo   ¡Base de Datos inicializada con exito!
echo   Usuario Admin: admin@cuarto.local
echo   Contrasena:    Admin_Pass_2026
echo ========================================================
echo.
pause
