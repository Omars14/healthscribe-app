# Simple VPS Deployment Script
param(
    [string]$VpsIp = "154.26.155.207",
    [string]$Password = "Nomar123",
    [string]$Username = "root"
)

Write-Host "🚀 Starting VPS Deployment" -ForegroundColor Cyan
Write-Host "=========================" -ForegroundColor Cyan

# Function to run SSH commands
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
        # Use WSL to run SSH
        $wslCommand = "ssh -o StrictHostKeyChecking=no $Username@$VpsIp 'bash -s' < $tempScript"
        $result = wsl bash -c $wslCommand
        
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

# Function to copy files using WSL
function Copy-FileToVPS {
    param(
        [string]$LocalPath,
        [string]$RemotePath,
        [string]$Description
    )
    
    Write-Host "📤 $Description" -ForegroundColor Yellow
    
    try {
        # Use WSL to run SCP
        $wslCommand = "scp -o StrictHostKeyChecking=no -r '$LocalPath' $Username@$VpsIp`:$RemotePath"
        $result = wsl bash -c $wslCommand
        
        Write-Host "✅ $Description completed" -ForegroundColor Green
        return $true
    }
    catch {
        Write-Host "❌ Failed: $Description" -ForegroundColor Red
        Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
        return $false
    }
}

# Step 1: Create directories
Write-Host "`n📁 Step 1: Creating directories on VPS" -ForegroundColor Blue
$createDirs = @"
mkdir -p /opt/healthscribe
mkdir -p /opt/supabase
mkdir -p /var/backups/healthscribe
"@

Invoke-SSHCommand -Command $createDirs -Description 'Creating directories'

# Step 2: Upload application code
Write-Host "`n📤 Step 2: Uploading application code" -ForegroundColor Blue
Copy-FileToVPS -LocalPath "." -RemotePath "/opt/healthscribe/dashboard-next" -Description 'Uploading application code'

# Step 3: Upload migration scripts
Write-Host "`n📤 Step 3: Uploading migration scripts" -ForegroundColor Blue
Copy-FileToVPS -LocalPath "complete-vps-migration.sh" -RemotePath "/root/" -Description 'Uploading migration script'
Copy-FileToVPS -LocalPath "migrate-to-vps.js" -RemotePath "/root/" -Description 'Uploading data migration script'

# Step 4: Run the migration script
Write-Host "`n🚀 Step 4: Running VPS migration script" -ForegroundColor Blue
$runMigration = @"
cd /root
chmod +x complete-vps-migration.sh
./complete-vps-migration.sh
"@

Invoke-SSHCommand -Command $runMigration -Description 'Running VPS migration script'

# Step 5: Migrate data
Write-Host "`n📊 Step 5: Migrating data from cloud to VPS" -ForegroundColor Blue
$migrateData = @"
cd /root
npm install @supabase/supabase-js dotenv
node migrate-to-vps.js
"@

Invoke-SSHCommand -Command $migrateData -Description 'Migrating data from cloud to VPS'

# Step 6: Check services status
Write-Host "`n📊 Step 6: Checking services status" -ForegroundColor Blue
$checkStatus = @"
systemctl status healthscribe-app --no-pager
systemctl status supabase --no-pager
systemctl status nginx --no-pager
"@

Invoke-SSHCommand -Command $checkStatus -Description 'Checking services status'

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
Write-Host "• Check status: ssh $Username@$VpsIp 'systemctl status healthscribe-app'" -ForegroundColor White
Write-Host "• View logs: ssh $Username@$VpsIp 'journalctl -u healthscribe-app -f'" -ForegroundColor White
Write-Host "• Monitor: ssh $Username@$VpsIp '/usr/local/bin/monitor-healthscribe.sh'" -ForegroundColor White
Write-Host ""
Write-Host "⚠️  Important: Update your DNS records to point to $VpsIp!" -ForegroundColor Red




