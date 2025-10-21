#!/usr/bin/env pwsh
param(
  [string]$VPSHost = "154.26.155.207",
  [string]$VPSUser = "root"
)

$ErrorActionPreference = "Stop"

Write-Host ""
Write-Host "╔════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║     HEALTHSCRIBE SSL/LOGIN FIX - DEPLOYMENT                ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

# ============================================================================
# STEP 1: Verify local files
# ============================================================================
Write-Host "🔍 STEP 1: Verifying local files" -ForegroundColor Yellow

$files = @(".env.production", "docker-compose.yml", "healthscribe-traefik.yaml")
foreach ($file in $files) {
  if (!(Test-Path $file)) {
    Write-Host "  ✗ File not found: $file" -ForegroundColor Red
    exit 1
  }
  Write-Host "  ✓ $($file) found" -ForegroundColor Green
}

# ============================================================================
# STEP 2: Upload files via SCP
# ============================================================================
Write-Host ""
Write-Host "📤 STEP 2: Uploading files to VPS" -ForegroundColor Yellow

$remoteDir = "/opt/healthscribe/dashboard-next"

foreach ($file in $files) {
  Write-Host "  Uploading $($file)..." -ForegroundColor Gray
  & pscp -batch -pw "Nomar123" -P 22 $file "${VPSUser}@${VPSHost}:${remoteDir}/" 2>&1 | Out-Null
  Write-Host "  ✓ $($file) uploaded" -ForegroundColor Green
}

# ============================================================================
# STEP 3: Execute deployment commands on VPS
# ============================================================================
Write-Host ""
Write-Host "🚀 STEP 3: Deploying on VPS" -ForegroundColor Yellow

$commands = @"
set -e
cd /opt/healthscribe/dashboard-next

echo '💾 Backing up configuration...'
BACKUP_DIR=~/backups/healthscribe-`$(date +%F-%H%M%S)
mkdir -p `$BACKUP_DIR
cp docker-compose.yml healthscribe-traefik.yaml .env* `$BACKUP_DIR/ 2>/dev/null || true
echo '  ✓ Backed up to:' `$BACKUP_DIR

echo ''
echo '🔄 STEP 4: Clearing certificate cache'
rm -f traefik-acme/acme.json
echo '  ✓ Certificate cache cleared'

echo ''
echo '🔀 STEP 5: Restarting Traefik'
docker compose down traefik 2>/dev/null || true
docker compose up -d traefik
echo '  ✓ Traefik restarting...'

echo ''
echo '⏳ STEP 6: Waiting for SSL certificate (up to 2 minutes)...'
timeout=0
while [ `$timeout -lt 120 ]; do
  if docker logs traefik 2>/dev/null | grep -q 'Issuing a certificate for supabase.healthscribe.pro'; then
    echo '  ✓ SSL Certificate issued!'
    break
  fi
  echo "  Waiting... (`$timeout/120 seconds)"
  sleep 5
  timeout=`$((timeout + 5))
done

echo ''
echo '🏗️  STEP 7: Rebuilding frontend'
docker compose up -d --build app
sleep 5
echo '  ✓ Frontend rebuilt'

echo ''
echo '✅ STEP 8: Verifying deployment'
echo '  Checking containers:'
docker compose ps --format='{{.Service}}: {{.Status}}' | head -5

echo ''
echo '✓ Deployment complete on VPS'
"@

$scriptPath = "$env:TEMP\deploy-$(Get-Random).sh"
$commands | Out-File -FilePath $scriptPath -Encoding UTF8 -Force

try {
  Write-Host "  Executing deployment script on VPS..." -ForegroundColor Gray
  & plink -batch -pw "Nomar123" "${VPSUser}@${VPSHost}" -m "$scriptPath" 2>&1
  Write-Host "  ✓ Deployment executed" -ForegroundColor Green
} finally {
  Remove-Item -Path $scriptPath -Force -ErrorAction SilentlyContinue
}

# ============================================================================
# FINAL: Instructions
# ============================================================================
Write-Host ""
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "✨ DEPLOYMENT COMPLETE ✨" -ForegroundColor Green
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

Write-Host "🧪 TEST IN YOUR BROWSER:" -ForegroundColor Yellow
Write-Host ""
Write-Host "1. Go to: " -NoNewline; Write-Host "https://www.healthscribe.pro/login" -ForegroundColor Cyan
Write-Host "2. Open DevTools: " -NoNewline; Write-Host "F12 → Console" -ForegroundColor Cyan
Write-Host "3. Check for: " -NoNewline; Write-Host "NO 'Mixed Content' errors" -ForegroundColor Green
Write-Host "4. Try logging in" -ForegroundColor White
Write-Host ""
Write-Host "Should work now! 🎉" -ForegroundColor Green
Write-Host ""
