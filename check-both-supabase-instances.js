#!/usr/bin/env node

const { Client } = require('ssh2');
const fs = require('fs');

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
  console.log('🔍 Checking Both Supabase Instances...\n');

  const conn = new Client();

  try {
    await new Promise((resolve, reject) => {
      conn.on('ready', () => {
        console.log('✅ SSH Connected\n');
        resolve();
      }).on('error', reject).connect(SSH_CONFIG);
    });

    // Step 1: Check both Kong instances
    console.log('='.repeat(70));
    console.log('STEP 1: Comparing Both Supabase Instances');
    console.log('='.repeat(70));
    
    await executeCommand(conn, `
      echo "Instance 1: supabase_kong_supabase"
      echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
      docker inspect supabase_kong_supabase --format='Status: {{.State.Status}}, Created: {{.Created}}' | cut -c1-80
      KONG1_IP=\$(docker inspect supabase_kong_supabase --format='{{.NetworkSettings.Networks.coolify.IPAddress}}')
      echo "Coolify IP: \$KONG1_IP"
      curl -s http://\$KONG1_IP:8000/auth/v1/health | head -c 100
      
      echo ""
      echo ""
      echo "Instance 2: supabase-kong-e088wwks88k8k48sccg8gk0o"
      echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
      docker inspect supabase-kong-e088wwks88k8k48sccg8gk0o --format='Status: {{.State.Status}}, Created: {{.Created}}' 2>/dev/null | cut -c1-80 || echo "Not in coolify network"
      docker inspect supabase-kong-e088wwks88k8k48sccg8gk0o --format='{{range \$k, \$v := .NetworkSettings.Networks}}Network: {{\$k}}, IP: {{.IPAddress}}{{end}}' | head -5
    `, 'Checking instances');

    // Step 2: Check databases in both instances
    console.log('\n' + '='.repeat(70));
    console.log('STEP 2: Checking Users in Both Databases');
    console.log('='.repeat(70));
    
    await executeCommand(conn, `
      echo "Database 1: supabase_db_supabase"
      docker exec supabase_db_supabase psql -U postgres -d postgres -c "SELECT id, email, created_at FROM auth.users WHERE email = 'omars14@gmail.com';" 2>/dev/null || echo "Query failed"
      
      echo ""
      echo "Database 2: supabase-db-e088wwks88k8k48sccg8gk0o"
      docker exec supabase-db-e088wwks88k8k48sccg8gk0o psql -U postgres -d postgres -c "SELECT id, email, created_at FROM auth.users WHERE email = 'omars14@gmail.com';" 2>/dev/null || echo "Query failed or container not found"
    `, 'Checking databases');

    // Step 3: Check which instance has transcriptions
    console.log('\n' + '='.repeat(70));
    console.log('STEP 3: Checking Transcriptions in Both Databases');
    console.log('='.repeat(70));
    
    await executeCommand(conn, `
      echo "Transcriptions in supabase_db_supabase:"
      docker exec supabase_db_supabase psql -U postgres -d postgres -c "SELECT COUNT(*) FROM public.transcriptions;" 2>/dev/null || echo "Table may not exist"
      
      echo ""
      echo "Transcriptions in supabase-db-e088wwks88k8k48sccg8gk0o:"
      docker exec supabase-db-e088wwks88k8k48sccg8gk0o psql -U postgres -d postgres -c "SELECT COUNT(*) FROM public.transcriptions;" 2>/dev/null || echo "Table may not exist"
    `, 'Checking transcriptions');

    // Step 4: Test login on second instance's auth
    console.log('\n' + '='.repeat(70));
    console.log('STEP 4: Finding Working Instance');
    console.log('='.repeat(70));
    
    await executeCommand(conn, `
      echo "Getting Kong IPs for both instances..."
      KONG1_IP=\$(docker inspect supabase_kong_supabase --format='{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}' | awk '{print \$1}')
      KONG2_IP=\$(docker inspect supabase-kong-e088wwks88k8k48sccg8gk0o --format='{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}' | awk '{print \$1}')
      
      echo "Kong 1 IP: \$KONG1_IP"
      echo "Kong 2 IP: \$KONG2_IP"
      
      echo ""
      echo "Testing Instance 1 auth health..."
      curl -s http://\$KONG1_IP:8000/auth/v1/health | jq '.version' 2>/dev/null || echo "Failed"
      
      echo ""
      echo "Testing Instance 2 auth health..."
      curl -s http://\$KONG2_IP:8000/auth/v1/health | jq '.version' 2>/dev/null || echo "Failed"
    `, 'Finding working instance');

    // Step 5: Check Coolify application configuration
    console.log('\n' + '='.repeat(70));
    console.log('STEP 5: Which Instance is Coolify Using?');
    console.log('='.repeat(70));
    
    await executeCommand(conn, `
      echo "Checking application container environment..."
      docker exec tkwoos4soccckws84088wc04-170735192160 env | grep "SUPABASE_URL" || echo "Not found in container"
      
      echo ""
      echo "Checking if application can reach Supabase..."
      docker exec tkwoos4soccckws84088wc04-170735192160 wget -qO- https://supabase.healthscribe.pro/auth/v1/health 2>&1 | head -3
    `, 'Checking Coolify config');

    conn.end();
    console.log('\n✅ SSH session closed');

    console.log('\n' + '='.repeat(80));
    console.log('📊 ANALYSIS COMPLETE');
    console.log('='.repeat(80));
    
    console.log('\n🔍 Key Questions:');
    console.log('━'.repeat(80));
    console.log('1. Which instance was created first (the working one from last week)?');
    console.log('2. Which instance has the user data and transcriptions?');
    console.log('3. Which instance should Traefik route to?');
    console.log('━'.repeat(80));

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  }
}

main();

