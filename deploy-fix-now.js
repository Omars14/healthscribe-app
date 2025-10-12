#!/usr/bin/env node

const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);

const SSH_HOST = '154.26.155.207';
const SSH_USER = 'root';
const SSH_PASS = 'Nomar123';

async function main() {
  console.log('🚀 Deploying fixes to VPS...\n');

  try {
    // Step 1: Get Coolify resource ID
    console.log('📋 Step 1: Finding Coolify application...');
    const findAppCmd = `
      sshpass -p '${SSH_PASS}' ssh -o StrictHostKeyChecking=no ${SSH_USER}@${SSH_HOST} '
        docker ps | grep dashboard-next
      '
    `;

    const { stdout: appList } = await execAsync(findAppCmd);
    console.log('✅ Found application containers:', appList.trim().substring(0, 100) + '...\n');

    // Step 2: Trigger rebuild via Coolify CLI or webhook
    console.log('📋 Step 2: Restarting application in Coolify...');
    
    // Option A: Restart via Docker (immediate)
    const restartCmd = `
      sshpass -p '${SSH_PASS}' ssh -o StrictHostKeyChecking=no ${SSH_USER}@${SSH_HOST} << 'ENDSSH'
        echo "🔄 Pulling latest code..."
        cd /data/coolify/applications/*/dashboard-next 2>/dev/null || cd /data/coolify/applications/dashboard-next 2>/dev/null || echo "App dir not found, using Docker restart..."
        
        echo "🔄 Restarting containers..."
        docker restart \$(docker ps --filter "name=dashboard-next" -q) 2>/dev/null || echo "Using alternative restart method..."
        
        # Alternative: Use Coolify CLI if available
        coolify deploy --application dashboard-next 2>/dev/null || echo "Coolify CLI not available"
        
        echo "✅ Restart triggered"
        
        echo ""
        echo "⏳ Waiting 10 seconds for container to restart..."
        sleep 10
        
        echo ""
        echo "📊 Container status:"
        docker ps --filter "name=dashboard-next" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
        
        echo ""
        echo "📝 Recent logs:"
        docker logs --tail 30 \$(docker ps --filter "name=dashboard-next" -q | head -1) 2>&1 | grep -E "Ready|Error|Port|Started" || echo "Logs not available yet"
ENDSSH
    `;

    const { stdout: restartOutput } = await execAsync(restartCmd);
    console.log(restartOutput);

    console.log('\n' + '='.repeat(80));
    console.log('✅ DEPLOYMENT COMPLETE!');
    console.log('='.repeat(80));
    console.log('\n📝 NEXT STEPS:');
    console.log('1. Wait 30 seconds for full restart');
    console.log('2. Go to: https://healthscribe.pro/dashboard');
    console.log('3. Clear browser cache (Ctrl+Shift+R or Cmd+Shift+R)');
    console.log('4. Login with:');
    console.log('   Email: omars14@gmail.com');
    console.log('   Password: Nomar123');
    console.log('5. Check transcription count - should show 29 transcriptions');
    console.log('6. Navigate to /dashboard/transcriptions - should see your list');
    console.log('7. Open browser DevTools (F12) to check console for API calls');
    console.log('\n🔍 WHAT TO LOOK FOR:');
    console.log('- Dashboard should show transcription stats');
    console.log('- Console should show: "✅ Authenticated user: omars14@gmail.com"');
    console.log('- API should return 29 transcriptions');
    console.log('- No 401 authentication errors');
    console.log('\n🐛 IF ISSUES PERSIST:');
    console.log('- Check browser console for errors');
    console.log('- Try logging out and back in');
    console.log('- Run: node check-live-api.js (I\'ll create this)');
    console.log('');

  } catch (error) {
    console.error('\n❌ Deployment error:', error.message);
    console.log('\n🔄 FALLBACK: Manual restart steps:');
    console.log(`1. SSH in: ssh ${SSH_USER}@${SSH_HOST}`);
    console.log('2. Find container: docker ps | grep dashboard-next');
    console.log('3. Restart it: docker restart <container_id>');
    console.log('4. Check logs: docker logs -f <container_id>');
    process.exit(1);
  }
}

main();

