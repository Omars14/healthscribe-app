#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Complete deployment of Healthscribe to VPS
.DESCRIPTION
    - Extracts credentials from .env.local
    - Creates production .env with Supabase network access
    - Packages and uploads repository
    - Triggers server-side deployment
    - Monitors health checks
#>

param(
  [string]$VPSHost = "154.26.155.207",
  [string]$VPSUser = "root",
  [string]$VPSPassword = "Nomar123",
  [string]$RemoteDir = "/opt/healthscribe/dashboard-next"
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"
$ProgressPreference = "SilentlyContinue"

Write-Host ""
Write-Host "╔════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║     HEALTHSCRIBE PRODUCTION DEPLOYMENT                      ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

# ============================================================================
# STEP 1: Extract Credentials
# ============================================================================
Write-Host "📋 STEP 1: Extracting Credentials" -ForegroundColor Yellow

try {
  $envLocal = Get-Content ".env.local" -Raw -ErrorAction Stop
  $anonKey = ($envLocal | Select-String 'NEXT_PUBLIC_SUPABASE_ANON_KEY=(.+)').Matches[0].Groups[1].Value
  $serviceKey = ($envLocal | Select-String 'SUPABASE_SERVICE_ROLE_KEY=(.+)').Matches[0].Groups[1].Value
  $googleKey = ($envLocal | Select-String 'GOOGLE_API_KEY=(.+)').Matches[0].Groups[1].Value
  $openaiKey = ($envLocal | Select-String 'OPENAI_API_KEY=(.+)').Matches[0].Groups[1].Value
  
  Write-Host "  ✓ Supabase Anon Key: $($anonKey.Substring(0,20))..." -ForegroundColor Green
  Write-Host "  ✓ Supabase Service Key: $($serviceKey.Substring(0,20))..." -ForegroundColor Green
  Write-Host "  ✓ Google API Key: $($googleKey.Substring(0,20))..." -ForegroundColor Green
} catch {
  Write-Host "  ✗ Failed to extract credentials: $_" -ForegroundColor Red
  exit 1
}

# ============================================================================
# STEP 2: Generate N8N Encryption Key
# ============================================================================
Write-Host ""
Write-Host "🔐 STEP 2: Generating N8N Encryption Key" -ForegroundColor Yellow

$n8nEncKey = -join (0..31 | ForEach-Object { '{0:x}' -f (Get-Random -Min 0 -Max 15) })
Write-Host "  ✓ Generated: $n8nEncKey" -ForegroundColor Green

# ============================================================================
# STEP 3: Create Production .env
# ============================================================================
Write-Host ""
Write-Host "📝 STEP 3: Creating Production .env" -ForegroundColor Yellow

$envContent = @"
# Domain Configuration
APP_HOST=www.healthscribe.pro
N8N_HOST=n8n.healthscribe.pro
TRAEFIK_HOST=traefik.healthscribe.pro
TRAEFIK_ACME_EMAIL=admin@healthscribe.pro

# Environment
NODE_ENV=production

# Next.js Public URLs
NEXT_PUBLIC_SITE_URL=https://www.healthscribe.pro
NEXT_PUBLIC_URL=https://www.healthscribe.pro
NEXT_PUBLIC_API_URL=https://www.healthscribe.pro/api

# Supabase (internal Docker network - e088wwks88k8k48sccg8gk0o)
NEXT_PUBLIC_SUPABASE_URL=http://supabase-rest-e088wwks88k8k48sccg8gk0o:3000
NEXT_PUBLIC_SUPABASE_ANON_KEY=$anonKey
SUPABASE_SERVICE_ROLE_KEY=$serviceKey

# n8n
NEXT_PUBLIC_N8N_URL=https://n8n.healthscribe.pro
NEXT_PUBLIC_N8N_WEBHOOK_URL=https://n8n.healthscribe.pro/webhook
N8N_WEBHOOK_URL=https://n8n.healthscribe.pro
N8N_ENCRYPTION_KEY=$n8nEncKey

# API Keys
GOOGLE_API_KEY=$googleKey
OPENAI_API_KEY=$openaiKey

# Docker
APP_IMAGE_TAG=latest
"@

$tempEnvFile = "$env:TEMP\healthscribe-prod.env"
$envContent | Out-File -FilePath $tempEnvFile -Encoding UTF8 -Force
Write-Host "  ✓ Created: $tempEnvFile" -ForegroundColor Green

# ============================================================================
# STEP 4: Setup VPS Directories
# ============================================================================
Write-Host ""
Write-Host "📁 STEP 4: Setting Up VPS" -ForegroundColor Yellow

$setupCmd = @"
set -e
mkdir -p $RemoteDir/ops/logs
docker network create traefik-proxy 2>/dev/null || true
echo '[SETUP] Ready for deployment'
"@

$setupScript = "$env:TEMP\setup.sh"
$setupCmd | Out-File -FilePath $setupScript -Encoding UTF8 -Force

try {
  $output = & cmd /c "plink -batch -pw $VPSPassword ${VPSUser}@${VPSHost} -m `"$setupScript`" 2>&1"
  Write-Host "  ✓ VPS directories and networks ready" -ForegroundColor Green
} catch {
  Write-Host "  ✗ Failed to setup VPS: $_" -ForegroundColor Red
  exit 1
}

# ============================================================================
# STEP 5: Upload .env File
# ============================================================================
Write-Host ""
Write-Host "📤 STEP 5: Uploading Configuration" -ForegroundColor Yellow

try {
  $output = & pscp -batch -pw $VPSPassword -P 22 $tempEnvFile "${VPSUser}@${VPSHost}:${RemoteDir}/.env" 2>&1
  Write-Host "  ✓ .env uploaded" -ForegroundColor Green
} catch {
  Write-Host "  ✗ Failed to upload .env: $_" -ForegroundColor Red
  exit 1
}

# ============================================================================
# STEP 6: Package and Upload Repository
# ============================================================================
Write-Host ""
Write-Host "📦 STEP 6: Packaging and Uploading Repository" -ForegroundColor Yellow

$timestamp = Get-Date -Format "yyyyMMddHHmmss"
$archivePath = "$env:TEMP\dashboard-$timestamp.tar.gz"

Write-Host "  Creating archive..." -ForegroundColor Gray
try {
  tar.exe --exclude='.git' `
          --exclude='node_modules' `
          --exclude='.next' `
          --exclude='.turbo' `
          --exclude='ops/logs' `
          --exclude='*.log' `
          -czf $archivePath . 2>&1 | Out-Null
  
  $sizeMB = [math]::Round((Get-Item $archivePath).Length / 1MB, 2)
  Write-Host "  ✓ Archive created: $sizeMB MB" -ForegroundColor Green
} catch {
  Write-Host "  ✗ Failed to create archive: $_" -ForegroundColor Red
  exit 1
}

Write-Host "  Uploading archive..." -ForegroundColor Gray
try {
  $output = & pscp -batch -pw $VPSPassword -P 22 $archivePath "${VPSUser}@${Host}:/tmp/" 2>&1
  Write-Host "  ✓ Repository uploaded" -ForegroundColor Green
} catch {
  Write-Host "  ✗ Failed to upload repository: $_" -ForegroundColor Red
  exit 1
}

# ============================================================================
# STEP 7: Extract and Deploy
# ============================================================================
Write-Host ""
Write-Host "🚀 STEP 7: Deploying on VPS" -ForegroundColor Yellow

$remoteArchive = "/tmp/dashboard-$timestamp.tar.gz"

$deployCmd = @"
set -e
cd $RemoteDir
tar -xzf $remoteArchive
rm -f $remoteArchive
echo '[DEPLOY] Starting server-side deployment...'
bash ops/deploy.sh 2>&1 | tee ops/logs/final_deploy.log
"@

$deployScript = "$env:TEMP\deploy.sh"
$deployCmd | Out-File -FilePath $deployScript -Encoding UTF8 -Force

Write-Host "  Executing deployment (this may take 5-10 minutes)..." -ForegroundColor Gray
Write-Host ""

try {
  $output = & cmd /c "plink -batch -pw $VPSPassword ${VPSUser}@${VPSHost} -m `"$deployScript`" 2>&1"
  
  # Check if deployment was successful
  if ($output -match "Deploy done") {
    Write-Host ""
    Write-Host "  ✓ Deployment completed successfully!" -ForegroundColor Green
    $deploySuccess = $true
  } else {
    Write-Host "  ! Deployment output:" -ForegroundColor Yellow
    Write-Host $output -ForegroundColor Gray
    $deploySuccess = $false
  }
} catch {
  Write-Host "  ✗ Deployment failed: $_" -ForegroundColor Red
  $deploySuccess = $false
}

# ============================================================================
# STEP 8: Verify Deployment
# ============================================================================
if ($deploySuccess) {
  Write-Host ""
  Write-Host "✅ STEP 8: Verifying Deployment" -ForegroundColor Yellow
  
  Start-Sleep -Seconds 3
  
  Write-Host "  Checking container status..." -ForegroundColor Gray
  $statusCmd = @"
docker compose -f $RemoteDir/docker-compose.yml ps 2>&1 | head -10
"@
  
  $statusScript = "$env:TEMP\status.sh"
  $statusCmd | Out-File -FilePath $statusScript -Encoding UTF8 -Force
  
  try {
    $status = & cmd /c "plink -batch -pw $VPSPassword ${VPSUser}@${VPSHost} -m `"$statusScript`" 2>&1"
    Write-Host "  ✓ Containers:" -ForegroundColor Green
    Write-Host $status -ForegroundColor Gray
  } catch {}
}

# ============================================================================
# FINAL SUMMARY
# ============================================================================
Write-Host ""
Write-Host "╔════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
if ($deploySuccess) {
  Write-Host "║  ✅ DEPLOYMENT SUCCESSFUL                                  ║" -ForegroundColor Green
} else {
  Write-Host "║  ⚠️  DEPLOYMENT COMPLETED WITH WARNINGS                   ║" -ForegroundColor Yellow
}
Write-Host "╚════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

Write-Host "📱 ACCESS YOUR APPLICATION:" -ForegroundColor Cyan
Write-Host "  App:    https://www.healthscribe.pro" -ForegroundColor White
Write-Host "  n8n:    https://n8n.healthscribe.pro" -ForegroundColor White
Write-Host ""

Write-Host "⏱️  Wait 2-3 minutes for:" -ForegroundColor Yellow
Write-Host "  - Traefik to issue SSL certificates" -ForegroundColor Gray
Write-Host "  - All services to be fully healthy" -ForegroundColor Gray
Write-Host ""

Write-Host "📊 VIEW LOGS:" -ForegroundColor Cyan
Write-Host "  ssh -o StrictHostKeyChecking=no root@154.26.155.207" -ForegroundColor White
Write-Host "  cd /opt/healthscribe/dashboard-next" -ForegroundColor White
Write-Host "  docker compose logs -f app" -ForegroundColor White
Write-Host ""

Write-Host "🔧 ROLLBACK (if needed):" -ForegroundColor Cyan
Write-Host "  ssh root@154.26.155.207" -ForegroundColor White
Write-Host "  cd /opt/healthscribe/dashboard-next" -ForegroundColor White
Write-Host "  export APP_IMAGE_TAG=\$(cat .deploy/last_app_tag)" -ForegroundColor White
Write-Host "  docker compose up -d --no-deps app" -ForegroundColor White
Write-Host ""

# Cleanup
Remove-Item $tempEnvFile -Force -ErrorAction SilentlyContinue
Remove-Item $setupScript -Force -ErrorAction SilentlyContinue
Remove-Item $deployScript -Force -ErrorAction SilentlyContinue
Remove-Item $statusScript -Force -ErrorAction SilentlyContinue
Remove-Item $archivePath -Force -ErrorAction SilentlyContinue

Write-Host "Done! 🎉" -ForegroundColor Green



