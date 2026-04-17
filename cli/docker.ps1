# tools docker [--down] [--wipe] [-v]
# Default: start if down, rebuild + restart if already up.
# --down:  stop the stack.
# --wipe:  docker compose down -v (removes containers AND volumes). Prompts for confirmation.

function Invoke-Docker {
    param([switch]$Down, [switch]$Wipe, [switch]$VerboseOutput, [switch]$SkipVaultSetup)

    $dockerPath = Find-Executable -Name "docker" -Fallbacks $script:KnownPaths.docker
    if (-not $dockerPath) {
        Write-Err "Docker not found"
        Write-Warn "Install Docker Desktop: https://www.docker.com/products/docker-desktop"
        exit 1
    }

    if (-not (Test-DockerDaemon -DockerPath $dockerPath)) { exit 1 }

    if ($Wipe) {
        Write-Warn "This will remove all containers AND volumes (database, Vault data, media). All data will be lost."
        $answer = Read-Host "  Are you sure? [y/N]"
        if ($answer -notmatch "^[Yy]") { Write-Info "Cancelled."; return }
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

    Write-Info "Waiting for services to be healthy..."
    $elapsed = 0
    while ($elapsed -lt 90) {
        Start-Sleep -Seconds 5
        $elapsed += 5
        $prev = $ErrorActionPreference
        $ErrorActionPreference = "Continue"
        $psLines = @(& $dockerPath compose ps 2>$null)
        $ErrorActionPreference = $prev
        $stillStarting = $psLines | Where-Object { $_ -match '\(starting\)|\(health: starting\)' }
        if (-not $stillStarting) { Write-Ok "Services ready ($($elapsed)s)"; break }
        Write-Info "  Still starting... ($($elapsed)s)"
    }

    if (-not $SkipVaultSetup) {
        Write-Host ""
        Write-Step "Configuring Vault..."
        Invoke-VaultSetup
    }
}
