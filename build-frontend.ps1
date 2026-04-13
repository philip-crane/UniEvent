# Build the frontend and copy to Spring Boot static folder

Write-Host "Building UniEventClient frontend..." -ForegroundColor Green
Push-Location ../UniEventClient/web

# Install dependencies if needed
if (-Not (Test-Path "node_modules")) {
    Write-Host "Installing frontend dependencies..." -ForegroundColor Yellow
    npm ci
}

# Build the frontend
npm run build

# Copy built files to backend static folder
Write-Host "Copying frontend build to backend static folder..." -ForegroundColor Yellow
$staticPath = "../../UniEventServer/src/main/resources/static"
New-Item -Path $staticPath -ItemType Directory -Force | Out-Null
Remove-Item -Path "$staticPath/*" -Recurse -Force -ErrorAction SilentlyContinue
Copy-Item -Path "dist/*" -Destination $staticPath -Recurse -Force

Pop-Location
Write-Host "Frontend build complete and copied to backend!" -ForegroundColor Green
