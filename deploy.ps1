# =============================================================================
# Library Management System - LAN Deployment Script
# =============================================================================
# Usage: Right-click this file > "Run with PowerShell"
#    or: Open PowerShell in this folder and run: .\deploy.ps1
# =============================================================================

param(
    [switch]$Build,        # Force rebuild: .\deploy.ps1 -Build
    [switch]$Down,         # Stop all: .\deploy.ps1 -Down
    [switch]$Logs,         # View logs: .\deploy.ps1 -Logs
    [switch]$Status,       # Check status: .\deploy.ps1 -Status
    [switch]$Reset         # Full reset: .\deploy.ps1 -Reset
)

# Colors
function Write-Step($msg) { Write-Host "  [*] $msg" -ForegroundColor Cyan }
function Write-OK($msg) { Write-Host "  [OK] $msg" -ForegroundColor Green }
function Write-Warn($msg) { Write-Host "  [!] $msg" -ForegroundColor Yellow }
function Write-Err($msg) { Write-Host "  [X] $msg" -ForegroundColor Red }

$separator = "=" * 60

Write-Host ""
Write-Host $separator -ForegroundColor DarkCyan
Write-Host "  Library Management System - Docker Deployment" -ForegroundColor White
Write-Host $separator -ForegroundColor DarkCyan
Write-Host ""

# ── Handle sub-commands ──────────────────────────────────────
if ($Down) {
    Write-Step "Stopping all services..."
    docker compose down
    Write-OK "All services stopped."
    exit 0
}

if ($Logs) {
    docker compose logs -f --tail=100
    exit 0
}

if ($Status) {
    docker compose ps
    exit 0
}

if ($Reset) {
    Write-Warn "This will DELETE all data (database, uploads, logs)."
    $confirm = Read-Host "  Are you sure? Type 'yes' to confirm"
    if ($confirm -ne 'yes') {
        Write-Err "Aborted."
        exit 1
    }
    docker compose down -v
    Write-OK "All services and volumes removed."
    exit 0
}

# ── Step 1: Check Docker ────────────────────────────────────
Write-Step "Checking Docker installation..."

$dockerVersion = docker --version 2>$null
if (-not $dockerVersion) {
    Write-Err "Docker is not installed or not in PATH."
    Write-Host "  Download Docker Desktop: https://www.docker.com/products/docker-desktop/" -ForegroundColor Gray
    exit 1
}
Write-OK "Docker found: $dockerVersion"

# Check if Docker daemon is running
$dockerInfo = docker info 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Err "Docker Desktop is not running. Please start it first."
    exit 1
}
Write-OK "Docker daemon is running."

# ── Step 2: Detect LAN IP ───────────────────────────────────
Write-Step "Detecting LAN IP address..."

$lanIP = (Get-NetIPAddress -AddressFamily IPv4 | Where-Object {
        $_.InterfaceAlias -notlike '*Loopback*' -and
        $_.IPAddress -ne '127.0.0.1' -and
        $_.PrefixOrigin -ne 'WellKnown'
    } | Select-Object -First 1).IPAddress

if (-not $lanIP) {
    Write-Warn "Could not auto-detect LAN IP. Using localhost."
    $lanIP = "localhost"
}
Write-OK "LAN IP detected: $lanIP"

# ── Step 3: Update .env ─────────────────────────────────────
Write-Step "Configuring environment..."

$envFile = Join-Path $PSScriptRoot ".env"

if (-not (Test-Path $envFile)) {
    Write-Warn ".env file not found. Creating from template..."
    Copy-Item (Join-Path $PSScriptRoot ".env.docker.example") $envFile
}

# Read current .env content
$envContent = Get-Content $envFile -Raw

# Update SANCTUM_STATEFUL_DOMAINS with LAN IP
$sanctumDomains = "localhost,127.0.0.1,localhost:8080,127.0.0.1:8080,${lanIP},${lanIP}:8080"
$envContent = $envContent -replace '(?m)^SANCTUM_STATEFUL_DOMAINS=.*$', "SANCTUM_STATEFUL_DOMAINS=$sanctumDomains"

