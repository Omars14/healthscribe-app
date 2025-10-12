#!/usr/bin/env node

const { Client } = require('ssh2');

const SSH_CONFIG = {
  host: '154.26.155.207',
  port: 22,
  username: 'root',
  password: 'Nomar123'
};

function executeCommand(conn, command, description) {
  return new Promise((resolve, reject) => {
    if (description) console.log(`\n🔧 ${description}...`);
    
    conn.exec(command, (err, stream) => {
      if (err) {
        reject(err);
        return;
      }

      let output = '';
      let errorOutput = '';

      stream.on('close', (code, signal) => {
        resolve({ output, errorOutput, code });
      }).on('data', (data) => {
        output += data.toString();
        process.stdout.write(data.toString());
      }).stderr.on('data', (data) => {
        errorOutput += data.toString();
      });
    });
  });
}

async function main() {
  console.log('🔍 Checking Traefik Routing Configuration...\n');

  const conn = new Client();

  try {
    await new Promise((resolve, reject) => {
      conn.on('ready', () => {
        console.log('✅ SSH Connected\n');
        resolve();
      }).on('error', reject).connect(SSH_CONFIG);
    });

    // Step 1: Find all Supabase-related containers
    console.log('='.repeat(70));
    console.log('STEP 1: Discovering All Supabase Containers');
    console.log('='.repeat(70));
    
    await executeCommand(conn, `
      echo "All Supabase-related containers:"
      docker ps -a --format "table {{.Names}}\t{{.Image}}\t{{.Status}}\t{{.Ports}}" | grep -i supabase || echo "None found"
      
      echo ""
      echo "All Kong containers:"
      docker ps -a --format "table {{.Names}}\t{{.Image}}\t{{.Status}}\t{{.Ports}}" | grep -i kong || echo "None found"
    `, 'Finding Supabase containers');

    // Step 2: Check Traefik configuration
    console.log('\n' + '='.repeat(70));
    console.log('STEP 2: Checking Traefik Configuration');
    console.log('='.repeat(70));
    
    await executeCommand(conn, `
      echo "Traefik container:"
      docker ps --filter "name=coolify-proxy" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
      
      echo ""
      echo "Checking Traefik labels on containers..."
      
      # Check old Supabase Kong
      OLD_KONG=\$(docker ps -q --filter "name=supabase_kong_supabase")
      if [ -n "\$OLD_KONG" ]; then
        echo ""
        echo "🔍 OLD Supabase Kong labels:"
        docker inspect \$OLD_KONG | grep -A 20 "Labels" | grep traefik || echo "No Traefik labels"
      fi
      
      # Check new Supabase Kong
      NEW_KONG=\$(docker ps -q --filter "name=supabase-kong")
      if [ -n "\$NEW_KONG" ]; then
        echo ""
        echo "🔍 NEW Supabase Kong labels:"
        docker inspect \$NEW_KONG | grep -A 20 "Labels" | grep traefik || echo "No Traefik labels"
      fi
    `, 'Checking Traefik labels');

    // Step 3: Check which Supabase has the data
    console.log('\n' + '='.repeat(70));
    console.log('STEP 3: Identifying Active Database');
    console.log('='.repeat(70));
    
    const { output: dbCheck } = await executeCommand(conn, `
      echo "Checking old database (supabase_db_supabase):"
      docker exec supabase_db_supabase psql -U postgres -d postgres -tAc "
        SELECT COUNT(*) as transcriptions FROM public.transcriptions;
        SELECT COUNT(*) as users FROM auth.users;
      " 2>/dev/null || echo "Old DB not accessible"
      
      echo ""
      echo "Checking new database (supabase-db):"
      docker exec supabase-db psql -U postgres -d postgres -tAc "
        SELECT COUNT(*) as transcriptions FROM public.transcriptions;
        SELECT COUNT(*) as users FROM auth.users;
      " 2>/dev/null || echo "New DB not accessible"
    `, 'Checking databases');

    // Step 4: Check Kong ports and accessibility
    console.log('\n' + '='.repeat(70));
    console.log('STEP 4: Testing Kong Gateways');
    console.log('='.repeat(70));
    
    await executeCommand(conn, `
      echo "Testing old Kong gateway:"
      OLD_KONG_PORT=\$(docker port supabase_kong_supabase 2>/dev/null | grep "8000" | cut -d: -f2 | head -1)
      if [ -n "\$OLD_KONG_PORT" ]; then
        echo "Old Kong on port: \$OLD_KONG_PORT"
        curl -s http://localhost:\$OLD_KONG_PORT/auth/v1/health || echo "Not responding"
      else
        echo "Old Kong port not found"
      fi
      
      echo ""
      echo "Testing new Kong gateway:"
      curl -s http://localhost:8000/auth/v1/health || echo "New Kong not responding"
    `, 'Testing Kong gateways');

    // Step 5: Check Coolify application configuration
    console.log('\n' + '='.repeat(70));
    console.log('STEP 5: Checking Coolify Applications');
    console.log('='.repeat(70));
    
    await executeCommand(conn, `
      echo "Coolify applications directory:"
      ls -la /data/coolify/applications/ 2>/dev/null || echo "Not found"
      
      echo ""
      echo "Searching for Supabase application config..."
      find /data/coolify -name "*supabase*" -type d 2>/dev/null | head -10
      
      echo ""
      echo "Dashboard Next.js application:"
      find /data/coolify -name "*dashboard*" -type d 2>/dev/null | head -5
    `, 'Checking Coolify apps');

    // Step 6: Check which port the old Kong is on
    console.log('\n' + '='.repeat(70));
    console.log('STEP 6: Port Mapping Analysis');
    console.log('='.repeat(70));
    
    const { output: portOutput } = await executeCommand(conn, `
      echo "All port mappings:"
      docker ps --format "table {{.Names}}\t{{.Ports}}" | grep -E "supabase|kong"
      
      echo ""
      echo "Listening ports on the system:"
      netstat -tlnp 2>/dev/null | grep -E ":8000|:8001|:3000" || ss -tlnp | grep -E ":8000|:8001|:3000"
    `, 'Checking port mappings');

    // Step 7: Test external access
    console.log('\n' + '='.repeat(70));
    console.log('STEP 7: Testing External URLs');
    console.log('='.repeat(70));
    
    await executeCommand(conn, `
      echo "Testing https://supabase.healthscribe.pro/auth/v1/health"
      curl -sL https://supabase.healthscribe.pro/auth/v1/health 2>&1 | head -5
      
      echo ""
      echo "Testing http://supabase.healthscribe.pro/auth/v1/health"
      curl -sL http://supabase.healthscribe.pro/auth/v1/health 2>&1 | head -5
    `, 'Testing external URLs');

    // Step 8: Check Traefik routing rules
    console.log('\n' + '='.repeat(70));
    console.log('STEP 8: Traefik Routing Rules');
    console.log('='.repeat(70));
    
    await executeCommand(conn, `
      echo "Checking Traefik dynamic configuration:"
      docker exec coolify-proxy cat /etc/traefik/dynamic/* 2>/dev/null | grep -A 10 "supabase" || echo "No dynamic config found"
      
      echo ""
      echo "Checking for Traefik config files:"
      find /data/coolify -name "*.toml" -o -name "*.yml" -o -name "*.yaml" | grep -i traefik | head -10
    `, 'Checking Traefik config');

    conn.end();
    console.log('\n✅ SSH session closed');

    console.log('\n' + '='.repeat(80));
    console.log('📊 ANALYSIS');
    console.log('='.repeat(80));
    
    // Determine which setup to use
    if (dbCheck.includes('29') && dbCheck.match(/old|supabase_db_supabase/i)) {
      console.log('\n✅ FOUND: Old Supabase installation has your data (29 transcriptions)');
      console.log('📍 Container: supabase_kong_supabase');
      console.log('🔧 Action: Need to configure Traefik to route to old Kong gateway');
    }
    
    console.log('\n🎯 Next Actions Required:');
    console.log('1. Identify which Kong port is exposed');
    console.log('2. Configure Traefik labels or routing to that port');
    console.log('3. Test external access');
    console.log('');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  }
}

main();

