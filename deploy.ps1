#!/usr/bin/env pwsh
param(
  [string]$Host = "154.26.155.207",
  [string]$User = "root",
  [string]$KeyPath = "$env:USERPROFILE\.ssh\id_ed25519",
  [string]$RemoteDir = "/opt/healthscribe/dashboard-next"
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

Write-Host "🚀 Healthscribe Deployment Script" -ForegroundColor Cyan
Write-Host "===================================" -ForegroundColor Cyan
Write-Host ""

# --- Step 1: SSH Key Setup ---
Write-Host "Step 1: Setting up SSH key access" -ForegroundColor Yellow

if (-not (Test-Path $KeyPath)) {
  Write-Host "  Generating SSH key..." -ForegroundColor Gray
  ssh-keygen -t ed25519 -C "omar@healthscribe" -f $KeyPath -N "" | Out-Null
  Write-Host "  ✓ SSH key generated" -ForegroundColor Green
}

Write-Host "  Installing public key on VPS..." -ForegroundColor Gray
$pubKey = Get-Content "$KeyPath.pub"
ssh -i $KeyPath "$User@$Host" @"
mkdir -p ~/.ssh
chmod 700 ~/.ssh
echo '$pubKey' >> ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys
"@ | Out-Null
Write-Host "  ✓ Public key installed" -ForegroundColor Green

# Test connection
Write-Host "  Testing SSH connection..." -ForegroundColor Gray
try {
  ssh -i $KeyPath "$User@$Host" "echo OK" | Out-Null
  Write-Host "  ✓ SSH connection OK" -ForegroundColor Green
} catch {
  Write-Host "  ✗ SSH connection failed" -ForegroundColor Red
  exit 1
}

Write-Host ""

# --- Step 2: Package and Upload ---
Write-Host "Step 2: Packaging and uploading repository" -ForegroundColor Yellow

$timestamp = Get-Date -Format "yyyyMMddHHmmss"
$Archive = "$env:TEMP\dashboard-next-$timestamp.tar.gz"

Write-Host "  Creating archive..." -ForegroundColor Gray
if (Test-Path $Archive) { Remove-Item $Archive -Force }
tar.exe --exclude='.git' `
        --exclude='node_modules' `
        --exclude='.next' `
        --exclude='.turbo' `
        --exclude='*.log' `
        --exclude='ops/logs' `
        -czf $Archive .

$archiveSize = (Get-Item $Archive).Length / 1MB
Write-Host "  ✓ Archive created: $(Split-Path $Archive -Leaf) ($([math]::Round($archiveSize))MB)" -ForegroundColor Green

Write-Host "  Uploading to VPS..." -ForegroundColor Gray
scp -i $KeyPath $Archive "$User@$Host:/tmp/" | Out-Null
Write-Host "  ✓ Upload complete" -ForegroundColor Green

Write-Host ""

# --- Step 3: Extract and Deploy ---
Write-Host "Step 3: Extracting and deploying on VPS" -ForegroundColor Yellow

$remoteArchive = "/tmp/" + (Split-Path $Archive -Leaf)
ssh -i $KeyPath "$User@$Host" @"
set -e
echo "[INFO] Extracting archive..."
mkdir -p $RemoteDir
tar -xzf $remoteArchive -C $RemoteDir
rm -f $remoteArchive
echo "[INFO] Archive extracted"

# Ensure .env exists on server
if [ -f "$RemoteDir/.env.local" ] && [ ! -f "$RemoteDir/.env" ]; then
  echo "[INFO] Copying .env.local to .env"
  cp "$RemoteDir/.env.local" "$RemoteDir/.env"
fi

# Run deploy
echo "[INFO] Starting server-side deployment..."
cd $RemoteDir
bash ops/deploy.sh
"@

if ($LASTEXITCODE -ne 0) {
  Write-Host "✗ Deployment failed" -ForegroundColor Red
  exit 1
}

Write-Host ""
Write-Host "✓ Deployment complete!" -ForegroundColor Green
Write-Host ""
Write-Host "  App URL: https://www.healthscribe.pro" -ForegroundColor Cyan
Write-Host "  n8n URL: https://n8n.healthscribe.pro" -ForegroundColor Cyan
Write-Host ""
Write-Host "  View logs on VPS:" -ForegroundColor Gray
Write-Host "  ssh -i $KeyPath $User@$Host 'tail -f /opt/healthscribe/dashboard-next/ops/logs/deploy-*.log'" -ForegroundColor Gray
Write-Host ""
