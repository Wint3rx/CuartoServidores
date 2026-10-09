# Script de inicialización de Base de Datos para SysAdmin Pro
Write-Host "========================================================" -ForegroundColor Cyan
Write-Host "  Inicializando Base de Datos con Docker - SysAdmin Pro" -ForegroundColor Cyan
Write-Host "========================================================" -ForegroundColor Cyan
Write-Host ""

if (-not (Test-Path ".env")) {
    Write-Host "[*] Archivo .env no encontrado. Creando desde .env.example..." -ForegroundColor Yellow
    Copy-Item ".env.example" ".env"
}

Write-Host "[*] Levantando contenedor de MySQL..." -ForegroundColor Green
docker compose up -d

if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "[ERROR] Docker fallo al iniciar. Asegurate de tener Docker Desktop abierto." -ForegroundColor Red
    Write-Host ""
    exit 1
}

Write-Host "[*] Esperando a que el contenedor MySQL este saludable..." -ForegroundColor Yellow
$healthy = $false
for ($i = 0; $i -lt 30; $i++) {
    $status = docker inspect --format='{{.State.Health.Status}}' cuarto_servidores_db 2>$null
    if ($status -eq "healthy") {
        $healthy = $true
        break
    }
    Start-Sleep -Seconds 2
}

if (-not $healthy) {
    Write-Host "[!] El contenedor tardo en reportar salud. Continuando de todos modos..." -ForegroundColor Yellow
} else {
    Write-Host "[OK] Contenedor MySQL listo y saludable." -ForegroundColor Green
}

Write-Host "[*] Ejecutando semillero (usuario admin y credenciales)..." -ForegroundColor Green
npm --prefix backend run seed

Write-Host ""
Write-Host "========================================================" -ForegroundColor Green
Write-Host "  ¡Base de datos lista para usar!" -ForegroundColor Green
Write-Host "  Usuario Admin: admin@cuarto.local" -ForegroundColor White
Write-Host "  Contraseña:    Admin_Pass_2026" -ForegroundColor White
Write-Host "========================================================" -ForegroundColor Green
