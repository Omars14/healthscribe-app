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
  console.log('🔍 Diagnosing and Fixing Supabase Routing...\n');

  const conn = new Client();

  try {
    await new Promise((resolve, reject) => {
      conn.on('ready', () => {
        console.log('✅ SSH Connected\n');
        resolve();
      }).on('error', reject).connect(SSH_CONFIG);
    });

    // Step 1: Check all Supabase containers
    console.log('='.repeat(70));
    console.log('STEP 1: Checking Supabase Services');
    console.log('='.repeat(70));
    
    await executeCommand(conn, `
      echo "Supabase container status:"
      docker ps --filter "name=supabase" --format "table {{.Names}}\t{{.Status}}" | head -20
      
      echo ""
      echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
      echo ""
      
      echo "Checking Kong logs (last 20 lines):"
      docker logs supabase_kong_supabase --tail 20 2>&1 | grep -v "GET /auth/v1/health HTTP"
    `, 'Checking services');

    // Step 2: Check database directly
    console.log('\n' + '='.repeat(70));
    console.log('STEP 2: Checking Database Directly');
    console.log('='.repeat(70));
    
    await executeCommand(conn, `
      echo "Checking if database is accepting connections..."
      docker exec supabase_db_supabase psql -U postgres -d postgres -c "SELECT version();" | head -3
      
      echo ""
      echo "Checking for omars14@gmail.com user..."
      docker exec supabase_db_supabase psql -U postgres -d postgres -c "SELECT id, email, created_at FROM auth.users WHERE email = 'omars14@gmail.com';"
      
      echo ""
      echo "Checking user profile..."
      docker exec supabase_db_supabase psql -U postgres -d postgres -c "SELECT id, email, role FROM public.user_profiles WHERE email = 'omars14@gmail.com';"
      
      echo ""
      echo "Checking transcriptions..."
      docker exec supabase_db_supabase psql -U postgres -d postgres -c "SELECT COUNT(*) as count FROM public.transcriptions WHERE user_id = '4a99755c-53ba-486c-8393-1460561b2259';"
    `, 'Checking database');

    // Step 3: Check Traefik routing
    console.log('\n' + '='.repeat(70));
    console.log('STEP 3: Checking Traefik Configuration');
    console.log('='.repeat(70));
    
    await executeCommand(conn, `
      echo "Checking Traefik labels on Kong container..."
      docker inspect supabase_kong_supabase --format '{{json .Config.Labels}}' | jq '.'
      
      echo ""
      echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
      echo ""
      
      echo "Testing Kong directly (internal)..."
      KONG_IP=\$(docker inspect supabase_kong_supabase --format='{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}' | awk '{print \$1}')
      echo "Kong IP: \$KONG_IP"
      curl -s http://\$KONG_IP:8000/auth/v1/health
      
      echo ""
      echo ""
      echo "Testing via localhost:54321..."
      curl -s http://localhost:54321/auth/v1/health
    `, 'Checking Traefik');

    // Step 4: Check if Traefik can see the service
    console.log('\n' + '='.repeat(70));
    console.log('STEP 4: Checking Traefik Dashboard');
    console.log('='.repeat(70));
    
    await executeCommand(conn, `
      echo "Finding Traefik container..."
      docker ps | grep traefik
      
      echo ""
      echo "Checking Traefik routers..."
      docker logs \$(docker ps -q --filter "name=traefik") --tail 50 2>&1 | grep -i supabase || echo "No Supabase routing found in Traefik logs"
      
      echo ""
      echo "Checking Coolify proxy network..."
      docker network inspect coolify 2>/dev/null | jq '.[0].Containers | with_entries(select(.value.Name | contains("supabase") or contains("kong")))' || echo "Network check failed"
    `, 'Checking Traefik');

    // Step 5: Get Kong network info
    console.log('\n' + '='.repeat(70));
    console.log('STEP 5: Network Configuration');
    console.log('='.repeat(70));
    
    await executeCommand(conn, `
      echo "Kong network connections:"
      docker inspect supabase_kong_supabase --format='{{json .NetworkSettings.Networks}}' | jq '.'
      
      echo ""
      echo "Is Kong in coolify network?"
      docker network inspect coolify 2>/dev/null | grep supabase_kong || echo "Kong not in coolify network"
    `, 'Checking network');

    conn.end();
    console.log('\n✅ SSH session closed');

    console.log('\n' + '='.repeat(80));
    console.log('📊 DIAGNOSIS COMPLETE');
    console.log('='.repeat(80));
    
    console.log('\n🔍 Key Issues to Check:');
    console.log('━'.repeat(80));
    console.log('1. Is Kong container healthy and responding on localhost:54321?');
    console.log('2. Is Kong in the coolify network for Traefik to route to it?');
    console.log('3. Are there Traefik labels on the Kong container?');
    console.log('4. Is the database responding with user data?');
    console.log('━'.repeat(80));

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  }
}

main();

