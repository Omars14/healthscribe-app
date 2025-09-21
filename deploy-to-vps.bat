@echo off
echo 🚀 Starting VPS Deployment for Medical Transcription System
echo =========================================================

set VPS_IP=154.26.155.207
set VPS_USER=root
set VPS_PASS=Nomar123

echo.
echo 📁 Step 1: Creating directories on VPS
echo y | plink -ssh -pw %VPS_PASS% -o StrictHostKeyChecking=no %VPS_USER%@%VPS_IP% "mkdir -p /opt/healthscribe && mkdir -p /opt/supabase && mkdir -p /var/backups/healthscribe"

echo.
echo 📤 Step 2: Uploading application code
pscp -pw %VPS_PASS% -o StrictHostKeyChecking=no -r . %VPS_USER%@%VPS_IP%:/opt/healthscribe/dashboard-next

echo.
echo 📤 Step 3: Uploading migration scripts
pscp -pw %VPS_PASS% -o StrictHostKeyChecking=no complete-vps-migration.sh %VPS_USER%@%VPS_IP%:/root/
pscp -pw %VPS_PASS% -o StrictHostKeyChecking=no migrate-to-vps.js %VPS_USER%@%VPS_IP%:/root/

echo.
echo 🚀 Step 4: Running VPS migration script
echo y | plink -ssh -pw %VPS_PASS% -o StrictHostKeyChecking=no %VPS_USER%@%VPS_IP% "cd /root && chmod +x complete-vps-migration.sh && ./complete-vps-migration.sh"

echo.
echo 📊 Step 5: Migrating data from cloud to VPS
echo y | plink -ssh -pw %VPS_PASS% -o StrictHostKeyChecking=no %VPS_USER%@%VPS_IP% "cd /root && npm install @supabase/supabase-js dotenv && node migrate-to-vps.js"

echo.
echo 📊 Step 6: Checking services status
echo y | plink -ssh -pw %VPS_PASS% -o StrictHostKeyChecking=no %VPS_USER%@%VPS_IP% "systemctl status healthscribe-app --no-pager && systemctl status supabase --no-pager && systemctl status nginx --no-pager"

echo.
echo 🔍 Step 7: Testing connectivity
echo y | plink -ssh -pw %VPS_PASS% -o StrictHostKeyChecking=no %VPS_USER%@%VPS_IP% "curl -I http://localhost:3000 && curl -I http://localhost:8000"

echo.
echo 🎉 VPS Deployment Completed!
echo =============================
echo.
echo 📋 Next Steps:
echo 1. Update your DNS records to point to %VPS_IP%
echo 2. Test your application at http://%VPS_IP%
echo 3. Get SSL certificates: certbot --nginx -d healthscribe.pro
echo 4. Test login functionality
echo.
echo 🔧 Management Commands:
echo • Check status: ssh %VPS_USER%@%VPS_IP% "systemctl status healthscribe-app"
echo • View logs: ssh %VPS_USER%@%VPS_IP% "journalctl -u healthscribe-app -f"
echo • Monitor: ssh %VPS_USER%@%VPS_IP% "/usr/local/bin/monitor-healthscribe.sh"
echo.
echo ⚠️  Important: Update your DNS records to point to %VPS_IP%!
echo.
pause




