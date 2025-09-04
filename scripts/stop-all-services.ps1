# PowerShell script to stop all services

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "🛑 STOPPING ALL SERVICES" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Stop n8n
Write-Host "🎯 Stopping n8n..." -ForegroundColor Yellow

# Try Docker first
$dockerRunning = docker ps --filter "name=n8n" --format "{{.Names}}" 2>$null
if ($dockerRunning -eq "n8n") {
    docker stop n8n
    docker rm n8n
    Write-Host "✅ n8n Docker container stopped" -ForegroundColor Green
} else {
    # Stop local n8n processes
    Get-Process | Where-Object {$_.ProcessName -like "*n8n*"} | ForEach-Object {
        Stop-Process -Id $_.Id -Force -ErrorAction SilentlyContinue
        Write-Host "✅ Stopped n8n process (PID: $($_.Id))" -ForegroundColor Green
    }
}

# Stop ngrok
Write-Host ""
Write-Host "🌐 Stopping ngrok..." -ForegroundColor Yellow
Get-Process | Where-Object {$_.ProcessName -eq "ngrok"} | ForEach-Object {
    Stop-Process -Id $_.Id -Force -ErrorAction SilentlyContinue
    Write-Host "✅ Stopped ngrok (PID: $($_.Id))" -ForegroundColor Green
}

# Stop Next.js dev server
Write-Host ""
Write-Host "⚛️ Stopping Next.js dev server..." -ForegroundColor Yellow
Get-Process | Where-Object {
    $_.ProcessName -like "*node*" -and 
    ($_.CommandLine -like "*next*" -or $_.CommandLine -like "*npm*")
} | ForEach-Object {
    Stop-Process -Id $_.Id -Force -ErrorAction SilentlyContinue
    Write-Host "✅ Stopped Node.js process (PID: $($_.Id))" -ForegroundColor Green
}

# Kill any remaining node processes on port 3000
Write-Host ""
Write-Host "🔍 Checking for processes on port 3000..." -ForegroundColor Yellow
$port3000 = netstat -ano | findstr :3000 | findstr LISTENING
if ($port3000) {
    $pid = ($port3000 -split '\s+')[-1]
    if ($pid -match '\d+') {
        Stop-Process -Id $pid -Force -ErrorAction SilentlyContinue
        Write-Host "✅ Killed process on port 3000 (PID: $pid)" -ForegroundColor Green
    }
}

# Kill any remaining processes on port 5678
Write-Host ""
Write-Host "🔍 Checking for processes on port 5678..." -ForegroundColor Yellow
$port5678 = netstat -ano | findstr :5678 | findstr LISTENING
if ($port5678) {
    $pid = ($port5678 -split '\s+')[-1]
    if ($pid -match '\d+') {
        Stop-Process -Id $pid -Force -ErrorAction SilentlyContinue
        Write-Host "✅ Killed process on port 5678 (PID: $pid)" -ForegroundColor Green
    }
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "✅ ALL SERVICES STOPPED" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "💡 To start services again, run:" -ForegroundColor Cyan
Write-Host "   .\scripts\start-all-services.ps1" -ForegroundColor White
Write-Host ""