# Update APP_URL with LAN IP (Use HTTPS for camera access)
$appUrl = "https://${lanIP}:8443"
$envContent = $envContent -replace '(?m)^APP_URL=.*$', "APP_URL=$appUrl"

# Write back
Set-Content -Path $envFile -Value $envContent -NoNewline
Write-OK "Environment configured for LAN access."

# ── Step 4: Build ────────────────────────────────────────────
if ($Build -or -not (docker images -q library-management-system-app 2>$null)) {
    Write-Step "Building Docker images (this may take a few minutes)..."
    docker compose build --progress=plain
    if ($LASTEXITCODE -ne 0) {
        Write-Err "Build failed. Check the output above for errors."
        exit 1
    }
    Write-OK "Docker images built successfully."
}
else {
    Write-OK "Docker images already exist. Use -Build to force rebuild."
}

# ── Step 5: Start services ──────────────────────────────────
Write-Step "Starting services..."
docker compose up -d
if ($LASTEXITCODE -ne 0) {
    Write-Err "Failed to start services. Run 'docker compose logs' for details."
    exit 1
}

# ── Step 6: Wait for healthy ────────────────────────────────
Write-Step "Waiting for services to become healthy..."
$maxWait = 120  # seconds
$elapsed = 0

while ($elapsed -lt $maxWait) {
    $healthy = docker compose ps --format json 2>$null | ConvertFrom-Json | Where-Object { $_.Health -eq 'healthy' }
    $total = docker compose ps --format json 2>$null | ConvertFrom-Json
    
    if ($healthy -and $total -and ($healthy.Count -ge 4 -or ($total | Where-Object { $_.Health -eq 'healthy' }).Count -ge 3)) {
        break
    }
    
    Start-Sleep -Seconds 5
    $elapsed += 5
    Write-Host "    Waiting... ($elapsed s)" -ForegroundColor Gray
}

# ── Step 7: Show status ─────────────────────────────────────
Write-Host ""
docker compose ps
Write-Host ""

# ── Done ─────────────────────────────────────────────────────
Write-Host $separator -ForegroundColor Green
Write-Host ""
Write-Host "  ✅ Deployment Complete!" -ForegroundColor Green
Write-Host ""
Write-Host "  Access the secure application (Required for Camera):" -ForegroundColor White
Write-Host "    From this PC:      https://localhost:8443" -ForegroundColor Green
Write-Host "    From LAN devices:  https://${lanIP}:8443" -ForegroundColor Green
Write-Host ""
Write-Host "  Standard Access (Redirects to HTTPS):" -ForegroundColor White
Write-Host "    From this PC:      http://localhost:8080" -ForegroundColor Cyan
Write-Host "    From LAN devices:  http://${lanIP}:8080" -ForegroundColor Cyan
Write-Host ""
Write-Host "  Public Kiosk URLs:" -ForegroundColor White
Write-Host "    Catalog:           https://${lanIP}:8443/catalog" -ForegroundColor Cyan
Write-Host "    Attendance:        https://${lanIP}:8443/attendance" -ForegroundColor Cyan
Write-Host ""
Write-Host "  Useful commands:" -ForegroundColor White
Write-Host "    .\deploy.ps1 -Logs      View live logs" -ForegroundColor Gray
Write-Host "    .\deploy.ps1 -Status    Check service status" -ForegroundColor Gray
Write-Host "    .\deploy.ps1 -Down      Stop all services" -ForegroundColor Gray
Write-Host "    .\deploy.ps1 -Build     Rebuild and restart" -ForegroundColor Gray
Write-Host "    .\deploy.ps1 -Reset     Delete everything" -ForegroundColor Gray
Write-Host ""
Write-Host $separator -ForegroundColor Green
