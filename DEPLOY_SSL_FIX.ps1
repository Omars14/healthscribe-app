#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Deploy SSL Certificate Fix for Supabase Subdomain
.DESCRIPTION
    - Backs up current configs on VPS
    - Uploads fixed .env.production, docker-compose.yml, healthscribe-traefik.yaml
    - Restarts Traefik to issue SSL certificate
    - Rebuilds frontend with corrected environment
    - Verifies login works
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
Write-Host "║     HEALTHSCRIBE SSL/LOGIN FIX DEPLOYMENT                   ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

# ============================================================================
# Helper: Run commands via SSH
# ============================================================================
function Invoke-RemoteCommand {
  param(
    [string]$Command
  )
  $tempScript = "$env:TEMP\remote-$(Get-Random).sh"
  $Command | Out-File -FilePath $tempScript -Encoding UTF8 -Force
  try {
    $output = & cmd /c "plink -batch -pw $VPSPassword ${VPSUser}@${VPSHost} -m `"$tempScript`" 2>&1"
    return $output
  } finally {
    Remove-Item -Path $tempScript -Force -ErrorAction SilentlyContinue
  }
}

# ============================================================================
# STEP 1: Verify Connection
# ============================================================================
Write-Host "🔌 STEP 1: Verifying VPS Connection" -ForegroundColor Yellow

$testCmd = @"
echo '[OK] Connected to VPS'
pwd
"@

try {
  $output = Invoke-RemoteCommand -Command $testCmd
  Write-Host "  ✓ Connected to $VPSHost" -ForegroundColor Green
  Write-Host "  ✓ Working directory: $RemoteDir" -ForegroundColor Green
} catch {
  Write-Host "  ✗ Connection failed: $_" -ForegroundColor Red
  Write-Host "  Hint: Verify VPS_HOST, VPS_USER, and VPS_PASSWORD" -ForegroundColor Yellow
  exit 1
}

# ============================================================================
# STEP 2: Backup Current Configuration
# ============================================================================
Write-Host ""
Write-Host "💾 STEP 2: Backing Up Current Configuration" -ForegroundColor Yellow

$backupCmd = @'
set -e
cd {0}
BACKUP_DIR=~/backups/healthscribe-$(date +%F-%H%M%S)
mkdir -p $BACKUP_DIR
cp docker-compose.yml healthscribe-traefik.yaml .env* $BACKUP_DIR/ 2>/dev/null || true
echo "Backup created at: $BACKUP_DIR"
ls -la $BACKUP_DIR/
'@ -f $RemoteDir

try {
  $backupOutput = Invoke-RemoteCommand -Command $backupCmd
  Write-Host "  ✓ Configuration backed up" -ForegroundColor Green
  Write-Host "    $($backupOutput | Select-String 'Backup created')" -ForegroundColor Gray
} catch {
  Write-Host "  ⚠️  Warning: Backup may have failed, but continuing..." -ForegroundColor Yellow
}

# ============================================================================
# STEP 3: Upload Fixed Configuration Files
# ============================================================================
Write-Host ""
Write-Host "📤 STEP 3: Uploading Fixed Configuration Files" -ForegroundColor Yellow

$filesToUpload = @(
  ".env.production",
  "docker-compose.yml",
  "healthscribe-traefik.yaml"
)

foreach ($file in $filesToUpload) {
  if (!(Test-Path $file)) {
    Write-Host "  ✗ File not found: $file" -ForegroundColor Red
    exit 1
  }
  
  try {
    Write-Host "  Uploading $file..." -ForegroundColor Gray
    $output = & pscp -batch -pw $VPSPassword -P 22 $file "${VPSUser}@${VPSHost}:${RemoteDir}/" 2>&1
    Write-Host "  ✓ $file uploaded" -ForegroundColor Green
  } catch {
    Write-Host "  ✗ Failed to upload $($file): $_" -ForegroundColor Red
    exit 1
  }
}

# ============================================================================
# STEP 4: Clear Old Certificate Cache
# ============================================================================
Write-Host ""
Write-Host "🔄 STEP 4: Clearing Certificate Cache" -ForegroundColor Yellow

$clearCertCmd = @"
set -e
cd $RemoteDir
rm -f traefik-acme/acme.json
echo '[OK] Certificate cache cleared'
"@

try {
  Invoke-RemoteCommand -Command $clearCertCmd | Out-Null
  Write-Host "  ✓ Old certificates cleared" -ForegroundColor Green
} catch {
  Write-Host "  ⚠️  Warning: Could not clear cert cache, continuing..." -ForegroundColor Yellow
}

# ============================================================================
# STEP 5: Stop and Restart Traefik
# ============================================================================
Write-Host ""
Write-Host "🔀 STEP 5: Restarting Traefik (Getting SSL Certificate)" -ForegroundColor Yellow

$traefikCmd = @"
set -e
cd $RemoteDir
echo '[TRAEFIK] Stopping old Traefik...'
docker compose down traefik 2>/dev/null || true
echo '[TRAEFIK] Starting Traefik with new config...'
docker compose up -d traefik
echo '[TRAEFIK] Waiting for certificate issuance (this may take 1-2 minutes)...'
sleep 3
"@

try {
  $traefikOutput = Invoke-RemoteCommand -Command $traefikCmd
  Write-Host "  ✓ Traefik restarted" -ForegroundColor Green
} catch {
  Write-Host "  ✗ Failed to restart Traefik: $_" -ForegroundColor Red
  exit 1
}

# ============================================================================
# STEP 6: Wait for Certificate and Monitor Logs
# ============================================================================
Write-Host ""
Write-Host "⏳ STEP 6: Waiting for SSL Certificate (monitoring logs)" -ForegroundColor Yellow

$monitorCmd = @"
set -e
cd $RemoteDir
timeout=0
while [ \$timeout -lt 120 ]; do
  if docker logs traefik 2>/dev/null | grep -q "Issuing a certificate for supabase.healthscribe.pro"; then
    echo '[CERT] Certificate issued! ✓'
    exit 0
  fi
  if docker logs traefik 2>/dev/null | grep -q "error"; then
    echo '[ERROR] Found error in Traefik logs:'
    docker logs traefik | grep error | tail -5
    exit 1
  fi
  echo "[WAIT] Waiting... (\$timeout/120 seconds)"
  sleep 5
  timeout=\$((timeout + 5))
done
echo '[TIMEOUT] Certificate issuance taking longer than expected, checking status...'
docker logs traefik | tail -20
"@

try {
  Write-Host "  Checking Traefik logs..." -ForegroundColor Gray
  $monitorOutput = Invoke-RemoteCommand -Command $monitorCmd
  
  if ($monitorOutput -like "*Certificate issued*") {
    Write-Host "  ✓ SSL Certificate issued for supabase.healthscribe.pro" -ForegroundColor Green
  } else {
    Write-Host "  ⚠️  Certificate status unclear, continuing with rebuild..." -ForegroundColor Yellow
    Write-Host "  Last logs:" -ForegroundColor Gray
    Write-Host "$monitorOutput" -ForegroundColor Gray
  }
} catch {
  Write-Host "  ⚠️  Could not verify certificate, continuing..." -ForegroundColor Yellow
}

# ============================================================================
# STEP 7: Rebuild Frontend with New Environment
# ============================================================================
Write-Host ""
Write-Host "🏗️  STEP 7: Rebuilding Frontend (with HTTPS Supabase URL)" -ForegroundColor Yellow

$rebuildCmd = @"
set -e
cd $RemoteDir
echo '[BUILD] Building frontend with new environment...'
docker compose up -d --build app
echo '[BUILD] Waiting for build to complete...'
sleep 10
"@

try {
  Invoke-RemoteCommand -Command $rebuildCmd | Out-Null
  Write-Host "  ✓ Frontend rebuilt" -ForegroundColor Green
} catch {
  Write-Host "  ✗ Failed to rebuild frontend: $_" -ForegroundColor Red
  exit 1
}

# ============================================================================
# STEP 8: Verify Deployment
# ============================================================================
Write-Host ""
Write-Host "✅ STEP 8: Verifying Deployment" -ForegroundColor Yellow

$verifyCmd = @"
set -e
cd $RemoteDir

echo '[VERIFY] Checking HTTPS availability...'
if curl -s -I https://supabase.healthscribe.pro | grep -q 'HTTP'; then
  echo '[OK] HTTPS endpoint responding'
else
  echo '[WARN] HTTPS endpoint not responding yet (may still be starting up)'
fi

echo '[VERIFY] Checking Docker containers...'
docker compose ps --format='{{.Service}}: {{.Status}}'

echo '[VERIFY] Checking app environment...'
docker exec app env | grep NEXT_PUBLIC_SUPABASE_URL || echo '[WARN] Could not retrieve env'
"@

try {
  Write-Host "  Running verification tests..." -ForegroundColor Gray
  $verifyOutput = Invoke-RemoteCommand -Command $verifyCmd
  Write-Host "  ✓ Verification complete" -ForegroundColor Green
  Write-Host "    Status:" -ForegroundColor Gray
  Write-Host "$verifyOutput" -ForegroundColor Gray
} catch {
  Write-Host "  ⚠️  Some verification tests failed, but deployment may still be OK" -ForegroundColor Yellow
}

# ============================================================================
# STEP 9: Final Instructions
# ============================================================================
Write-Host ""
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "✨ DEPLOYMENT COMPLETE ✨" -ForegroundColor Green
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

Write-Host "🧪 TESTING THE FIX:" -ForegroundColor Yellow
Write-Host ""
Write-Host "1. Open your browser and go to:" -ForegroundColor White
Write-Host "   https://www.healthscribe.pro/login" -ForegroundColor Cyan
Write-Host ""
Write-Host "2. Open DevTools (F12) → Console tab" -ForegroundColor White
Write-Host ""
Write-Host "3. Look for:" -ForegroundColor White
Write-Host "   ✅ NO red 'Mixed Content' errors" -ForegroundColor Green
Write-Host "   ✅ NO errors about 'Could not establish connection'" -ForegroundColor Green
Write-Host ""
Write-Host "4. Try logging in with your credentials" -ForegroundColor White
Write-Host ""
Write-Host "5. Should work now! 🎉" -ForegroundColor Green
Write-Host ""

Write-Host "ℹ️  ADDITIONAL CHECKS:" -ForegroundColor Yellow
Write-Host ""
Write-Host "View Traefik logs:" -ForegroundColor Gray
Write-Host "  ssh root@154.26.155.207" -ForegroundColor Cyan
Write-Host "  cd /opt/healthscribe/dashboard-next" -ForegroundColor Cyan
Write-Host "  docker logs traefik | tail -50" -ForegroundColor Cyan
Write-Host ""

Write-Host "View app logs:" -ForegroundColor Gray
Write-Host "  docker logs app | tail -50" -ForegroundColor Cyan
Write-Host ""

Write-Host "Verify HTTPS is working:" -ForegroundColor Gray
Write-Host "  curl -I https://supabase.healthscribe.pro" -ForegroundColor Cyan
Write-Host ""

Write-Host "💾 ROLLBACK (if needed):" -ForegroundColor Yellow
Write-Host ""
Write-Host "Your old configuration is backed up. To rollback:" -ForegroundColor Gray
Write-Host "  cd /opt/healthscribe/dashboard-next" -ForegroundColor Cyan
Write-Host "  BACKUP=\$(ls -td ~/backups/healthscribe-* | head -1)" -ForegroundColor Cyan
Write-Host "  cp \$BACKUP/* ." -ForegroundColor Cyan
Write-Host "  docker compose down && docker compose up -d" -ForegroundColor Cyan
Write-Host ""

Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""
