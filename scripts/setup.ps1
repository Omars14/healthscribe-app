# PowerShell setup script for Medical Transcription Dashboard
Write-Host "🏥 Medical Transcription Dashboard Setup" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

# Step 1: Install dependencies
Write-Host "`n📦 Installing dependencies..." -ForegroundColor Yellow
npm install

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to install dependencies" -ForegroundColor Red
    exit 1
}

# Step 2: Check for .env.local file
Write-Host "`n🔐 Checking environment configuration..." -ForegroundColor Yellow
if (-not (Test-Path ".env.local")) {
    Write-Host "Creating .env.local from template..." -ForegroundColor Yellow
    if (Test-Path ".env.example") {
        Copy-Item ".env.example" ".env.local"
        Write-Host "✅ Created .env.local - Please update with your actual values" -ForegroundColor Green
    } else {
        Write-Host "❌ No .env.example found. Please create .env.local manually" -ForegroundColor Red
    }
} else {
    Write-Host "✅ .env.local exists" -ForegroundColor Green
}

# Step 3: Check for ngrok
Write-Host "`n🌐 Checking ngrok setup..." -ForegroundColor Yellow
if (Get-Command ngrok -ErrorAction SilentlyContinue) {
    Write-Host "✅ ngrok is installed" -ForegroundColor Green
    
    $updateNgrok = Read-Host "Do you want to update ngrok webhook URLs now? (y/n)"
    if ($updateNgrok -eq "y") {
        Write-Host "Make sure ngrok is running on port 5678 (ngrok http 5678)" -ForegroundColor Yellow
        Start-Sleep -Seconds 2
        node scripts/update-ngrok.js
    }
} else {
    Write-Host "⚠️  ngrok not found. Download from https://ngrok.com/download" -ForegroundColor Yellow
}

# Step 4: Check Vercel CLI
Write-Host "`n🚀 Checking Vercel CLI..." -ForegroundColor Yellow
if (Get-Command vercel -ErrorAction SilentlyContinue) {
    Write-Host "✅ Vercel CLI is installed" -ForegroundColor Green
} else {
    $installVercel = Read-Host "Vercel CLI not found. Install now? (y/n)"
    if ($installVercel -eq "y") {
        npm install -g vercel
    }
}

# Step 5: Test build
Write-Host "`n🔨 Testing build..." -ForegroundColor Yellow
npm run build

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Build successful!" -ForegroundColor Green
} else {
    Write-Host "❌ Build failed. Please fix errors before deploying" -ForegroundColor Red
    exit 1
}

# Final instructions
Write-Host "`n✨ Setup Complete!" -ForegroundColor Green
Write-Host "`n📋 Next Steps:" -ForegroundColor Cyan
Write-Host "1. Update .env.local with your Supabase credentials"
Write-Host "2. Start ngrok: ngrok http 5678"
Write-Host "3. Run: npm run update-ngrok"
Write-Host "4. Start n8n and activate your workflow"
Write-Host "5. Run: npm run dev (for development)"
Write-Host "6. Run: ./scripts/deploy.ps1 (to deploy to Vercel)"

Write-Host "`n🔗 Important URLs:" -ForegroundColor Cyan
Write-Host "Local Development: http://localhost:3000"
Write-Host "n8n Interface: http://localhost:5678"
Write-Host "ngrok Inspector: http://localhost:4040"
