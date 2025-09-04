# PowerShell script to start all services with automatic configuration
# Run this as Administrator for best results

param(
    [switch]$SkipVercelDeploy = $false,
    [switch]$UseDocker = $false,
    [string]$CustomDomain = "",
    [switch]$Production = $false
)

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "🚀 MEDICAL TRANSCRIPTION SYSTEM STARTUP" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Load environment variables from .env.local
$envFile = Join-Path $PSScriptRoot ".." ".env.local"
if (Test-Path $envFile) {
    Write-Host "📋 Loading environment variables from .env.local..." -ForegroundColor Yellow
    Get-Content $envFile | ForEach-Object {
        if ($_ -match '^([^#].+?)=(.+)$') {
            $key = $matches[1].Trim()
            $value = $matches[2].Trim()
            [Environment]::SetEnvironmentVariable($key, $value, "Process")
        }
    }
    Write-Host "✅ Environment variables loaded" -ForegroundColor Green
} else {
    Write-Host "⚠️  No .env.local found. Creating from template..." -ForegroundColor Yellow
    $envExample = Join-Path $PSScriptRoot ".." ".env.example"
    if (Test-Path $envExample) {
        Copy-Item $envExample $envFile
        Write-Host "✅ Created .env.local - Please update with your values" -ForegroundColor Green
    }
}

# Configuration
$SUPABASE_URL = $env:NEXT_PUBLIC_SUPABASE_URL
$SUPABASE_ANON_KEY = $env:NEXT_PUBLIC_SUPABASE_ANON_KEY
$SUPABASE_SERVICE_KEY = $env:SUPABASE_SERVICE_ROLE_KEY
$N8N_PORT = 5678
$NGROK_PORT = 5678
$NEXT_PORT = 3000
$VERCEL_DOMAIN = if ($CustomDomain) { $CustomDomain } else { "https://dashboard-next.vercel.app" }

Write-Host ""
Write-Host "📋 Configuration:" -ForegroundColor Yellow
Write-Host "  • Supabase URL: $SUPABASE_URL" -ForegroundColor Gray
Write-Host "  • N8N Port: $N8N_PORT" -ForegroundColor Gray
Write-Host "  • Next.js Port: $NEXT_PORT" -ForegroundColor Gray
Write-Host "  • Production Mode: $Production" -ForegroundColor Gray
Write-Host ""

# Function to check if a port is in use
function Test-Port {
    param($Port)
    $connection = New-Object System.Net.Sockets.TcpClient
    try {
        $connection.Connect("localhost", $Port)
        $connection.Close()
        return $true
    } catch {
        return $false
    }
}

# Step 1: Clean up existing processes
Write-Host "🧹 Step 1: Cleaning up existing processes..." -ForegroundColor Yellow

# Stop n8n if running
if ($UseDocker) {
    docker stop n8n 2>$null | Out-Null
    docker rm n8n 2>$null | Out-Null
} else {
    Get-Process | Where-Object {$_.ProcessName -like "*n8n*"} | Stop-Process -Force -ErrorAction SilentlyContinue
}

# Stop ngrok
Get-Process | Where-Object {$_.ProcessName -eq "ngrok"} | Stop-Process -Force -ErrorAction SilentlyContinue

# Stop any existing Next.js dev server
Get-Process | Where-Object {$_.ProcessName -like "*node*" -and $_.CommandLine -like "*next*"} | Stop-Process -Force -ErrorAction SilentlyContinue

Write-Host "✅ Cleanup complete" -ForegroundColor Green

# Step 2: Start n8n
Write-Host ""
Write-Host "🎯 Step 2: Starting n8n..." -ForegroundColor Yellow

