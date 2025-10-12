#!/usr/bin/env node

const { Client } = require('ssh2');

const SSH_CONFIG = {
  host: '154.26.155.207',
  port: 22,
  username: 'root',
  password: 'Nomar123'
};

function executeCommand(conn, command) {
  return new Promise((resolve, reject) => {
    conn.exec(command, (err, stream) => {
      if (err) {
        reject(err);
        return;
      }

      let output = '';

      stream.on('close', () => {
        resolve(output);
      }).on('data', (data) => {
        output += data.toString();
        process.stdout.write(data.toString());
      });
    });
  });
}

async function main() {
  const conn = new Client();

  try {
    await new Promise((resolve, reject) => {
      conn.on('ready', resolve).on('error', reject).connect(SSH_CONFIG);
    });

    console.log('🔧 FIXING SUPABASE CORS AND TRAEFIK ROUTING\n');
    console.log('=' .repeat(80) + '\n');
    
    // Get Kong's current IP
    console.log('📍 Getting Kong IP...\n');
    const kongIP = await executeCommand(conn, `
docker inspect supabase-kong-e088wwks88k8k48sccg8gk0o --format '{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}'
`);
    console.log(`Kong IP: ${kongIP.trim()}\n`);

    // Update Traefik configuration
    console.log('📝 Updating Traefik configuration...\n');
    await executeCommand(conn, `
cat > /data/coolify/proxy/dynamic/supabase.yaml <<'EOF'
http:
  routers:
    supabase:
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
          - url: "http://${kongIP.trim()}:8000"
EOF

cat /data/coolify/proxy/dynamic/supabase.yaml
`);

    // Reload Traefik
    console.log('\n🔄 Reloading Traefik...\n');
    await executeCommand(conn, `
docker kill -s HUP coolify-proxy
sleep 10
`);

    // Test if Kong is accessible
    console.log('✅ Testing Kong accessibility...\n');
    await executeCommand(conn, `
curl -i https://supabase.healthscribe.pro/auth/v1/health 2>&1 | head -15
`);

    // Test CORS preflight
    console.log('\n🧪 Testing CORS preflight...\n');
    await executeCommand(conn, `
curl -v -X OPTIONS "https://supabase.healthscribe.pro/rest/v1/user_profiles" \\
  -H "Origin: https://healthscribe.pro" \\
  -H "Access-Control-Request-Method: GET" \\
  -H "Access-Control-Request-Headers: apikey,authorization" 2>&1 | grep -E "< HTTP|< Access-Control" | head -10
`);

    console.log('\n' + '='.repeat(80));
    console.log('✅ CONFIGURATION UPDATED');
    console.log('='.repeat(80));
    console.log('\n🎯 TRY LOGGING IN NOW');
    console.log('   Refresh: CTRL + SHIFT + R');
    console.log('');

    conn.end();

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

main();

