# tools docker [--down] [--wipe] [-v]
# Default: start if down, rebuild + restart if already up.
# --down:  stop the stack.
# --wipe:  docker compose down -v (removes containers AND volumes). Prompts for confirmation.

function Invoke-Docker {
    param([switch]$Down, [switch]$Wipe, [switch]$VerboseOutput, [switch]$SkipVaultSetup, [switch]$Yes)

    $dockerPath = Find-Executable -Name "docker" -Fallbacks $script:KnownPaths.docker
    if (-not $dockerPath) {
        Write-Err "Docker not found"
        Write-Warn "Install Docker Desktop: https://www.docker.com/products/docker-desktop"
        exit 1
    }

    if (-not (Test-DockerDaemon -DockerPath $dockerPath)) { exit 1 }

    if ($Wipe) {
        Write-Warn "This will remove all containers AND volumes (database, Vault data, media). All data will be lost."
        if (-not $Yes) {
            $answer = Read-Host "  Are you sure? [y/N]"
            if ($answer -notmatch "^[Yy]") { Write-Info "Cancelled."; return }
        } else {
            Write-Info "Auto-approved with -y/--yes"
        }
        Write-Info "Wiping stack..."
        $prev = $ErrorActionPreference
        $ErrorActionPreference = "Continue"
        & $dockerPath compose down -v
        $exitCode = $LASTEXITCODE
        $ErrorActionPreference = $prev
        if ($exitCode -eq 0) { Write-Ok "Stack and all volumes removed" }
        else { Write-Err "docker compose down -v failed (exit $exitCode)"; exit 1 }
        return
    }

    if ($Down) {
        Write-Info "Stopping stack..."
        $prev = $ErrorActionPreference
        $ErrorActionPreference = "Continue"
        & $dockerPath compose down
        $exitCode = $LASTEXITCODE
        $ErrorActionPreference = $prev
        if ($exitCode -eq 0) { Write-Ok "Stack stopped" }
        else { Write-Err "docker compose down failed (exit $exitCode)"; exit 1 }
        return
    }

    # Check if already running
    $stackUp = $false
    try {
        $prev = $ErrorActionPreference
        $ErrorActionPreference = "Continue"
        $psLines = @(& $dockerPath compose ps 2>$null)
        $exitCode = $LASTEXITCODE
        $ErrorActionPreference = $prev
        $stackUp = ($exitCode -eq 0) -and [bool]($psLines | Where-Object { $_ -match '\brunning\b|\bUp\b' })
    } catch { $stackUp = $false }

    if ($stackUp) {
        Write-Info "Stack is running - rebuilding and restarting..."
    } else {
        Write-Info "Starting stack..."
    }

    $started = Invoke-ComposeUp -DockerPath $dockerPath -Quiet:(!$VerboseOutput)
    if (-not $started) {
        Write-Err "docker compose up failed"
        if (-not $VerboseOutput) { Write-Warn "Re-run with -v for full output" }
        exit 1
    }

    Write-Info "Waiting for infrastructure services to be healthy..."
    $elapsed = 0
    $infraReady = $false
    while ($elapsed -lt 150) {
        Start-Sleep -Seconds 5
        $elapsed += 5
        $prev = $ErrorActionPreference
        $ErrorActionPreference = "Continue"
        $psLines = @(& $dockerPath compose ps 2>$null)
        $ErrorActionPreference = $prev
        $stillStarting = $psLines | Where-Object { $_ -match '\(starting\)|\(health: starting\)' }
        $unhealthy     = $psLines | Where-Object { $_ -match '\(unhealthy\)' }
        if ($unhealthy) {
            Write-Warn "  Service(s) unhealthy at $($elapsed)s - check with: docker compose ps"
            foreach ($line in $unhealthy) { Write-Host "    $line" -ForegroundColor Yellow }
        }
        if (-not $stillStarting) {
            if ($unhealthy) {
                Write-Warn "Services stopped starting but some are unhealthy ($($elapsed)s)"
            } else {
                Write-Ok "Infrastructure ready ($($elapsed)s)"
            }
            $infraReady = $true
            break
        }
        Write-Info "  Still starting... ($($elapsed)s)"
    }
    if (-not $infraReady) {
        Write-Warn "Timed out waiting for services to be healthy (150s) - continuing anyway"
        Write-Warn "Check status with: docker compose ps"
    }

    if (-not $SkipVaultSetup) {
        Write-Host ""
        Write-Step "Configuring Vault..."
        Invoke-VaultSetup
    }

    # After vault setup the app container is restarted with the new token - wait for it to pass health checks.
    Write-Host ""
    Write-Info "Waiting for app to be ready..."
    $appReady = $false
    $appLines  = @()
    for ($i = 0; $i -lt 24; $i++) {
        Start-Sleep -Seconds 5
        $prev = $ErrorActionPreference
        $ErrorActionPreference = "Continue"
        $psLines = @(& $dockerPath compose ps 2>$null)
        $ErrorActionPreference = $prev
        $appLines = @($psLines | Where-Object { $_ -match 'unievent-app' })
        $appStatus = $appLines -join " "
        if ($appStatus -match '\(healthy\)')   { Write-Ok "App is ready ($(($i + 1) * 5)s)"; $appReady = $true; break }
        if ($appStatus -match '\(unhealthy\)') { Write-Warn "App is unhealthy - check with: docker compose logs app"; break }
        Write-Info "  App starting... ($(($i + 1) * 5)s)"
    }
    if (-not $appReady -and (($appLines -join " ") -notmatch '\(unhealthy\)')) {
        Write-Warn "App did not report healthy within 120s - it may still be starting"
        Write-Warn "Check status: docker compose ps"
        Write-Warn "Check logs:   docker compose logs app"
    }
}
