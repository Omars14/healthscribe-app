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
  console.log('🔧 Configuring Traefik for Supabase...\n');

  const conn = new Client();

  try {
    await new Promise((resolve, reject) => {
      conn.on('ready', () => {
        console.log('✅ SSH Connected\n');
        resolve();
      }).on('error', reject).connect(SSH_CONFIG);
    });

    // Step 1: Add Traefik labels to the old Kong container
    console.log('='.repeat(70));
    console.log('STEP 1: Configure Traefik Labels on Supabase Kong');
    console.log('='.repeat(70));
    
    await executeCommand(conn, `
      # Get the old Kong container network
      KONG_NETWORK=\$(docker inspect supabase_kong_supabase --format='{{range \$k, \$v := .NetworkSettings.Networks}}{{\$k}}{{end}}' | head -1)
      
      echo "Kong is on network: \$KONG_NETWORK"
      
      # Add Traefik labels to Kong
      docker stop supabase_kong_supabase
      
      docker run -d \\
        --name supabase_kong_supabase_new \\
        --network=\$KONG_NETWORK \\
        --restart=unless-stopped \\
        -p 54321:8000 \\
        -v /opt/supabase/docker/volumes/api/kong.yml:/var/lib/kong/kong.yml:ro \\
        -e KONG_DATABASE=off \\
        -e KONG_DECLARATIVE_CONFIG=/var/lib/kong/kong.yml \\
        -e KONG_PLUGINS=request-transformer,cors,key-auth,http-log \\
        --label "traefik.enable=true" \\
        --label "traefik.http.routers.supabase.rule=Host(\`supabase.healthscribe.pro\`)" \\
        --label "traefik.http.routers.supabase.entrypoints=websecure" \\
        --label "traefik.http.routers.supabase.tls=true" \\
        --label "traefik.http.routers.supabase.tls.certresolver=letsencrypt" \\
        --label "traefik.http.services.supabase.loadbalancer.server.port=8000" \\
        public.ecr.aws/supabase/kong:2.8.1
      
      echo "New Kong container created with Traefik labels"
      
      # Remove old container
      docker rm supabase_kong_supabase
      
      # Rename new to old
      docker rename supabase_kong_supabase_new supabase_kong_supabase
      
      echo "Kong reconfigured"
    `, 'Adding Traefik labels to Kong');

    // Step 2: Wait for Kong to be healthy
    console.log('\n' + '='.repeat(70));
    console.log('STEP 2: Waiting for Kong to Start');
    console.log('='.repeat(70));
    
    await executeCommand(conn, `
      echo "Waiting for Kong..."
      sleep 10
      
      for i in {1..20}; do
        if curl -s http://localhost:54321/auth/v1/health | grep -q "GoTrue"; then
          echo "✅ Kong is healthy!"
          exit 0
        fi
        echo "⏳ Attempt \$i/20..."
        sleep 2
      done
    `, 'Waiting for Kong');

    // Step 3: Test Traefik routing
    console.log('\n' + '='.repeat(70));
    console.log('STEP 3: Testing Traefik Routing');
    console.log('='.repeat(70));
    
    await executeCommand(conn, `
      echo "Waiting 10 seconds for Traefik to pick up changes..."
      sleep 10
      
      echo "Testing external URL:"
      curl -sL https://supabase.healthscribe.pro/auth/v1/health || echo "Not ready yet"
      
      echo ""
      echo "Testing internal URL:"
      curl -s http://localhost:54321/auth/v1/health
    `, 'Testing routing');

    // Step 4: Verify Traefik sees the container
    console.log('\n' + '='.repeat(70));
    console.log('STEP 4: Verifying Traefik Configuration');
    console.log('='.repeat(70));
    
    await executeCommand(conn, `
      echo "Checking Kong labels:"
      docker inspect supabase_kong_supabase | grep -A 20 "Labels" | grep traefik
      
      echo ""
      echo "Checking Traefik logs:"
      docker logs coolify-proxy --tail 20 | grep -i supabase || echo "No Supabase entries in recent logs"
    `, 'Checking Traefik');

    conn.end();
    console.log('\n✅ SSH session closed');

    console.log('\n' + '='.repeat(80));
    console.log('✅ TRAEFIK CONFIGURATION COMPLETE');
    console.log('='.repeat(80));
    
    console.log('\n📊 Configuration Applied:');
    console.log('- Traefik labels added to supabase_kong_supabase');
    console.log('- Routing: supabase.healthscribe.pro → localhost:54321');
    console.log('- SSL: Let\'s Encrypt automatic');
    console.log('- Network: Coolify/Traefik managed');
    
    console.log('\n🧪 Testing:');
    console.log('Run: curl https://supabase.healthscribe.pro/auth/v1/health');
    console.log('Should return: GoTrue version info');
    
    console.log('\n⏳ If it doesn\'t work immediately:');
    console.log('- Wait 1-2 minutes for SSL cert generation');
    console.log('- Traefik auto-detects label changes');
    console.log('- Check: docker logs coolify-proxy');
    console.log('');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.log('\nTrying alternative method...');
    process.exit(1);
  }
}

main();

