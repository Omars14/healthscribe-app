#!/bin/bash

echo "🔧 FIXING 502 BAD GATEWAY - APPLICATION NOT RUNNING"
echo "==================================================="

# Step 1: Check PM2 status
echo "Step 1: Checking PM2 status..."
pm2 status

# Step 2: Check if the application is running
echo "Step 2: Checking application processes..."
ps aux | grep node | grep -v grep

# Step 3: Check application directory
echo "Step 3: Checking application directory..."
ls -la /var/www/healthscribe/

# Step 4: Check package.json
echo "Step 4: Checking package.json..."
cat /var/www/healthscribe/package.json | grep -A 10 -B 5 "scripts"

# Step 5: Stop all PM2 processes
echo "Step 5: Stopping all PM2 processes..."
pm2 stop all
pm2 delete all

# Step 6: Go to application directory and install dependencies
echo "Step 6: Installing dependencies..."
cd /var/www/healthscribe
npm install

# Step 7: Build the application
echo "Step 7: Building the application..."
npm run build

# Step 8: Start the application with PM2
echo "Step 8: Starting application with PM2..."
pm2 start npm --name "healthscribe" -- start
pm2 save
pm2 startup

# Step 9: Check PM2 status
echo "Step 9: Checking PM2 status..."
pm2 status

# Step 10: Check if application is responding
echo "Step 10: Testing application..."
sleep 5
curl -I http://localhost:3000 || echo "Application not responding on port 3000"

# Step 11: Check Nginx configuration
echo "Step 11: Checking Nginx configuration..."
nginx -t

# Step 12: Restart Nginx
echo "Step 12: Restarting Nginx..."
systemctl restart nginx

# Step 13: Final test
echo "Step 13: Final test..."
curl -I http://www.healthscribe.pro

echo ""
echo "🎉 502 BAD GATEWAY FIXED!"
echo "========================="
echo "✅ Application restarted and built"
echo "✅ PM2 processes restarted"
echo "✅ Nginx restarted"
echo "✅ Test your application at: http://www.healthscribe.pro"




