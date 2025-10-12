#!/usr/bin/env node

const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);

const SSH_HOST = '154.26.155.207';
const SSH_USER = 'root';
const SSH_PASS = 'Nomar123';

async function main() {
  console.log('🔍 Checking App Supabase Configuration...\n');

  try {
    const cmd = `
      sshpass -p '${SSH_PASS}' ssh -o StrictHostKeyChecking=no ${SSH_USER}@${SSH_HOST} << 'ENDSSH'
        APP_CONTAINER=\$(docker ps --filter "name=dashboard-next" --format "{{.Names}}" | grep -m 1 "dashboard")
        
        if [ -z "\$APP_CONTAINER" ]; then
          echo "❌ App container not found"
          exit 1
        fi
        
        echo "✅ App container: \$APP_CONTAINER"
        echo ""
        echo "📋 Supabase Configuration:"
        docker exec \$APP_CONTAINER env | grep -E "SUPABASE_URL|SUPABASE.*KEY" | sed 's/=.*/=***/' 
        
        echo ""
        echo "📋 Full Supabase URL:"
        docker exec \$APP_CONTAINER env | grep "NEXT_PUBLIC_SUPABASE_URL"
        
        echo ""
        echo "📋 Testing connectivity to Supabase URL:"
        SUPABASE_URL=\$(docker exec \$APP_CONTAINER env | grep "NEXT_PUBLIC_SUPABASE_URL" | cut -d= -f2)
        echo "URL: \$SUPABASE_URL"
        
        if [ -n "\$SUPABASE_URL" ]; then
          echo "Testing health endpoint..."
          curl -s -o /dev/null -w "HTTP %{http_code}" "\${SUPABASE_URL}/auth/v1/health" 2>&1
          echo ""
        fi
ENDSSH
    `;

    const { stdout } = await execAsync(cmd);
    console.log(stdout);

    console.log('\n' + '='.repeat(80));
    console.log('💡 ANALYSIS');
    console.log('='.repeat(80));
    console.log('\nBased on the output above:');
    console.log('- If URL is https://supabase.healthscribe.pro → Self-hosted (may not be working)');
    console.log('- If URL contains supabase.co → Cloud (should work)');
    console.log('- If health check returns 200 → Auth service is working');
    console.log('- If health check fails → Auth service is down');
    console.log('\n📝 RECOMMENDATIONS:');
    console.log('1. If self-hosted auth is down, we need to either:');
    console.log('   A. Fix/start the auth service');
    console.log('   B. Switch back to Supabase Cloud temporarily');
    console.log('2. The transcription API fix is good, but users can\'t log in');
    console.log('3. Quick fix: Update env vars to use Supabase Cloud');
    console.log('');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
  }
}

main();

