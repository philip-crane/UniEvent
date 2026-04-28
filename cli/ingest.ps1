# tools ingest [-p <id>]
# Without -p: hits /admin/tools/pages, renders numbered picker, ingests selected.
# With    -p: skips the picker, ingests that page directly.

# CLI tool for ingestion of events, i.e. transferring events from facebook page to DB. 


# helper function for getting pages
function Get-PageList {
    param([string]$BaseUrl, [switch]$VerboseOutput)

    $BaseUrl = Assert-ValidBaseUrl -BaseUrl $BaseUrl # in cli/shared.ps1
    # NB: this is an admin endpoint, so we gotta check admin token. We have a helper for that
    $resp = Invoke-AdminRequest -Method "GET" -Url "$BaseUrl/admin/tools/pages" -VerboseOutput:$VerboseOutput
    if ($resp.StatusCode -ne 200) { # if it aint 200 = not ok, bail with error
        Write-Err "Could not list pages (status $($resp.StatusCode))"
        if ($resp.Body) { Write-Warn (Redact-SensitiveText -Text $resp.Body) }
        exit 1 # we dip
    }
    # if its 200 = ok, we deserialize and pray to the JSON gods that the format is correct
    try {
        return @($resp.Body | ConvertFrom-Json)
    } catch {
        Write-Err "Could not parse pages response"
        # make sure to redact any sensitive info from body before printing, just in case
        if ($resp.Body) { Write-Warn (Redact-SensitiveText -Text $resp.Body) }
        exit 1 # we dip once more.
    }
}

# another helper function for page selection. A little overboard but it looks nice tho
function Select-PageInteractive {
    # we save the pages as params and also verbose flag.
    param([object[]]$Pages, [switch]$VerboseOutput)

    # if no pages...
    if ($Pages.Count -eq 0) {
        Write-Err "No pages are tracked on this server."
        Write-Warn "Seed some test pages with './tools seed', or onboard a real Facebook page via the app."
        exit 1 # ...we dip twice more
    }

    Write-Host "" # just a lil spacing 
    Write-Host "  Pages:" -ForegroundColor Cyan # header

    # print out all the pages with
    for ($i = 0; $i -lt $Pages.Count; $i++) {
        $p = $Pages[$i] # 
        $n = $i + 1 # number (+1 for of-by-one errs)
        $status = if ($p.tokenStatus) { $p.tokenStatus } else { "unknown" } # status (with fallback)
        $days = if ($null -ne $p.tokenExpiresInDays) { "expires in $($p.tokenExpiresInDays) days" } else { "no expiry info" }
        $label = "{0,3}. {1,-40} ({2}, {3})" -f $n, $p.name, $status, $days # format it nicely with fixed-width fields
        Write-Host "  $label" -ForegroundColor Gray
        if ($VerboseOutput) { Write-Host "       id: $($p.id)" -ForegroundColor DarkGray }
    }
    Write-Host ""

    # select page by number
    while ($true) {
        $answer = Read-Host "  Select page [1-$($Pages.Count)] (or q to quit)"
        if ($answer -eq "q" -or $answer -eq "Q") {
            Write-Info "Cancelled."
            exit 0
        }
        $n = 0 # default value for TryParse
        if ([int]::TryParse($answer, [ref]$n) -and $n -ge 1 -and $n -le $Pages.Count) {
            return $Pages[$n - 1]
        }
        Write-Warn "Invalid selection. Enter a number between 1 and $($Pages.Count)."
    }
}

# this is the actual ingestion function.
function Invoke-Ingest {
    # save the params: BaseUrl, Page, verbose flag
    param([string]$BaseUrl, [string]$Page, [switch]$VerboseOutput)

    # start by making it work on localhost
    $BaseUrl = Assert-ValidBaseUrl -BaseUrl $BaseUrl

    $pageId = $Page
    $pageName = $Page

    # if no page id provided, fetch pages and ask user to select one
    if (-not $pageId) {
        Write-Info "Fetching tracked pages..."
        $pages = @(Get-PageList -BaseUrl $BaseUrl -VerboseOutput:$VerboseOutput)
        $chosen = Select-PageInteractive -Pages $pages -VerboseOutput:$VerboseOutput
        $pageId = $chosen.id
        $pageName = "$($chosen.name) ($pageId)"
    }

    # now we have a page id (either from param or user selection), we can call the ingest endpoint for that page.
    Write-Info "Ingesting events for page: $pageName"
    $encodedPageId = [System.Uri]::EscapeDataString("$pageId")
    $resp = Invoke-AdminRequest -Method "POST" -Url "$BaseUrl/admin/tools/ingest/$encodedPageId" -VerboseOutput:$VerboseOutput

    # handle responses with some nice messages. We redact any sensitive info from the body just in case, before printing.
    switch ($resp.StatusCode) {
        200 { # = ok
            $body = $null

            # if ok, pray to JSON gods that we can parse the body.
            try { $body = $resp.Body | ConvertFrom-Json } catch {}
            if ($body) {
                Write-Ok "Ingested $($body.eventCount) event(s) for page $pageId"
                # if we got event titles back and verbose flag is on, print them out in a nice list
                if ($VerboseOutput -and $body.eventTitles -and $body.eventTitles.Count -gt 0) {
                    Write-Host ""
                    Write-Info "Events:"
                    foreach ($t in $body.eventTitles) { Write-Host "    - $t" -ForegroundColor Gray }
                }
            } else {
                Write-Ok "Ingest completed"
                if ($resp.Body) { Write-Host $resp.Body -ForegroundColor Gray }
            }
        }
        # handle various other status with err messages
        404 {
            Write-Err "Page not found: $pageId"
            exit 1
        }
        502 {
            Write-Err "Facebook API error (502)"
            if ($resp.Body) { Write-Warn (Redact-SensitiveText -Text $resp.Body) }
            exit 1
        }
        500 {
            Write-Err "Server error during ingest (500)"
            if ($resp.Body) { Write-Warn (Redact-SensitiveText -Text $resp.Body) }
            exit 1
        }
        default {
            Write-Err "Unexpected response: $($resp.StatusCode)"
            if ($resp.Body) { Write-Warn (Redact-SensitiveText -Text $resp.Body) }
            exit 1
        }
    }
}
