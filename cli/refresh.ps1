# tools refresh [-p <id>]
# Without -p: refreshes tokens for every page (matches scheduler behavior).
# With    -p: refreshes one page only.

function Invoke-Refresh {
    param([string]$BaseUrl, [string]$Page, [switch]$VerboseOutput)

    if ($Page) {
        Write-Info "Refreshing token for page: $Page"
        $resp = Invoke-AdminRequest -Method "POST" -Url "$BaseUrl/admin/tools/refresh-tokens/$Page" -VerboseOutput:$VerboseOutput
        if ($resp.StatusCode -eq 200) {
            $body = $null
            try { $body = $resp.Body | ConvertFrom-Json } catch {}
            $msg = if ($body -and $body.message) { $body.message } else { "Token refreshed" }
            Write-Ok "Page $Page`: $msg"
            if ($VerboseOutput -and $resp.Body) { Write-Host ($body | ConvertTo-Json -Depth 5) -ForegroundColor Gray }
            return
        }
        if ($resp.StatusCode -eq 404) {
            Write-Err "Page not found: $Page"
            Write-Warn "Run './tools ingest' (or curl /admin/tools/pages) to list known page IDs"
            exit 1
        }
        # 500 or other: show what the server said
        Write-Err "Refresh failed for page $Page (status $($resp.StatusCode))"
        if ($resp.Body) { Write-Warn $resp.Body }
        exit 1
    }

    Write-Info "Refreshing tokens for all pages..."
    $resp = Invoke-AdminRequest -Method "POST" -Url "$BaseUrl/admin/tools/refresh-tokens" -VerboseOutput:$VerboseOutput

    if ($resp.StatusCode -ne 200) {
        Write-Err "Refresh failed (status $($resp.StatusCode))"
        if ($resp.Body) { Write-Warn $resp.Body }
        exit 1
    }

    try {
        $summary = $resp.Body | ConvertFrom-Json
        Write-Ok "Refresh complete: $($summary.refreshedCount) succeeded, $($summary.failedCount) failed in $($summary.durationMs)ms"
        if ($VerboseOutput) {
            Write-Host ""
            Write-Info "Response:"
            Write-Host ($summary | ConvertTo-Json -Depth 5) -ForegroundColor Gray
        }
    } catch {
        Write-Ok "Refresh completed"
        if ($resp.Body) { Write-Host $resp.Body -ForegroundColor Gray }
    }
}
