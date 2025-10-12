#!/usr/bin/env node

const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);

const SSH_HOST = '154.26.155.207';
const SSH_USER = 'root';
const SSH_PASS = 'Nomar123';

async function main() {
  console.log('🔍 Comprehensive VPS Supabase Diagnostics...\n');

  try {
    const diagCmd = `
      sshpass -p '${SSH_PASS}' ssh -o StrictHostKeyChecking=no ${SSH_USER}@${SSH_HOST} << 'ENDSSH'
        echo "============================================"
        echo "1. ALL DOCKER CONTAINERS"
        echo "============================================"
        docker ps -a --format "table {{.Names}}\t{{.Image}}\t{{.Status}}\t{{.Ports}}" | grep -v "NAMES"
        
        echo ""
        echo "============================================"
        echo "2. SUPABASE-RELATED CONTAINERS"
        echo "============================================"
        docker ps -a | grep -i supabase || echo "No Supabase containers found"
        
        echo ""
        echo "============================================"
        echo "3. DOCKER COMPOSE FILES"
        echo "============================================"
        find /data /root /opt -name "docker-compose.yml" 2>/dev/null | while read file; do
          if grep -q "supabase" "\$file" 2>/dev/null; then
            echo "📁 Found Supabase config: \$file"
          fi
        done
        
        echo ""
        echo "============================================"
        echo "4. SUPABASE DIRECTORIES"
        echo "============================================"
        find /data /root /opt -type d -name "*supabase*" 2>/dev/null | head -10
        
        echo ""
        echo "============================================"
        echo "5. COOLIFY APPLICATION STRUCTURE"
        echo "============================================"
        ls -la /data/coolify/applications/ 2>/dev/null || echo "Coolify apps not found"
        
        echo ""
        echo "============================================"
        echo "6. CHECK FOR KONG (Supabase API Gateway)"
        echo "============================================"
        docker ps -a | grep -i kong || echo "Kong not found"
        
        echo ""
        echo "============================================"
        echo "7. CHECK FOR GOTRUE (Supabase Auth)"
        echo "============================================"
        docker ps -a | grep -i "gotrue\|auth" || echo "GoTrue not found"
        
        echo ""
        echo "============================================"
        echo "8. LISTENING PORTS"
        echo "============================================"
        netstat -tlnp 2>/dev/null | grep -E "8000|5432|3000|5678" || ss -tlnp | grep -E "8000|5432|3000|5678"
        
        echo ""
        echo "============================================"
        echo "9. NGINX CONFIGURATION"
        echo "============================================"
        find /etc/nginx /data -name "*.conf" -type f 2>/dev/null | while read conf; do
          if grep -q "supabase" "\$conf" 2>/dev/null; then
            echo "📁 \$conf"
            grep -A 5 "server_name.*supabase" "\$conf" 2>/dev/null
          fi
        done
        
        echo ""
        echo "============================================"
        echo "10. ENVIRONMENT VARIABLES (App Container)"
        echo "============================================"
        APP_CONTAINER=\$(docker ps --filter "name=dashboard-next" --format "{{.Names}}" | head -1)
        if [ -n "\$APP_CONTAINER" ]; then
          echo "App container: \$APP_CONTAINER"
          docker exec "\$APP_CONTAINER" env 2>/dev/null | grep -i supabase | sed 's/=.*/=***/'
        fi
        
        echo ""
        echo "============================================"
        echo "11. DATABASE CONTAINER DETAILS"
        echo "============================================"
        DB_CONTAINERS=\$(docker ps --filter "name=db" --format "{{.Names}}")
        for container in \$DB_CONTAINERS; do
          echo ""
          echo "📦 Container: \$container"
          docker inspect "\$container" --format '{{.Config.Image}}' 2>/dev/null
          docker exec "\$container" psql --version 2>/dev/null || echo "  Not PostgreSQL"
        done
ENDSSH
    `;

    const { stdout } = await execAsync(diagCmd);
    console.log(stdout);

    console.log('\n' + '='.repeat(80));
    console.log('💡 ANALYSIS');
    console.log('='.repeat(80));
    console.log('\nBased on the output above, I can determine:');
    console.log('1. If Supabase services are installed');
    console.log('2. If they are running or stopped');
    console.log('3. Where the configuration files are');
    console.log('4. What needs to be started');
    console.log('\nLet me analyze this and create a fix...');
    console.log('');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
  }
}

main();

