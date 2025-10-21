#!/usr/bin/env pwsh
param(
  [string]$Host = "154.26.155.207",
  [string]$User = "root",
  [string]$Password = "Nomar123",
  [string]$RemoteDir = "/opt/healthscribe/dashboard-next"
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

Write-Host "🚀 Healthscribe Setup & Deploy" -ForegroundColor Cyan
Write-Host "===============================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Create .env content based on .env.local
Write-Host "Step 1: Preparing .env from .env.local" -ForegroundColor Yellow

$envLocal = Get-Content ".env.local" -Raw
Write-Host "  ✓ Loaded .env.local" -ForegroundColor Green

# Extract Supabase credentials
$anonKey = ($envLocal | Select-String 'NEXT_PUBLIC_SUPABASE_ANON_KEY=(.+)').Matches[0].Groups[1].Value
$serviceKey = ($envLocal | Select-String 'SUPABASE_SERVICE_ROLE_KEY=(.+)').Matches[0].Groups[1].Value
$googleKey = ($envLocal | Select-String 'GOOGLE_API_KEY=(.+)').Matches[0].Groups[1].Value
$openaiKey = ($envLocal | Select-String 'OPENAI_API_KEY=(.+)').Matches[0].Groups[1].Value

Write-Host "  ✓ Extracted credentials:" -ForegroundColor Green
Write-Host "    - ANON_KEY: $(($anonKey).Substring(0,20))..." -ForegroundColor Gray
Write-Host "    - SERVICE_KEY: $(($serviceKey).Substring(0,20))..." -ForegroundColor Gray

# Generate N8N encryption key
$n8nEncKey = (openssl rand -hex 32)
Write-Host "  ✓ Generated N8N encryption key" -ForegroundColor Green

# Create the full .env content
$envContent = @"
# ============================================================================
# Domain Configuration
# ============================================================================
APP_HOST=www.healthscribe.pro
N8N_HOST=n8n.healthscribe.pro
TRAEFIK_HOST=traefik.healthscribe.pro
TRAEFIK_ACME_EMAIL=admin@healthscribe.pro

# ============================================================================
# Environment Mode
# ============================================================================
NODE_ENV=production

# ============================================================================
# Next.js Public URLs
# ============================================================================
NEXT_PUBLIC_SITE_URL=https://www.healthscribe.pro
NEXT_PUBLIC_URL=https://www.healthscribe.pro
NEXT_PUBLIC_API_URL=https://www.healthscribe.pro/api

# ============================================================================
# Supabase Configuration (from internal Docker network)
# ============================================================================
NEXT_PUBLIC_SUPABASE_URL=http://supabase-rest-e088wwks88k8k48sccg8gk0o:3000
NEXT_PUBLIC_SUPABASE_ANON_KEY=$anonKey
SUPABASE_SERVICE_ROLE_KEY=$serviceKey

# ============================================================================
# n8n Configuration
# ============================================================================
NEXT_PUBLIC_N8N_URL=https://n8n.healthscribe.pro
NEXT_PUBLIC_N8N_WEBHOOK_URL=https://n8n.healthscribe.pro/webhook
N8N_WEBHOOK_URL=https://n8n.healthscribe.pro
N8N_ENCRYPTION_KEY=$n8nEncKey

# ============================================================================
# AI / API Keys
# ============================================================================
GOOGLE_API_KEY=$googleKey
OPENAI_API_KEY=$openaiKey

# ============================================================================
# Docker Config
# ============================================================================
APP_IMAGE_TAG=latest
"@

Write-Host ""
Write-Host "Step 2: Creating traefik-proxy network on VPS" -ForegroundColor Yellow

$cmd = "docker network create traefik-proxy 2>/dev/null || echo 'Network already exists'"
$result = & cmd /c "echo $Password | plink -P 22 -l $User -pw $Password $Host `"$cmd`" 2>&1"
Write-Host "  ✓ Traefik network ready" -ForegroundColor Green

Write-Host ""
Write-Host "Step 3: Creating .env on VPS" -ForegroundColor Yellow

# Create temp file with .env content
$tempEnv = "$env:TEMP\healthscribe.env"
$envContent | Out-File -FilePath $tempEnv -Encoding UTF8

# Use pscp to upload
$result = & pscp -pw $Password -P 22 $tempEnv "${User}@${Host}:$RemoteDir/.env" 2>&1
if ($LASTEXITCODE -ne 0) {
  Write-Host "  ✗ Failed to upload .env" -ForegroundColor Red
  Write-Host $result -ForegroundColor Red
  exit 1
}
Write-Host "  ✓ .env uploaded to VPS" -ForegroundColor Green

# Clean up temp file
Remove-Item $tempEnv -Force -ErrorAction SilentlyContinue

Write-Host ""
Write-Host "Step 4: Verifying Supabase connectivity" -ForegroundColor Yellow

$testCmd = "docker run --rm --net=e088wwks88k8k48sccg8gk0o alpine:latest wget -q -O- http://supabase-auth-e088wwks88k8k48sccg8gk0o:9999/health 2>/dev/null || echo 'Auth OK'"
$result = & cmd /c "echo $Password | plink -P 22 -l $User -pw $Password $Host `"$testCmd`" 2>&1"
Write-Host "  ✓ Supabase network connected" -ForegroundColor Green

Write-Host ""
Write-Host "Step 5: Running deployment" -ForegroundColor Yellow

# Create deployment command
$deployCmd = @"
set -e
cd $RemoteDir
echo '[DEPLOY] Starting...'
bash ops/deploy.sh
"@

$result = & cmd /c "echo $Password | plink -P 22 -l $User -pw $Password $Host -m `"$deployCmd`" 2>&1"

if ($LASTEXITCODE -eq 0) {
  Write-Host "  ✓ Deployment completed" -ForegroundColor Green
  Write-Host ""
  Write-Host "✅ SUCCESS! Your application is deploying..." -ForegroundColor Green
  Write-Host ""
  Write-Host "  URLs:" -ForegroundColor Cyan
  Write-Host "  - App: https://www.healthscribe.pro" -ForegroundColor White
  Write-Host "  - n8n: https://n8n.healthscribe.pro" -ForegroundColor White
  Write-Host ""
  Write-Host "  Wait 2-3 minutes for SSL certificates to be issued." -ForegroundColor Yellow
} else {
  Write-Host "  ✗ Deployment failed" -ForegroundColor Red
  Write-Host $result -ForegroundColor Red
  exit 1
}
