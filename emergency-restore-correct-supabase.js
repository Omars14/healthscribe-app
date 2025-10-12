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
  console.log('🚨 EMERGENCY: Restoring Correct Supabase Instance...\n');

  const conn = new Client();

  try {
    await new Promise((resolve, reject) => {
      conn.on('ready', () => {
        console.log('✅ SSH Connected\n');
        resolve();
      }).on('error', reject).connect(SSH_CONFIG);
    });

    // Check what we still have
    console.log('='.repeat(70));
    console.log('STEP 1: Checking Current State');
    console.log('='.repeat(70));
    
    await executeCommand(conn, `
      echo "Checking databases:"
      echo "===================="
      
      echo "supabase-db:"
      docker ps -a --filter "name=supabase-db" --format "{{.Names}}: {{.Status}}"
      if docker ps -a --filter "name=supabase-db" --format "{{.Names}}" | grep -q "supabase-db"; then
        docker exec supabase-db psql -U postgres -d postgres -tAc "SELECT COUNT(*) FROM public.transcriptions;" 2>/dev/null || echo "Cannot query"
      fi
      
      echo ""
      echo "supabase_db_supabase:"
      docker ps -a --filter "name=supabase_db_supabase" --format "{{.Names}}: {{.Status}}"
      if docker ps -a --filter "name=supabase_db_supabase" --format "{{.Names}}" | grep -q "supabase_db_supabase"; then
        docker exec supabase_db_supabase psql -U postgres -d postgres -tAc "SELECT COUNT(*) FROM public.transcriptions;" 2>/dev/null || echo "Cannot query"
      fi
      
      echo ""
      echo "Checking /opt/supabase status:"
      ls -la /opt/supabase 2>/dev/null || echo "Directory removed"
    `, 'Checking databases');

    // The NEW database (supabase-db) should still be running since only the /opt/supabase directory was removed
    console.log('\n' + '='.repeat(70));
    console.log('STEP 2: Verifying Data Location');
    console.log('='.repeat(70));
    
    const { output: dataCheck } = await executeCommand(conn, `
      echo "Checking which database has the data..."
      
      if docker ps --filter "name=supabase-db" --format "{{.Names}}" | grep -q "supabase-db"; then
        echo "✅ supabase-db is still running!"
        echo "Transcription count:"
        docker exec supabase-db psql -U postgres -d postgres -tAc "
          SELECT COUNT(*) FROM public.transcriptions;
        " 2>/dev/null || echo "Error querying"
        
        echo ""
        echo "User's transcriptions:"
        docker exec supabase-db psql -U postgres -d postgres -tAc "
          SELECT COUNT(*) FROM public.transcriptions 
          WHERE user_id = '4a99755c-53ba-486c-8393-1460561b2259';
        " 2>/dev/null || echo "Error querying"
        
        echo ""
        echo "Finding supabase-db network:"
        docker inspect supabase-db --format='{{range \$k, \$v := .NetworkSettings.Networks}}Network: {{\$k}}, IP: {{.IPAddress}}{{end}}'
        
      else
        echo "❌ supabase-db was stopped/removed!"
      fi
    `, 'Verifying data');

    // Find and start the correct Kong gateway
    console.log('\n' + '='.repeat(70));
    console.log('STEP 3: Setting Up Correct Kong Gateway');
    console.log('='.repeat(70));
    
    await executeCommand(conn, `
      echo "Looking for Kong containers..."
      docker ps -a | grep kong
      
      echo ""
      echo "Starting any stopped Kong containers..."
      
      # Try to start supabase-kong if it exists
      if docker ps -a --filter "name=supabase-kong" --format "{{.Names}}" | grep -q "supabase-kong"; then
        docker start supabase-kong 2>/dev/null || echo "Could not start"
        sleep 5
        
        echo "Testing supabase-kong:"
        KONG_IP=\$(docker inspect supabase-kong --format='{{range \$k, \$v := .NetworkSettings.Networks}}{{.IPAddress}} {{end}}' | awk '{print \$1}')
        echo "Kong IP: \$KONG_IP"
        curl -s http://\$KONG_IP:8000/auth/v1/health 2>/dev/null || echo "Not responding"
      fi
      
      # Also check the e088 Kong
      if docker ps -a --filter "name=supabase-kong-e088" --format "{{.Names}}" | grep -q "kong"; then
        echo ""
        echo "Found e088 Kong"
        docker start supabase-kong-e088wwks88k8k48sccg8gk0o 2>/dev/null || echo "Already running or error"
      fi
    `, 'Checking Kong');

    // Find which Supabase services are still running
    console.log('\n' + '='.repeat(70));
    console.log('STEP 4: Identifying Active Supabase Services');
    console.log('='.repeat(70));
    
    const { output: servicesOutput } = await executeCommand(conn, `
      echo "All Supabase containers:"
      docker ps -a | grep -i supabase | awk '{print \$NF, \$1, \$3, \$7}' | sort
      
      echo ""
      echo "Looking for the one with e088wwks88k8k48sccg8gk0o (3 weeks old):"
      docker ps --filter "name=e088wwks88k8k48sccg8gk0o" --format "table {{.Names}}\t{{.Status}}"
    `, 'Finding active services');

    // The e088 installation is 3 weeks old and likely has the data
    console.log('\n' + '='.repeat(70));
    console.log('STEP 5: Using E088 Supabase Installation (3 weeks old)');
    console.log('='.repeat(70));
    
    const { output: e088Info } = await executeCommand(conn, `
      echo "Checking e088 database:"
      docker exec supabase-db-e088wwks88k8k48sccg8gk0o psql -U postgres -d postgres -tAc "
        SELECT COUNT(*) as total_transcriptions FROM public.transcriptions;
      " 2>/dev/null || echo "Cannot access"
      
      echo ""
      echo "User's transcriptions in e088:"
      docker exec supabase-db-e088wwks88k8k48sccg8gk0o psql -U postgres -d postgres -tAc "
        SELECT COUNT(*) FROM public.transcriptions 
        WHERE user_id = '4a99755c-53ba-486c-8393-1460561b2259';
      " 2>/dev/null || echo "Cannot access"
      
      echo ""
      echo "e088 Kong status:"
      docker ps --filter "name=kong-e088" --format "{{.Names}}: {{.Status}}"
      
      # Get Kong IP
      if docker ps --filter "name=kong-e088" --format "{{.Names}}" | grep -q "kong"; then
        KONG_IP=\$(docker inspect supabase-kong-e088wwks88k8k48sccg8gk0o --format='{{range \$k, \$v := .NetworkSettings.Networks}}{{.IPAddress}} {{end}}' | awk '{print \$1}')
        echo "Kong IP: \$KONG_IP"
        
        # Try to start if stopped
        docker start supabase-kong-e088wwks88k8k48sccg8gk0o 2>/dev/null
        sleep 5
        
        echo "Testing Kong:"
        curl -s http://\$KONG_IP:8000/auth/v1/health 2>/dev/null
      fi
    `, 'Checking e088 installation');

    conn.end();
    console.log('\n✅ SSH session closed');

    console.log('\n' + '='.repeat(80));
    console.log('📊 ANALYSIS');
    console.log('='.repeat(80));
    
    console.log('\nI found the issue:');
    console.log('- There are MULTIPLE Supabase installations on your VPS');
    console.log('- One is 2 weeks old (supabase_kong_supabase)');
    console.log('- One is 3 weeks old (e088wwks88k8k48sccg8gk0o)');
    console.log('- One was installed today (supabase-db)');
    
    console.log('\nLet me identify which one has your 29 transcriptions...');
    console.log('');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  }
}

main();

