# ============================================================
#  Alvatowash — Script de inicialización y push a GitHub
#  Ejecutar con: clic derecho → "Ejecutar con PowerShell"
# ============================================================

$ErrorActionPreference = "Stop"
$ProjectDir = Split-Path -Parent $MyInvocation.MyCommand.Definition
Set-Location $ProjectDir

Write-Host ""
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "  Alvatowash  ·  Setup GitHub" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

# 1. Verificar que git está instalado
try {
    $gitVersion = git --version 2>&1
    Write-Host "✔  Git detectado: $gitVersion" -ForegroundColor Green
} catch {
    Write-Host "✘  Git no está instalado. Descárgalo en https://git-scm.com/download/win" -ForegroundColor Red
    Read-Host "Presioná ENTER para salir"
    exit 1
}

# 2. Verificar que GitHub CLI está instalado (opcional, para crear el repo automáticamente)
$ghAvailable = $false
try {
    $ghVersion = gh --version 2>&1
    Write-Host "✔  GitHub CLI detectado: $($ghVersion | Select-Object -First 1)" -ForegroundColor Green
    $ghAvailable = $true
} catch {
    Write-Host "ℹ  GitHub CLI no encontrado (lo crearemos manualmente)" -ForegroundColor Yellow
}

Write-Host ""

# 3. Inicializar repositorio si no existe
if (-not (Test-Path ".git")) {
    Write-Host "→ Inicializando repositorio git..." -ForegroundColor White
    git init
    git branch -M main
    Write-Host "✔  Repositorio inicializado" -ForegroundColor Green
} else {
    Write-Host "✔  Repositorio git ya existente" -ForegroundColor Green
}

# 4. Configurar usuario git si no está configurado
$gitUser = git config --global user.name 2>&1
if (-not $gitUser) {
    $name = Read-Host "Ingresá tu nombre para git (ej: Jhonathan Hernandez)"
    $email = Read-Host "Ingresá tu email de GitHub"
    git config --global user.name $name
    git config --global user.email $email
}

# 5. Stage y commit inicial
Write-Host ""
Write-Host "→ Añadiendo archivos al commit..." -ForegroundColor White
git add -A

$stagedCount = (git diff --cached --name-only | Measure-Object -Line).Lines
Write-Host "✔  $stagedCount archivos listos para commit" -ForegroundColor Green

Write-Host ""
Write-Host "→ Creando commit inicial..." -ForegroundColor White
try {
    git commit -m "feat: Alvatowash SaaS — lanzamiento inicial

- Landing page principal (Protección Cerámica + Configurador del Detalle)
- Panel de administración con checkout unificado y firma digital
- Panel de empleados con VIP opt-in
- Sistema de Albaranes con email automático y vista pública
- Gestión de Leads (carrito olvidado) con conversión a reserva
- Club VIP con niveles Bronce/Plata/Oro/Diamante
- Widget de reservas para clientes
- Área de cliente
- PWA: service worker + manifest + icono SVG
- Backend Google Apps Script integrado"
    Write-Host "✔  Commit creado" -ForegroundColor Green
} catch {
    Write-Host "ℹ  Ya hay commits previos, creando commit de actualización..." -ForegroundColor Yellow
    git commit -m "chore: actualización de archivos del proyecto" 2>&1 | Out-Null
}

Write-Host ""

# 6. Crear repo en GitHub o pedir URL manual
$repoUrl = ""

if ($ghAvailable) {
    Write-Host "→ Creando repositorio privado en GitHub con GitHub CLI..." -ForegroundColor White
    try {
        gh repo create alvatowash --private --source=. --remote=origin --push
        Write-Host ""
        Write-Host "==========================================" -ForegroundColor Green
        Write-Host "  ✔  ¡Proyecto subido a GitHub!" -ForegroundColor Green
        Write-Host "==========================================" -ForegroundColor Green
        $repoInfo = gh repo view --json url -q '.url' 2>&1
        Write-Host ""
        Write-Host "  URL del repositorio: $repoInfo" -ForegroundColor Cyan
        Write-Host ""
        Read-Host "Presioná ENTER para cerrar"
        exit 0
    } catch {
        Write-Host "ℹ  No se pudo crear automáticamente. Continuando con método manual..." -ForegroundColor Yellow
    }
}

# 7. Método manual: pedir URL del repo
Write-Host ""
Write-Host "========================================================" -ForegroundColor Yellow
Write-Host "  PASO MANUAL: Crear el repositorio en GitHub" -ForegroundColor Yellow
Write-Host "========================================================" -ForegroundColor Yellow
Write-Host ""
Write-Host "  1. Abrí: https://github.com/new" -ForegroundColor White
Write-Host "  2. Nombre del repo: alvatowash" -ForegroundColor White
Write-Host "  3. Seleccioná: Private" -ForegroundColor White
Write-Host "  4. NO inicialices con README" -ForegroundColor White
Write-Host "  5. Copiá la URL del repo (ej: https://github.com/tuusuario/alvatowash.git)" -ForegroundColor White
Write-Host ""
$repoUrl = Read-Host "Pegá aquí la URL del repositorio y presioná ENTER"

if ($repoUrl -eq "") {
    Write-Host ""
    Write-Host "✘  URL vacía. Saliendo sin hacer push." -ForegroundColor Red
    Read-Host "Presioná ENTER para cerrar"
    exit 1
}

# 8. Agregar remote y push
Write-Host ""
Write-Host "→ Configurando remote origin..." -ForegroundColor White
$existingRemote = git remote 2>&1
if ($existingRemote -match "origin") {
    git remote set-url origin $repoUrl
} else {
    git remote add origin $repoUrl
}

Write-Host "→ Haciendo push a GitHub..." -ForegroundColor White
git push -u origin main

Write-Host ""
Write-Host "==========================================" -ForegroundColor Green
Write-Host "  ✔  ¡Proyecto subido a GitHub!" -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Green
Write-Host ""
Write-Host "  URL: $repoUrl" -ForegroundColor Cyan
Write-Host ""
Read-Host "Presioná ENTER para cerrar"
