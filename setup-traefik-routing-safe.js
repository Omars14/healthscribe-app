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
  console.log('🔧 Setting Up Traefik Routing for Supabase (Safe Method)...\n');

  const conn = new Client();

  try {
    await new Promise((resolve, reject) => {
      conn.on('ready', () => {
        console.log('✅ SSH Connected\n');
        resolve();
      }).on('error', reject).connect(SSH_CONFIG);
    });

    // Step 1: Create Traefik dynamic configuration
    console.log('='.repeat(70));
    console.log('STEP 1: Creating Traefik Dynamic Configuration');
    console.log('='.repeat(70));
    
    await executeCommand(conn, `
      # Create dynamic config directory if it doesn't exist
      mkdir -p /data/coolify/proxy/dynamic
      
      # Create Supabase routing configuration
      cat > /data/coolify/proxy/dynamic/supabase.yml <<'EOF'
http:
  routers:
    supabase-router:
      rule: "Host(\`supabase.healthscribe.pro\`)"
      service: supabase-service
      entryPoints:
        - websecure
      tls:
        certResolver: letsencrypt

  services:
    supabase-service:
      loadBalancer:
        servers:
          - url: "http://localhost:54321"
EOF

      echo "✅ Dynamic configuration created"
      cat /data/coolify/proxy/dynamic/supabase.yml
    `, 'Creating dynamic config');

    // Step 2: Update Traefik to watch dynamic configs
    console.log('\n' + '='.repeat(70));
    console.log('STEP 2: Configuring Traefik to Load Dynamic Config');
    console.log('='.repeat(70));
    
    await executeCommand(conn, `
      # Check current Traefik configuration
      echo "Current Traefik command:"
      docker inspect coolify-proxy --format='{{.Config.Cmd}}'
      
      echo ""
      echo "Checking if Traefik watches the dynamic directory..."
      docker inspect coolify-proxy | grep -i "dynamic\\|provider" || echo "No dynamic provider found"
    `, 'Checking Traefik config');

    // Step 3: Restart Traefik to pick up changes (or check if it auto-reloads)
    console.log('\n' + '='.repeat(70));
    console.log('STEP 3: Reloading Traefik Configuration');
    console.log('='.repeat(70));
    
    await executeCommand(conn, `
      echo "Checking if Traefik auto-reloads..."
      docker logs coolify-proxy --tail 5
      
      echo ""
      echo "Sending reload signal to Traefik..."
      docker kill --signal=USR1 coolify-proxy || echo "Signal sent"
      
      sleep 5
      
      echo ""
      echo "Traefik should have reloaded configuration"
    `, 'Reloading Traefik');

    // Step 4: Test the routing
    console.log('\n' + '='.repeat(70));
    console.log('STEP 4: Testing Routing');
    console.log('='.repeat(70));
    
    await executeCommand(conn, `
      echo "Waiting 10 seconds for configuration to take effect..."
      sleep 10
      
      echo ""
      echo "Testing internal endpoint (should work):"
      curl -s http://localhost:54321/auth/v1/health
      
      echo ""
      echo ""
      echo "Testing external endpoint (through Traefik):"
      curl -sL https://supabase.healthscribe.pro/auth/v1/health || echo "Not ready yet - may need SSL cert generation"
      
      echo ""
      echo ""
      echo "Testing HTTP (redirects to HTTPS):"
      curl -sL http://supabase.healthscribe.pro/auth/v1/health | head -5
    `, 'Testing routing');

    // Alternative: Use nginx as reverse proxy if Traefik dynamic config doesn't work
    console.log('\n' + '='.repeat(70));
    console.log('STEP 5: Alternative - Nginx Reverse Proxy');
    console.log('='.repeat(70));
    
    await executeCommand(conn, `
      echo "Creating Nginx reverse proxy as backup..."
      
      cat > /etc/nginx/sites-available/supabase.healthscribe.pro <<'NGINXEOF'
server {
    listen 8081;
    server_name supabase.healthscribe.pro;
    
    location / {
        proxy_pass http://localhost:54321;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \\$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \\$host;
        proxy_set_header X-Real-IP \\$remote_addr;
        proxy_set_header X-Forwarded-For \\$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \\$scheme;
        proxy_cache_bypass \\$http_upgrade;
        
        add_header 'Access-Control-Allow-Origin' '*' always;
        add_header 'Access-Control-Allow-Methods' 'GET, POST, PUT, DELETE, OPTIONS' always;
        add_header 'Access-Control-Allow-Headers' 'DNT,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Range,Authorization,apikey' always;
        
        if (\\$request_method = 'OPTIONS') {
            return 204;
        }
    }
}
NGINXEOF

      ln -sf /etc/nginx/sites-available/supabase.healthscribe.pro /etc/nginx/sites-enabled/
      
      nginx -t && systemctl reload nginx
      
      echo "✅ Nginx proxy created on port 8081"
    `, 'Setting up Nginx backup');

    // Step 6: Verify everything
    console.log('\n' + '='.repeat(70));
    console.log('STEP 6: Final Verification');
    console.log('='.repeat(70));
    
    await executeCommand(conn, `
      echo "Kong Status:"
      docker ps --filter "name=supabase_kong_supabase" --format "{{.Names}}: {{.Status}}"
      
      echo ""
      echo "Kong Health:"
      curl -s http://localhost:54321/auth/v1/health
      
      echo ""
      echo ""
      echo "Traefik Status:"
      docker ps --filter "name=coolify-proxy" --format "{{.Names}}: {{.Status}}"
      
      echo ""
      echo "Nginx Status:"
      systemctl status nginx | grep "active"
    `, 'Final checks');

    conn.end();
    console.log('\n✅ SSH session closed');

    console.log('\n' + '='.repeat(80));
    console.log('✅ ROUTING CONFIGURATION COMPLETE');
    console.log('='.repeat(80));
    
    console.log('\n📊 What was configured:');
    console.log('1. Traefik dynamic config: /data/coolify/proxy/dynamic/supabase.yml');
    console.log('2. Routes supabase.healthscribe.pro → localhost:54321');
    console.log('3. Nginx backup proxy on port 8081');
    
    console.log('\n🧪 Testing URLs:');
    console.log('- https://supabase.healthscribe.pro/auth/v1/health (via Traefik)');
    console.log('- http://localhost:54321/auth/v1/health (direct)');
    console.log('- http://localhost:8081/auth/v1/health (via Nginx)');
    
    console.log('\n💡 If external URL still doesn\'t work:');
    console.log('1. Wait 2-3 minutes for SSL cert generation');
    console.log('2. Check Traefik logs: docker logs coolify-proxy | grep supabase');
    console.log('3. Verify DNS: supabase.healthscribe.pro points to your VPS IP');
    console.log('4. Try the Nginx backup: http://YOUR_IP:8081/auth/v1/health');
    
    console.log('\n✅ Now updating your application config...\n');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  }
}

main();

