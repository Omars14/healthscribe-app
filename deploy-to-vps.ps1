# PowerShell script to deploy to VPS with automatic password handling
param(
    [string]$VpsIp = "154.26.155.207",
    [string]$Password = "Nomar123",
    [string]$Username = "root"
)

Write-Host "🚀 Starting VPS Deployment for Medical Transcription System" -ForegroundColor Cyan
Write-Host "=========================================================" -ForegroundColor Cyan

# Function to run SSH commands with password
function Invoke-SSHCommand {
    param(
        [string]$Command,
        [string]$Description
    )
    
    Write-Host "📋 $Description" -ForegroundColor Yellow
    
    # Create a temporary script file
    $tempScript = [System.IO.Path]::GetTempFileName() + ".sh"
    $Command | Out-File -FilePath $tempScript -Encoding UTF8
    
    try {
        # Use plink (PuTTY Link) for SSH with password
        $plinkPath = "plink"
        if (-not (Get-Command $plinkPath -ErrorAction SilentlyContinue)) {
            Write-Host "❌ plink not found. Please install PuTTY or use WSL" -ForegroundColor Red
            return $false
        }
        
        $result = & $plinkPath -ssh -pw $Password -o StrictHostKeyChecking=no "$Username@$VpsIp" "bash -s" < $tempScript
        Write-Host "✅ $Description completed" -ForegroundColor Green
        return $true
    }
    catch {
        Write-Host "❌ Failed: $Description" -ForegroundColor Red
        Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
        return $false
    }
    finally {
        Remove-Item $tempScript -ErrorAction SilentlyContinue
    }
}

# Function to upload files using SCP
function Copy-FileToVPS {
    param(
        [string]$LocalPath,
        [string]$RemotePath,
        [string]$Description
    )
    
    Write-Host "📤 $Description" -ForegroundColor Yellow
    
    try {
        # Use pscp (PuTTY SCP) for file transfer
        $pscpPath = "pscp"
        if (-not (Get-Command $pscpPath -ErrorAction SilentlyContinue)) {
            Write-Host "❌ pscp not found. Please install PuTTY" -ForegroundColor Red
            return $false
        }
        
        & $pscpPath -pw $Password -o StrictHostKeyChecking=no -r $LocalPath "$Username@$VpsIp`:$RemotePath"
        Write-Host "✅ $Description completed" -ForegroundColor Green
        return $true
    }
    catch {
        Write-Host "❌ Failed: $Description" -ForegroundColor Red
        Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
        return $false
    }
}

# Step 1: Create directories on VPS
Write-Host "`n📁 Step 1: Creating directories on VPS" -ForegroundColor Blue
$createDirs = @"
mkdir -p /opt/healthscribe
mkdir -p /opt/supabase
mkdir -p /var/backups/healthscribe
"@

if (-not (Invoke-SSHCommand -Command $createDirs -Description 'Creating directories')) {
    Write-Host "❌ Failed to create directories" -ForegroundColor Red
    exit 1
}

# Step 2: Upload application code
Write-Host "`n📤 Step 2: Uploading application code" -ForegroundColor Blue
if (-not (Copy-FileToVPS -LocalPath "." -RemotePath "/opt/healthscribe/dashboard-next" -Description 'Uploading application code')) {
    Write-Host "❌ Failed to upload application code" -ForegroundColor Red
    exit 1
}

# Step 3: Upload migration scripts
Write-Host "`n📤 Step 3: Uploading migration scripts" -ForegroundColor Blue
if (-not (Copy-FileToVPS -LocalPath "complete-vps-migration.sh" -RemotePath "/root/" -Description 'Uploading migration script')) {
    Write-Host "❌ Failed to upload migration script" -ForegroundColor Red
    exit 1
}

if (-not (Copy-FileToVPS -LocalPath "migrate-to-vps.js" -RemotePath "/root/" -Description 'Uploading data migration script')) {
    Write-Host "❌ Failed to upload data migration script" -ForegroundColor Red
    exit 1
}

# Step 4: Run the migration script
Write-Host "`n🚀 Step 4: Running VPS migration script" -ForegroundColor Blue
$runMigration = @"
cd /root
chmod +x complete-vps-migration.sh
./complete-vps-migration.sh
"@

if (-not (Invoke-SSHCommand -Command $runMigration -Description 'Running VPS migration script')) {
    Write-Host "❌ Failed to run migration script" -ForegroundColor Red
    exit 1
}

# Step 5: Migrate data
Write-Host "`n📊 Step 5: Migrating data from cloud to VPS" -ForegroundColor Blue
$migrateData = @"
cd /root
npm install @supabase/supabase-js dotenv
node migrate-to-vps.js
"@

if (-not (Invoke-SSHCommand -Command $migrateData -Description 'Migrating data from cloud to VPS')) {
    Write-Host "❌ Failed to migrate data" -ForegroundColor Red
    exit 1
}

# Step 6: Check services status
Write-Host "`n📊 Step 6: Checking services status" -ForegroundColor Blue
$checkStatus = @"
systemctl status healthscribe-app --no-pager
systemctl status supabase --no-pager
systemctl status nginx --no-pager
"@

Invoke-SSHCommand -Command $checkStatus -Description 'Checking services status'

# Step 7: Test connectivity
Write-Host "`n🔍 Step 7: Testing connectivity" -ForegroundColor Blue
$testConnectivity = @"
curl -I http://localhost:3000
curl -I http://localhost:8000
netstat -tulpn | grep :3000
netstat -tulpn | grep :8000
"@

Invoke-SSHCommand -Command $testConnectivity -Description 'Testing connectivity'

Write-Host "`n🎉 VPS Deployment Completed!" -ForegroundColor Green
Write-Host "=============================" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Next Steps:" -ForegroundColor Yellow
Write-Host "1. Update your DNS records to point to $VpsIp" -ForegroundColor White
Write-Host "2. Test your application at http://$VpsIp" -ForegroundColor White
Write-Host "3. Get SSL certificates: certbot --nginx -d healthscribe.pro" -ForegroundColor White
Write-Host "4. Test login functionality" -ForegroundColor White
Write-Host ""
Write-Host "🔧 Management Commands:" -ForegroundColor Yellow
Write-Host "• Check status: ssh root@$VpsIp 'systemctl status healthscribe-app'" -ForegroundColor White
Write-Host "• View logs: ssh root@$VpsIp 'journalctl -u healthscribe-app -f'" -ForegroundColor White
Write-Host "• Monitor: ssh root@$VpsIp '/usr/local/bin/monitor-healthscribe.sh'" -ForegroundColor White
Write-Host ""
Write-Host "⚠️  Important: Update your DNS records to point to $VpsIp!" -ForegroundColor Red
