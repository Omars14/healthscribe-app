#!/usr/bin/env node

const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);

const SSH_HOST = '154.26.155.207';
const SSH_USER = 'root';
const SSH_PASS = 'Nomar123';

async function main() {
  console.log('🔍 Diagnosing Supabase Auth Issues...\n');

  try {
    const diagCmd = `
      sshpass -p '${SSH_PASS}' ssh -o StrictHostKeyChecking=no ${SSH_USER}@${SSH_HOST} << 'ENDSSH'
        echo "📋 Step 1: Check Supabase containers"
        docker ps --filter "name=supabase" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" | head -20
        
        echo ""
        echo "📋 Step 2: Check application environment"
        APP_CONTAINER=\$(docker ps --filter "name=dashboard-next" --format "{{.Names}}" | head -1)
        echo "App container: \$APP_CONTAINER"
        
        if [ -n "\$APP_CONTAINER" ]; then
          echo ""
          echo "Environment variables (Supabase related):"
          docker exec \$APP_CONTAINER env | grep -i supabase || echo "No Supabase env vars found"
        fi
        
        echo ""
        echo "📋 Step 3: Test Supabase auth endpoint"
        echo "Testing: https://supabase.healthscribe.pro/auth/v1/health"
        curl -s -o /dev/null -w "%{http_code}" https://supabase.healthscribe.pro/auth/v1/health || echo " (failed)"
        
        echo ""
        echo ""
        echo "Testing: http://localhost:8000/auth/v1/health (if local)"
        curl -s -o /dev/null -w "%{http_code}" http://localhost:8000/auth/v1/health 2>/dev/null || echo " (not accessible)"
        
        echo ""
        echo ""
        echo "📋 Step 4: Check Kong API Gateway (Supabase API)"
        KONG_CONTAINER=\$(docker ps --filter "name=kong" --format "{{.Names}}" | head -1)
        if [ -n "\$KONG_CONTAINER" ]; then
          echo "Kong container found: \$KONG_CONTAINER"
          docker logs --tail 20 \$KONG_CONTAINER 2>&1 | grep -E "error|Error|auth|Auth" || echo "No relevant errors"
        else
          echo "Kong container not found"
        fi
        
        echo ""
        echo "📋 Step 5: Check GoTrue (Auth service)"
        AUTH_CONTAINER=\$(docker ps --filter "name=auth" --format "{{.Names}}" | head -1)
        if [ -n "\$AUTH_CONTAINER" ]; then
          echo "Auth container found: \$AUTH_CONTAINER"
          docker logs --tail 20 \$AUTH_CONTAINER 2>&1 | grep -E "error|Error|listen|port" || echo "No relevant errors"
        else
          echo "Auth container not found - this is the problem!"
        fi
        
        echo ""
        echo "📋 Step 6: Check database connectivity from auth"
        DB_CONTAINER=\$(docker ps --filter "name=supabase_db_supabase" --format "{{.Names}}" | head -1)
        if [ -n "\$DB_CONTAINER" ]; then
          echo "Database container: \$DB_CONTAINER"
          echo "Testing password authentication..."
          docker exec \$DB_CONTAINER psql -U postgres -d postgres -c "SELECT 'Connection OK' as status;" 2>&1 | head -5
        fi
        
        echo ""
        echo "📋 Step 7: Check if auth.users table exists and is accessible"
        docker exec \$DB_CONTAINER psql -U postgres -d postgres -c "
          SELECT COUNT(*) as user_count FROM auth.users;
        " 2>&1 | head -5
ENDSSH
    `;

    const { stdout } = await execAsync(diagCmd);
    console.log(stdout);

    console.log('\n' + '='.repeat(80));
    console.log('💡 DIAGNOSIS');
    console.log('='.repeat(80));
    console.log('\nLikely issues:');
    console.log('1. ❌ Supabase Auth service (GoTrue) not running');
    console.log('2. ❌ Kong API Gateway misconfigured');
    console.log('3. ❌ Wrong Supabase URL in app env vars');
    console.log('4. ❌ JWT secret mismatch');
    console.log('\n📝 Quick test - try direct signup instead:');
    console.log('Instead of fixing auth, we could:');
    console.log('A. Start the missing Supabase services');
    console.log('B. Or switch back to Supabase Cloud temporarily');
    console.log('C. Or bypass auth and hardcode the session (not recommended)');
    console.log('');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
  }
}

main();

