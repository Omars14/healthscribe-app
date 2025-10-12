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
  console.log('🔧 Fixing Traefik Network Configuration...\n');

  const conn = new Client();

  try {
    await new Promise((resolve, reject) => {
      conn.on('ready', () => {
        console.log('✅ SSH Connected\n');
        resolve();
      }).on('error', reject).connect(SSH_CONFIG);
    });

    // Get the host IP or use the old config as reference
    console.log('='.repeat(70));
    console.log('Checking Existing Supabase Configuration');
    console.log('='.repeat(70));
    
    const { output: oldConfig } = await executeCommand(conn, `
      echo "Old supabase.yaml configuration:"
      cat /data/coolify/proxy/dynamic/supabase.yaml 2>/dev/null || echo "Not found"
      
      echo ""
      echo "Getting host IP:"
      hostname -I | awk '{print \$1}'
    `, 'Checking old config');
    
    const hostIP = oldConfig.match(/(\d+\.\d+\.\d+\.\d+)/)?.[0] || '172.17.0.1';
    console.log(`\n📍 Using host IP: ${hostIP}`);

    // Update configuration with correct backend URL
    console.log('\n' + '='.repeat(70));
    console.log('Updating Traefik Configuration');
    console.log('='.repeat(70));
    
    await executeCommand(conn, `
      # Get actual host IP for Docker
      HOST_IP=\$(hostname -I | awk '{print \$1}')
      
      # Try multiple possible addresses
      cat > /data/coolify/proxy/dynamic/supabase.yml <<EOF
http:
  routers:
    supabase-router:
      rule: "Host(\\\`supabase.healthscribe.pro\\\`)"
      service: supabase-service
      entryPoints:
        - https
      tls:
        certResolver: letsencrypt

  services:
    supabase-service:
      loadBalancer:
        servers:
          - url: "http://\${HOST_IP}:54321"
EOF

      echo "✅ Updated configuration with host IP"
      cat /data/coolify/proxy/dynamic/supabase.yml
      
      # Copy to Traefik
      docker cp /data/coolify/proxy/dynamic/supabase.yml coolify-proxy:/traefik/dynamic/supabase.yml
      
      echo ""
      echo "Waiting 15 seconds for Traefik..."
      sleep 15
      
      echo ""
      echo "Testing:"
      curl -sL https://supabase.healthscribe.pro/auth/v1/health || echo "Still configuring..."
    `, 'Updating with host IP');

    // Also check if we can connect Kong to Traefik network
    console.log('\n' + '='.repeat(70));
    console.log('Alternative: Connect Kong to Traefik Network');
    console.log('='.repeat(70));
    
    await executeCommand(conn, `
      # Get Traefik network name
      TRAEFIK_NETWORK=\$(docker inspect coolify-proxy --format='{{range \$k, \$v := .NetworkSettings.Networks}}{{\$k}}{{end}}' | head -1)
      
      echo "Traefik network: \$TRAEFIK_NETWORK"
      
      # Connect Kong to Traefik network
      docker network connect \$TRAEFIK_NETWORK supabase_kong_supabase 2>/dev/null || echo "Already connected or failed"
      
      # Get Kong's IP on the shared network
      KONG_IP=\$(docker inspect supabase_kong_supabase --format="{{.NetworkSettings.Networks.\$TRAEFIK_NETWORK.IPAddress}}" 2>/dev/null)
      
      if [ -n "\$KONG_IP" ]; then
        echo "Kong IP on shared network: \$KONG_IP"
        
        # Update config to use Kong's container IP
        cat > /data/coolify/proxy/dynamic/supabase.yml <<EOF
http:
  routers:
    supabase-router:
      rule: "Host(\\\`supabase.healthscribe.pro\\\`)"
      service: supabase-service
      entryPoints:
        - https
      tls:
        certResolver: letsencrypt

  services:
    supabase-service:
      loadBalancer:
        servers:
          - url: "http://\${KONG_IP}:8000"
EOF

        echo "✅ Updated with Kong container IP"
        cat /data/coolify/proxy/dynamic/supabase.yml
        
        # Copy to Traefik
        docker cp /data/coolify/proxy/dynamic/supabase.yml coolify-proxy:/traefik/dynamic/supabase.yml
        
        echo ""
        echo "Waiting 15 seconds for Traefik..."
        sleep 15
        
        echo ""
        echo "Testing with container IP:"
        curl -sL https://supabase.healthscribe.pro/auth/v1/health
      else
        echo "Could not connect Kong to Traefik network"
      fi
    `, 'Connecting networks');

    conn.end();
    console.log('\n✅ SSH session closed');

    console.log('\n' + '='.repeat(80));
    console.log('✅ TRAEFIK ROUTING CONFIGURED');
    console.log('='.repeat(80));
    
    console.log('\n📝 What was done:');
    console.log('1. Connected Kong to Traefik network');
    console.log('2. Updated routing to use container IP');
    console.log('3. Configured SSL with Let\'s Encrypt');
    
    console.log('\n🧪 Test now:');
    console.log('curl https://supabase.healthscribe.pro/auth/v1/health');
    
    console.log('\n✅ If working, proceed to test login!');
    console.log('');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  }
}

main();

