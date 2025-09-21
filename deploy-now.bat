@echo off
echo 🚀 Starting Complete VPS Deployment
echo ===================================

set VPS_IP=154.26.155.207
set VPS_USER=root
set VPS_PASS=Nomar123

echo.
echo 📤 Step 1: Uploading files to VPS...

echo Uploading application code...
echo y | pscp -pw %VPS_PASS% -o StrictHostKeyChecking=no -r . %VPS_USER%@%VPS_IP%:/opt/healthscribe/dashboard-next

echo Uploading deployment script...
echo y | pscp -pw %VPS_PASS% -o StrictHostKeyChecking=no complete-deployment.sh %VPS_USER%@%VPS_IP%:/root/

echo Uploading migration script...
echo y | pscp -pw %VPS_PASS% -o StrictHostKeyChecking=no migrate-to-vps.js %VPS_USER%@%VPS_IP%:/root/

echo.
echo 🚀 Step 2: Running deployment on VPS...
echo y | plink -ssh -pw %VPS_PASS% -o StrictHostKeyChecking=no %VPS_USER%@%VPS_IP% "cd /root && chmod +x complete-deployment.sh && ./complete-deployment.sh"

echo.
echo 🎉 Deployment completed!
echo.
echo 📋 Next Steps:
echo 1. Update your DNS records to point to %VPS_IP%
echo 2. Test your application at http://%VPS_IP%
echo 3. Get SSL certificates: certbot --nginx -d healthscribe.pro
echo 4. Test login functionality
echo.
pause