if ($UseDocker) {
    Write-Host "  Using Docker to start n8n..." -ForegroundColor Gray
    
    # Create Docker volume if it doesn't exist
    docker volume create n8n_data 2>$null | Out-Null
    
    # Start n8n container with environment variables
    $dockerCmd = @"
docker run -d --name n8n `
    -p ${N8N_PORT}:5678 `
    -v n8n_data:/home/node/.n8n `
    -e N8N_BASIC_AUTH_ACTIVE=false `
    -e N8N_HOST=0.0.0.0 `
    -e N8N_PORT=5678 `
    -e N8N_PROTOCOL=http `
    -e WEBHOOK_URL=http://localhost:5678/ `
    -e N8N_ENCRYPTION_KEY=your-encryption-key `
    n8nio/n8n
"@
    
    Invoke-Expression $dockerCmd
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Failed to start n8n Docker container" -ForegroundColor Red
        Write-Host "💡 Make sure Docker Desktop is running" -ForegroundColor Yellow
        exit 1
    }
} else {
    Write-Host "  Starting n8n locally..." -ForegroundColor Gray
    
    # Check if n8n is installed
    if (-not (Get-Command n8n -ErrorAction SilentlyContinue)) {
        Write-Host "  Installing n8n globally..." -ForegroundColor Yellow
        npm install -g n8n
    }
    
    # Start n8n in a new window
    $n8nEnv = @{
        N8N_BASIC_AUTH_ACTIVE = "false"
        N8N_HOST = "0.0.0.0"
        N8N_PORT = $N8N_PORT
        N8N_PROTOCOL = "http"
        WEBHOOK_URL = "http://localhost:$N8N_PORT/"
        N8N_ENCRYPTION_KEY = "your-encryption-key"
    }
    
    $envString = ($n8nEnv.GetEnumerator() | ForEach-Object { "$($_.Key)=$($_.Value)" }) -join " && "
    
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot\..' ; $envString ; npx n8n" -WindowStyle Normal
}

Write-Host "✅ n8n started" -ForegroundColor Green
Write-Host "Waiting for n8n to initialize (15 seconds)..." -ForegroundColor Yellow
Start-Sleep -Seconds 15

# Step 3: Start ngrok
Write-Host ""
Write-Host "🌐 Step 3: Starting ngrok tunnel..." -ForegroundColor Yellow

# Check if ngrok is installed
if (-not (Get-Command ngrok -ErrorAction SilentlyContinue)) {
    Write-Host "❌ ngrok not found. Please install from https://ngrok.com/download" -ForegroundColor Red
    exit 1
}

# Start ngrok in a new window
Start-Process powershell -ArgumentList "-NoExit", "-Command", "ngrok http $NGROK_PORT" -WindowStyle Normal

Write-Host "✅ ngrok tunnel starting..." -ForegroundColor Green
Write-Host "Waiting for ngrok to establish tunnel (10 seconds)..." -ForegroundColor Yellow
Start-Sleep -Seconds 10

# Step 4: Get ngrok URL
Write-Host ""
Write-Host "🔍 Step 4: Getting ngrok tunnel URL..." -ForegroundColor Yellow

$ngrokUrl = $null
for ($i = 1; $i -le 5; $i++) {
    try {
        $response = Invoke-RestMethod -Uri "http://localhost:4040/api/tunnels" -Method Get
        $tunnel = $response.tunnels | Where-Object { $_.proto -eq "https" } | Select-Object -First 1
        if ($tunnel) {
            $ngrokUrl = $tunnel.public_url
            break
        }
    } catch {
        Write-Host "  ⏳ Attempt $i/5: Waiting for ngrok..." -ForegroundColor Gray
        Start-Sleep -Seconds 2
    }
}

if (-not $ngrokUrl) {
    Write-Host "❌ Failed to get ngrok URL" -ForegroundColor Red
    Write-Host "💡 Check if ngrok is running: http://localhost:4040" -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ Got ngrok URL: $ngrokUrl" -ForegroundColor Green

# Step 5: Update environment variables
Write-Host ""
Write-Host "📝 Step 5: Updating environment variables..." -ForegroundColor Yellow

$webhookUrl = "$ngrokUrl/webhook/medical-transcribe-v2"

# Update .env.local
$envContent = Get-Content $envFile -Raw
$envContent = $envContent -replace 'N8N_WEBHOOK_URL=.*', "N8N_WEBHOOK_URL=$webhookUrl"
$envContent = $envContent -replace 'NEXT_PUBLIC_N8N_WEBHOOK_URL=.*', "NEXT_PUBLIC_N8N_WEBHOOK_URL=$webhookUrl"
$envContent = $envContent -replace 'NEXT_PUBLIC_WEBHOOK_URL=.*', "NEXT_PUBLIC_WEBHOOK_URL=$webhookUrl"

# If variables don't exist, append them
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

# Also set them in current process
[Environment]::SetEnvironmentVariable("N8N_WEBHOOK_URL", $webhookUrl, "Process")
[Environment]::SetEnvironmentVariable("NEXT_PUBLIC_N8N_WEBHOOK_URL", $webhookUrl, "Process")
[Environment]::SetEnvironmentVariable("NEXT_PUBLIC_WEBHOOK_URL", $webhookUrl, "Process")

Write-Host "✅ Updated webhook URLs to: $webhookUrl" -ForegroundColor Green

# Step 6: Start Next.js development server (if not in production)
if (-not $Production) {
    Write-Host ""
    Write-Host "🔧 Step 6: Starting Next.js development server..." -ForegroundColor Yellow
    
    # Change to project directory
    Set-Location (Join-Path $PSScriptRoot "..")
    
    # Install dependencies if needed
    if (-not (Test-Path "node_modules")) {
        Write-Host "  Installing dependencies..." -ForegroundColor Gray
        npm install
    }
    
    # Start Next.js in a new window
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot\..' ; npm run dev" -WindowStyle Normal
    
    Write-Host "✅ Next.js development server starting on http://localhost:$NEXT_PORT" -ForegroundColor Green
    Write-Host "Waiting for Next.js to start (10 seconds)..." -ForegroundColor Yellow
    Start-Sleep -Seconds 10
}

# Step 7: Update Vercel Environment Variables (Always)
Write-Host ""
Write-Host "☁️ Step 7: Updating Vercel environment variables..." -ForegroundColor Yellow

# Get current Vercel project URL
$vercelInfo = vercel ls --json 2>$null | ConvertFrom-Json -ErrorAction SilentlyContinue
if ($vercelInfo -and $vercelInfo.length -gt 0) {
    $VERCEL_DOMAIN = "https://" + $vercelInfo[0].url
    Write-Host "  Found Vercel domain: $VERCEL_DOMAIN" -ForegroundColor Gray
} else {
    # Try to get from recent deployment
    $VERCEL_DOMAIN = if ($CustomDomain) { $CustomDomain } else { "https://dashboard-next.vercel.app" }
}

# Update all Vercel environment variables
Write-Host "  Updating webhook URLs in Vercel..." -ForegroundColor Gray

# Function to safely add/update Vercel env var
function Update-VercelEnv {
    param($Name, $Value)
    
    # Remove existing if exists
    vercel env rm $Name production --yes 2>$null | Out-Null
    
    # Add new value
    echo $Value | vercel env add $Name production 2>$null | Out-Null
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "    ✓ $Name" -ForegroundColor DarkGreen
    } else {
        Write-Host "    ✗ Failed to update $Name" -ForegroundColor DarkRed
    }
}

# Update all environment variables in Vercel
Write-Host "  Updating environment variables:" -ForegroundColor Gray
Update-VercelEnv "NEXT_PUBLIC_N8N_WEBHOOK_URL" $webhookUrl
Update-VercelEnv "NEXT_PUBLIC_WEBHOOK_URL" $webhookUrl
Update-VercelEnv "N8N_WEBHOOK_URL" $webhookUrl
Update-VercelEnv "NEXT_PUBLIC_URL" $VERCEL_DOMAIN
Update-VercelEnv "NEXT_PUBLIC_API_URL" $VERCEL_DOMAIN

# Only update Supabase vars if they exist
if ($SUPABASE_URL) {
    Update-VercelEnv "NEXT_PUBLIC_SUPABASE_URL" $SUPABASE_URL
}
if ($SUPABASE_ANON_KEY) {
    Update-VercelEnv "NEXT_PUBLIC_SUPABASE_ANON_KEY" $SUPABASE_ANON_KEY
}
if ($SUPABASE_SERVICE_KEY) {
    Update-VercelEnv "SUPABASE_SERVICE_ROLE_KEY" $SUPABASE_SERVICE_KEY
}

# Add other required variables
Update-VercelEnv "MAX_FILE_SIZE" "52428800"
Update-VercelEnv "ALLOWED_FILE_TYPES" "mp3,wav,m4a,aac,ogg,webm,flac"
Update-VercelEnv "RATE_LIMIT_WINDOW" "900000"
Update-VercelEnv "RATE_LIMIT_MAX_REQUESTS" "100"

Write-Host "✅ Vercel environment variables updated" -ForegroundColor Green

# Step 8: Deploy to Vercel (if requested)
if ($Production -and -not $SkipVercelDeploy) {
    Write-Host ""
    Write-Host "🚀 Step 8: Deploying to Vercel..." -ForegroundColor Yellow
    
    Set-Location (Join-Path $PSScriptRoot "..")
    
    # Deploy and capture the URL
    $deployOutput = vercel --prod --yes 2>&1
    $deployUrl = $deployOutput | Select-String "Production: (https://[^\s]+)" | ForEach-Object { $_.Matches[0].Groups[1].Value }
    
    if ($deployUrl) {
        $VERCEL_DOMAIN = $deployUrl
        Write-Host "✅ Deployed to: $VERCEL_DOMAIN" -ForegroundColor Green
        
        # Update the NEXT_PUBLIC_URL with the actual deployment URL
        Update-VercelEnv "NEXT_PUBLIC_URL" $VERCEL_DOMAIN
        Update-VercelEnv "NEXT_PUBLIC_API_URL" $VERCEL_DOMAIN
        
        # Trigger rebuild with updated env vars
        Write-Host "  Triggering rebuild with updated URLs..." -ForegroundColor Yellow
        vercel --prod --yes | Out-Null
    } else {
        Write-Host "✅ Deployment completed" -ForegroundColor Green
    }
}

# Step 8: Display summary
Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "✅ SETUP COMPLETE!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""

Write-Host "🎯 Services Running:" -ForegroundColor Cyan
Write-Host "  • n8n Dashboard: http://localhost:$N8N_PORT" -ForegroundColor White
Write-Host "  • ngrok Admin: http://localhost:4040" -ForegroundColor White
Write-Host "  • ngrok Tunnel: $ngrokUrl" -ForegroundColor White
if (-not $Production) {
    Write-Host "  • Next.js Dev: http://localhost:$NEXT_PORT" -ForegroundColor White
}
if ($Production) {
    Write-Host "  • Production: $VERCEL_DOMAIN" -ForegroundColor White
}

Write-Host ""
Write-Host "📡 Webhook Configuration:" -ForegroundColor Cyan
Write-Host "┌─────────────────────────────────────────────────────────────┐" -ForegroundColor DarkGray
Write-Host "│ INCOMING WEBHOOK (from App to n8n):" -ForegroundColor White
Write-Host "│ $webhookUrl" -ForegroundColor Yellow
Write-Host "│" -ForegroundColor DarkGray
Write-Host "│ CALLBACK URL (from n8n back to App):" -ForegroundColor White
if ($Production) {
    Write-Host "│ $VERCEL_DOMAIN/api/transcription-result-v2" -ForegroundColor Yellow
} else {
    Write-Host "│ http://localhost:$NEXT_PORT/api/transcription-result-v2" -ForegroundColor Yellow
}
Write-Host "└─────────────────────────────────────────────────────────────┘" -ForegroundColor DarkGray

Write-Host ""
Write-Host "🔧 n8n Workflow Setup:" -ForegroundColor Cyan
Write-Host "  1. Open n8n: http://localhost:$N8N_PORT" -ForegroundColor White
Write-Host "  2. Import workflow from: /n8n-workflows/latest-workflow.json" -ForegroundColor White
Write-Host "  3. Configure credentials:" -ForegroundColor White
Write-Host "     • Supabase URL: $SUPABASE_URL" -ForegroundColor Gray
Write-Host "     • Supabase API Key: [Use service role key]" -ForegroundColor Gray
Write-Host "     • Webhook path: /webhook/medical-transcribe-v2" -ForegroundColor Gray
Write-Host "  4. Activate the workflow" -ForegroundColor White

Write-Host ""
Write-Host "🧪 Test Your Setup:" -ForegroundColor Cyan
if ($Production) {
    Write-Host "  • Visit $VERCEL_DOMAIN" -ForegroundColor White
} else {
    Write-Host "  • Visit http://localhost:$NEXT_PORT" -ForegroundColor White
}
Write-Host "  • Upload an audio file" -ForegroundColor White
Write-Host "  • Check n8n execution logs" -ForegroundColor White
Write-Host "  • Verify transcription appears" -ForegroundColor White

Write-Host ""
Write-Host "Commands:" -ForegroundColor Cyan
Write-Host "  • Stop all: .\scripts\stop-all-services.ps1" -ForegroundColor White
Write-Host "  • Update ngrok: npm run update-ngrok" -ForegroundColor White
Write-Host "  • Deploy: vercel --prod" -ForegroundColor White
Write-Host "  • View logs: docker logs n8n" -ForegroundColor White

Write-Host ""
Write-Host "📝 Environment Variables Set:" -ForegroundColor Cyan
Write-Host "  • NEXT_PUBLIC_SUPABASE_URL: $SUPABASE_URL" -ForegroundColor Gray
Write-Host "  • NEXT_PUBLIC_N8N_WEBHOOK_URL: $webhookUrl" -ForegroundColor Gray
if ($Production) {
    Write-Host "  • NEXT_PUBLIC_URL: $VERCEL_DOMAIN" -ForegroundColor Gray
} else {
    Write-Host "  • NEXT_PUBLIC_URL: http://localhost:$NEXT_PORT" -ForegroundColor Gray
}

Write-Host ""
Write-Host "Press any key to continue..." -ForegroundColor DarkGray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
