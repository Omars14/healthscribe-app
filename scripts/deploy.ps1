# PowerShell deployment script for Vercel
Write-Host "🚀 Deploying Medical Transcription Dashboard to Vercel" -ForegroundColor Cyan

# Check if Vercel CLI is installed
if (-not (Get-Command vercel -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Vercel CLI not found. Installing..." -ForegroundColor Red
    npm install -g vercel
}

# Check if project is linked to Vercel
if (-not (Test-Path ".vercel")) {
    Write-Host "📎 Linking project to Vercel..." -ForegroundColor Yellow
    vercel link
}

# Build the project first
Write-Host "🔨 Building project..." -ForegroundColor Yellow
npm run build

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Build failed. Please fix errors before deploying." -ForegroundColor Red
    exit 1
}

# Deploy to Vercel
Write-Host "🌐 Deploying to Vercel..." -ForegroundColor Green
$deploy = Read-Host "Deploy to production? (y/n)"

if ($deploy -eq "y") {
    vercel --prod
} else {
    vercel
}

Write-Host "✅ Deployment complete!" -ForegroundColor Green
Write-Host ""
Write-Host "📝 Next steps:" -ForegroundColor Cyan
Write-Host "1. Update environment variables in Vercel dashboard"
Write-Host "2. Ensure ngrok URL is updated for webhooks"
Write-Host "3. Test the deployed application"
