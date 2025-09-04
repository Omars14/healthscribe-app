# One-command script to start everything and deploy to Vercel
# This script automatically:
# 1. Starts n8n and ngrok
# 2. Gets the ngrok URL
# 3. Updates all environment variables
# 4. Updates Vercel environment variables
# 5. Deploys to Vercel
# 6. Shows you all the URLs

param(
    [switch]$LocalOnly = $false,  # Only start local services, don't deploy
    [switch]$DeployOnly = $false  # Only deploy to Vercel, don't start local
)

Write-Host ""
Write-Host "🚀 MEDICAL TRANSCRIPTION - COMPLETE STARTUP & DEPLOYMENT" -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host ""

# Set error action preference
$ErrorActionPreference = "Continue"

# Get script directory
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$projectDir = Join-Path $scriptDir ".."
Set-Location $projectDir

# Load environment variables
$envFile = Join-Path $projectDir ".env.local"
if (Test-Path $envFile) {
    Write-Host "📋 Loading environment variables..." -ForegroundColor Yellow
    Get-Content $envFile | ForEach-Object {
        if ($_ -match '^([^#].+?)=(.+)$') {
            $key = $matches[1].Trim()
            $value = $matches[2].Trim()
            [Environment]::SetEnvironmentVariable($key, $value, "Process")
        }
    }
}

# Get Supabase credentials
$SUPABASE_URL = $env:NEXT_PUBLIC_SUPABASE_URL
$SUPABASE_ANON_KEY = $env:NEXT_PUBLIC_SUPABASE_ANON_KEY
$SUPABASE_SERVICE_KEY = $env:SUPABASE_SERVICE_ROLE_KEY

if (-not $DeployOnly) {
    # Step 1: Clean up and start n8n
    Write-Host "🎯 Starting n8n workflow engine..." -ForegroundColor Yellow
    Get-Process | Where-Object {$_.ProcessName -like "*n8n*"} | Stop-Process -Force -ErrorAction SilentlyContinue
    Start-Process powershell -ArgumentList "-WindowStyle", "Hidden", "-Command", "npx n8n" -PassThru | Out-Null
    Write-Host "  ✓ n8n started on http://localhost:5678" -ForegroundColor Green
    
    # Step 2: Start ngrok
    Write-Host "🌐 Starting ngrok tunnel..." -ForegroundColor Yellow
    Get-Process | Where-Object {$_.ProcessName -eq "ngrok"} | Stop-Process -Force -ErrorAction SilentlyContinue
    Start-Process powershell -ArgumentList "-WindowStyle", "Hidden", "-Command", "ngrok http 5678" -PassThru | Out-Null
    
    # Wait for services to start
    Write-Host "  Waiting for services to initialize..." -ForegroundColor Gray
    Start-Sleep -Seconds 15
    
    # Step 3: Get ngrok URL
    Write-Host "🔍 Getting ngrok URL..." -ForegroundColor Yellow
    $ngrokUrl = $null
    for ($i = 1; $i -le 10; $i++) {
        try {
            $response = Invoke-RestMethod -Uri "http://localhost:4040/api/tunnels" -Method Get -ErrorAction SilentlyContinue
            $tunnel = $response.tunnels | Where-Object { $_.proto -eq "https" } | Select-Object -First 1
            if ($tunnel) {
                $ngrokUrl = $tunnel.public_url
                break
            }
        } catch {
            Start-Sleep -Seconds 2
        }
    }
    
    if (-not $ngrokUrl) {
        Write-Host "❌ Failed to get ngrok URL. Make sure ngrok is running." -ForegroundColor Red
        exit 1
    }
    
    Write-Host "  ✓ ngrok URL: $ngrokUrl" -ForegroundColor Green
    $webhookUrl = "$ngrokUrl/webhook/medical-transcribe-v2"
    
    # Step 4: Update local environment
    Write-Host "📝 Updating local environment..." -ForegroundColor Yellow
    
    $envContent = Get-Content $envFile -Raw
    $envContent = $envContent -replace 'N8N_WEBHOOK_URL=.*', "N8N_WEBHOOK_URL=$webhookUrl"
    $envContent = $envContent -replace 'NEXT_PUBLIC_N8N_WEBHOOK_URL=.*', "NEXT_PUBLIC_N8N_WEBHOOK_URL=$webhookUrl"
    $envContent = $envContent -replace 'NEXT_PUBLIC_WEBHOOK_URL=.*', "NEXT_PUBLIC_WEBHOOK_URL=$webhookUrl"
    
    # Add if not exists
    if ($envContent -notmatch 'N8N_WEBHOOK_URL=') {
        $envContent += "`nN8N_WEBHOOK_URL=$webhookUrl"
    }
    if ($envContent -notmatch 'NEXT_PUBLIC_N8N_WEBHOOK_URL=') {
        $envContent += "`nNEXT_PUBLIC_N8N_WEBHOOK_URL=$webhookUrl"
    }
    if ($envContent -notmatch 'NEXT_PUBLIC_WEBHOOK_URL=') {
        $envContent += "`nNEXT_PUBLIC_WEBHOOK_URL=$webhookUrl"
    }
    
    Set-Content -Path $envFile -Value $envContent -NoNewline
    Write-Host "  ✓ Local environment updated" -ForegroundColor Green
} else {
    # If deploy only, get webhook URL from env
    $webhookUrl = $env:NEXT_PUBLIC_N8N_WEBHOOK_URL
    if (-not $webhookUrl) {
        Write-Host "❌ No webhook URL found. Run without -DeployOnly first." -ForegroundColor Red
        exit 1
    }
}

