# Passwordless SSH Setup for HealthScribe Production Server
# This script configures ssh-agent and SSH config for key-based auth

# Ensure .ssh directory exists
New-Item -ItemType Directory -Force -Path "$env:USERPROFILE\.ssh" | Out-Null
Write-Host "✓ .ssh directory ready" -ForegroundColor Green

# Ensure ssh-agent is running
$sshAgent = Get-Service ssh-agent -ErrorAction SilentlyContinue
if ($sshAgent.Status -ne 'Running') {
    Write-Host "🔧 Starting ssh-agent service..." -ForegroundColor Yellow
    Start-Service ssh-agent
}
Write-Host "✓ ssh-agent is running" -ForegroundColor Green

# Add the private key to ssh-agent
Write-Host "🔑 Adding healthscribe_key to ssh-agent..." -ForegroundColor Yellow
$keyPath = "$env:USERPROFILE\.ssh\healthscribe_key"

if (Test-Path $keyPath) {
    # PowerShell's ssh will use the key from .ssh/config, but let's ensure it's in agent
    ssh-add $keyPath 2>&1 | ForEach-Object { if ($_ -like "*Warning*" -or $_ -like "*Error*") { Write-Host "  $_" -ForegroundColor Yellow } }
    Write-Host "✓ Key added to ssh-agent" -ForegroundColor Green
} else {
    Write-Host "❌ Private key not found at $keyPath" -ForegroundColor Red
    exit 1
}

# Ensure SSH config exists and is properly formatted
$cfgPath = "$env:USERPROFILE\.ssh\config"
$healthscribeConfig = @"
Host healthscribe
    HostName 154.26.155.207
    User root
    IdentityFile $env:USERPROFILE\.ssh\healthscribe_key
    IdentitiesOnly yes
    StrictHostKeyChecking accept-new
    ServerAliveInterval 60
    ServerAliveCountMax 5
"@

if (Test-Path $cfgPath) {
    # Remove existing healthscribe block to avoid duplicates
    $content = Get-Content $cfgPath
    $filtered = $content | Where-Object { $_ -notmatch '^Host healthscribe$' -and $_ -notmatch '^    ' } | Where-Object { $_.Trim() -ne '' }
    
    # Re-add the healthscribe config
    $filtered | Set-Content $cfgPath
    Add-Content -Path $cfgPath -Value ""
    Add-Content -Path $cfgPath -Value $healthscribeConfig
} else {
    Set-Content -Path $cfgPath -Value $healthscribeConfig -Encoding ASCII
}
Write-Host "✓ SSH config updated" -ForegroundColor Green

# Test connectivity (non-interactive, batch mode)
Write-Host ""
Write-Host "🧪 Testing SSH connectivity to healthscribe..." -ForegroundColor Yellow
$testResult = ssh -o BatchMode=yes -o ConnectTimeout=5 healthscribe "echo OK && hostname -f" 2>&1

if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ SSH connection successful!" -ForegroundColor Green
    Write-Host "  Output: $testResult"
} else {
    Write-Host "❌ SSH connection failed!" -ForegroundColor Red
    Write-Host "  Error: $testResult"
    exit 1
}

Write-Host ""
Write-Host "✅ Passwordless SSH setup complete!" -ForegroundColor Green
Write-Host "You can now use: ssh healthscribe 'command'" -ForegroundColor Cyan
