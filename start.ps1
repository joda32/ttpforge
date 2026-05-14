#Requires -Version 5.1
<#
.SYNOPSIS
    TTPForge startup script for Windows.

.DESCRIPTION
    Manages the TTPForge Docker Compose stack.

.PARAMETER Check
    Verify that all requirements are installed and ports are available.

.PARAMETER Init
    First-time setup: build images, run DB migrations, seed default users.

.PARAMETER Stop
    Stop all running containers.

.EXAMPLE
    .\start.ps1              # Start the application
    .\start.ps1 -Check       # Verify requirements
    .\start.ps1 -Init        # First-time setup
    .\start.ps1 -Stop        # Stop containers
#>
param(
    [switch]$Check,
    [switch]$Init,
    [switch]$Stop
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

# ── helpers ───────────────────────────────────────────────────────────────────

function Write-Ok([string]$msg)   { Write-Host "  [OK]  $msg" -ForegroundColor Green  }
function Write-Fail([string]$msg) { Write-Host "  [!!]  $msg" -ForegroundColor Red    }
function Write-Info([string]$msg) { Write-Host "  [-]   $msg" -ForegroundColor Cyan   }
function Write-Head([string]$msg) { Write-Host "`n$msg" -ForegroundColor White        }

function Test-Command([string]$cmd) {
    return [bool](Get-Command $cmd -ErrorAction SilentlyContinue)
}

function Test-PortFree([int]$port) {
    $listeners = [System.Net.NetworkInformation.IPGlobalProperties]::GetIPGlobalProperties().GetActiveTcpListeners()
    return -not ($listeners | Where-Object { $_.Port -eq $port })
}

function Get-ComposeCommand {
    # Prefer Docker Compose v2 plugin
    try {
        $null = & docker compose version 2>&1
        if ($LASTEXITCODE -eq 0) { return "docker compose" }
    } catch {}
    if (Test-Command "docker-compose") { return "docker-compose" }
    return $null
}

function Invoke-Compose([string]$args) {
    $cmd = Get-ComposeCommand
    if (-not $cmd) { throw "Docker Compose not found." }
    if ($cmd -eq "docker compose") {
        & docker compose $args.Split(" ")
    } else {
        & docker-compose $args.Split(" ")
    }
}

# ── --check ───────────────────────────────────────────────────────────────────

function Invoke-Check {
    Write-Head "=== Requirement Check ==="
    $ok = $true

    # 1. Docker CLI
    if (Test-Command "docker") {
        $ver = (& docker --version 2>&1) -replace "`n",""
        Write-Ok "Docker CLI found: $ver"
    } else {
        Write-Fail "Docker CLI not found. Install Docker Desktop: https://docs.docker.com/desktop/windows/"
        $ok = $false
    }

    # 2. Docker daemon
    try {
        $null = & docker info 2>&1
        if ($LASTEXITCODE -eq 0) {
            Write-Ok "Docker daemon is running"
        } else {
            Write-Fail "Docker daemon is not running. Start Docker Desktop."
            $ok = $false
        }
    } catch {
        Write-Fail "Could not reach Docker daemon. Start Docker Desktop."
        $ok = $false
    }

    # 3. Docker Compose
    $compose = Get-ComposeCommand
    if ($compose) {
        if ($compose -eq "docker compose") {
            $ver = (& docker compose version 2>&1) -replace "`n",""
        } else {
            $ver = (& docker-compose --version 2>&1) -replace "`n",""
        }
        Write-Ok "Docker Compose found ($compose): $ver"
    } else {
        Write-Fail "Docker Compose not found. Install Docker Desktop (includes Compose v2)."
        $ok = $false
    }

    # 4. docker-compose.yml
    if (Test-Path "docker-compose.yml") {
        Write-Ok "docker-compose.yml found in current directory"
    } else {
        Write-Fail "docker-compose.yml not found. Run this script from the project root."
        $ok = $false
    }

    # 5. Port availability
    @(
        @{ Port = 5000; Name = "Backend  (Flask)     " },
        @{ Port = 5173; Name = "Frontend (Vite)      " },
        @{ Port = 5432; Name = "Database (PostgreSQL)" }
    ) | ForEach-Object {
        if (Test-PortFree $_.Port) {
            Write-Ok "Port $($_.Port) ($($_.Name)) is available"
        } else {
            Write-Fail "Port $($_.Port) ($($_.Name)) is already in use"
            $ok = $false
        }
    }

    Write-Host ""
    if ($ok) {
        Write-Host "All checks passed. Ready to run." -ForegroundColor Green
    } else {
        Write-Host "One or more checks failed. Resolve the issues above before starting." -ForegroundColor Red
    }
    return $ok
}

# ── --init ────────────────────────────────────────────────────────────────────

function Invoke-Init {
    Write-Head "=== TTPForge — First-Time Setup ==="

    Write-Info "Running requirement checks..."
    $checksOk = Invoke-Check
    if (-not $checksOk) {
        Write-Host "`nSetup aborted: fix the issues above first." -ForegroundColor Red
        exit 1
    }

    Write-Head "--- Building and starting containers ---"
    Invoke-Compose "up --build -d"
    if ($LASTEXITCODE -ne 0) {
        Write-Fail "docker compose up failed."
        exit 1
    }

    # Wait for backend
    Write-Head "--- Waiting for backend to be ready ---"
    $timeout  = 120
    $elapsed  = 0
    $interval = 4
    $ready    = $false

    while ($elapsed -lt $timeout) {
        try {
            $resp = Invoke-WebRequest -Uri "http://localhost:5000/docs/api/openapi.json" `
                       -UseBasicParsing -TimeoutSec 3 -ErrorAction Stop
            if ($resp.StatusCode -eq 200) { $ready = $true; break }
        } catch {}
        Write-Host ("  Waiting... ({0}/{1} s)" -f $elapsed, $timeout) -ForegroundColor DarkGray
        Start-Sleep -Seconds $interval
        $elapsed += $interval
    }

    if (-not $ready) {
        Write-Fail "Backend did not become ready within $timeout seconds."
        Write-Info "Check logs with: docker compose logs backend"
        exit 1
    }

    Write-Ok "Backend is ready."

    # Verify admin user by attempting login
    Write-Head "--- Verifying default admin account ---"
    try {
        $body = '{"username":"admin","password":"admin"}'
        $resp = Invoke-WebRequest -Uri "http://localhost:5000/api/auth/login" `
                   -Method POST -Body $body -ContentType "application/json" `
                   -UseBasicParsing -TimeoutSec 5 -ErrorAction Stop
        if ($resp.StatusCode -eq 200) {
            Write-Ok "Default admin account confirmed (admin / admin)"
        }
    } catch {
        Write-Fail "Could not verify admin account. Check: docker compose logs backend"
    }

    Write-Host ""
    Write-Host "========================================" -ForegroundColor Green
    Write-Host "  TTPForge is ready!" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "  App:      http://localhost:5173" -ForegroundColor Cyan
    Write-Host "  API docs: http://localhost:5000/docs/api" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "  Default credentials:" -ForegroundColor White
    Write-Host "    Admin:     admin / admin" -ForegroundColor White
    Write-Host "    Red team:  redteam / redteam" -ForegroundColor White
    Write-Host "    Blue team: blueteam / blueteam" -ForegroundColor White
    Write-Host ""
}

# ── --stop ────────────────────────────────────────────────────────────────────

function Invoke-Stop {
    Write-Head "=== Stopping TTPForge ==="
    Invoke-Compose "down"
    Write-Ok "All containers stopped."
}

# ── default start ─────────────────────────────────────────────────────────────

function Invoke-Start {
    Write-Head "=== Starting TTPForge ==="

    if (-not (Test-Path "docker-compose.yml")) {
        Write-Fail "docker-compose.yml not found. Run this script from the project root."
        exit 1
    }

    Invoke-Compose "up -d"
    if ($LASTEXITCODE -ne 0) { exit 1 }

    Write-Host ""
    Write-Host "  App:      http://localhost:5173" -ForegroundColor Cyan
    Write-Host "  API docs: http://localhost:5000/docs/api" -ForegroundColor Cyan
    Write-Host ""
    Write-Info "View logs with: docker compose logs -f"
}

# ── dispatch ──────────────────────────────────────────────────────────────────

if ($Check) { $null = Invoke-Check }
elseif ($Init) { Invoke-Init }
elseif ($Stop) { Invoke-Stop }
else { Invoke-Start }