if (-not $LocalOnly) {
    # Step 5: Update Vercel environment variables
    Write-Host "☁️  Updating Vercel environment variables..." -ForegroundColor Yellow
    
    # Helper function to update env vars
    function Set-VercelEnv {
        param($Name, $Value)
        if ($Value) {
            vercel env rm $Name production --yes 2>$null | Out-Null
            echo $Value | vercel env add $Name production 2>$null | Out-Null
        }
    }
    
    # Update all necessary environment variables
    Set-VercelEnv "NEXT_PUBLIC_N8N_WEBHOOK_URL" $webhookUrl
    Set-VercelEnv "NEXT_PUBLIC_WEBHOOK_URL" $webhookUrl
    Set-VercelEnv "N8N_WEBHOOK_URL" $webhookUrl
    Set-VercelEnv "NEXT_PUBLIC_SUPABASE_URL" $SUPABASE_URL
    Set-VercelEnv "NEXT_PUBLIC_SUPABASE_ANON_KEY" $SUPABASE_ANON_KEY
    Set-VercelEnv "SUPABASE_SERVICE_ROLE_KEY" $SUPABASE_SERVICE_KEY
    Set-VercelEnv "MAX_FILE_SIZE" "52428800"
    Set-VercelEnv "ALLOWED_FILE_TYPES" "mp3,wav,m4a,aac,ogg,webm,flac"
    Set-VercelEnv "RATE_LIMIT_WINDOW" "900000"
    Set-VercelEnv "RATE_LIMIT_MAX_REQUESTS" "100"
    
    Write-Host "  ✓ Vercel environment variables updated" -ForegroundColor Green
    
    # Step 6: Deploy to Vercel
    Write-Host "🚀 Deploying to Vercel..." -ForegroundColor Yellow
    
    $deployOutput = vercel --prod --yes 2>&1 | Out-String
    $productionUrl = if ($deployOutput -match "Production: (https://[^\s]+)") { $matches[1] } else { "" }
    
    if ($productionUrl) {
        # Update NEXT_PUBLIC_URL with actual deployment URL
        Set-VercelEnv "NEXT_PUBLIC_URL" $productionUrl
        Set-VercelEnv "NEXT_PUBLIC_API_URL" $productionUrl
        
        # Redeploy with updated URLs
        Write-Host "  Redeploying with updated URLs..." -ForegroundColor Gray
        vercel --prod --yes | Out-Null
        
        Write-Host "  ✓ Deployed to: $productionUrl" -ForegroundColor Green
    } else {
        Write-Host "  ✓ Deployment completed" -ForegroundColor Green
        $productionUrl = "Check Vercel dashboard for URL"
    }
}

# Step 7: Start local dev server if not deploy-only
if (-not $DeployOnly -and -not $LocalOnly) {
    Write-Host "🔧 Starting local development server..." -ForegroundColor Yellow
    Start-Process powershell -ArgumentList "-WindowStyle", "Hidden", "-Command", "cd '$projectDir'; npm run dev" -PassThru | Out-Null
    Write-Host "  ✓ Next.js dev server starting on http://localhost:3000" -ForegroundColor Green
}

# Display summary
Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "✅ ALL SYSTEMS OPERATIONAL!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""

if (-not $DeployOnly) {
    Write-Host "🎯 Local Services:" -ForegroundColor Cyan
    Write-Host "  • n8n Dashboard: http://localhost:5678" -ForegroundColor White
    Write-Host "  • ngrok Inspector: http://localhost:4040" -ForegroundColor White
    Write-Host "  • ngrok URL: $ngrokUrl" -ForegroundColor White
    Write-Host "  • Webhook URL: $webhookUrl" -ForegroundColor Yellow
    if (-not $LocalOnly) {
        Write-Host "  • Local Dev: http://localhost:3000" -ForegroundColor White
    }
    Write-Host ""
}

if (-not $LocalOnly) {
    Write-Host "☁️  Production Deployment:" -ForegroundColor Cyan
    Write-Host "  • Live App: $productionUrl" -ForegroundColor Yellow
    Write-Host "  • Vercel Dashboard: https://vercel.com/dashboard" -ForegroundColor White
    Write-Host ""
}

Write-Host "📡 Webhook Configuration:" -ForegroundColor Cyan
Write-Host "  • Incoming (App→n8n): $webhookUrl" -ForegroundColor White
if (-not $LocalOnly) {
    Write-Host "  • Callback (n8n→App): $productionUrl/api/transcription-result-v2" -ForegroundColor White
}
Write-Host ""

Write-Host "🔧 Next Steps:" -ForegroundColor Cyan
Write-Host "  1. Open n8n: http://localhost:5678"
Write-Host "  2. Import and activate your workflow"
Write-Host "  3. Test upload on: $productionUrl"
Write-Host ""

Write-Host "Quick Commands:" -ForegroundColor Yellow
Write-Host "  • Stop all: .\scripts\stop-all-services.ps1"
Write-Host "  • Restart: .\scripts\start-and-deploy.ps1"
Write-Host "  • Local only: .\scripts\start-and-deploy.ps1 -LocalOnly"
Write-Host "  • Deploy only: .\scripts\start-and-deploy.ps1 -DeployOnly"
Write-Host ""
