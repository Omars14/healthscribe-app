#!/bin/bash

echo "🚀 Restarting Application"
echo "========================="

# Make the script executable
chmod +x restart-application.js

# Run the restart script
node restart-application.js

echo ""
echo "🎉 Application restart script completed!"
echo ""
echo "📝 If you still get 502 Bad Gateway:"
echo "1. Wait 30 seconds and try again"
echo "2. Check PM2 status: pm2 status"
echo "3. Check logs: pm2 logs healthscribe"
echo "4. Try: pm2 restart healthscribe"




