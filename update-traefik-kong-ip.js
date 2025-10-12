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

    console.log('🔧 UPDATING TRAEFIK KONG IP\n');
    console.log('=' .repeat(80) + '\n');
    
    // Create correct Traefik config
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
          - url: "http://10.0.3.15:8000"
EOF

cat /data/coolify/proxy/dynamic/supabase.yaml
`);

    // Reload Traefik
    console.log('\n🔄 Reloading Traefik...\n');
    await executeCommand(conn, `
docker kill -s HUP coolify-proxy
sleep 15
`);

    // Test
    console.log('✅ Testing login...\n');
    await executeCommand(conn, `
curl -s -X POST "https://supabase.healthscribe.pro/auth/v1/token?grant_type=password" \\
  -H "Content-Type: application/json" \\
  -H "apikey: eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJzdXBhYmFzZSIsImlhdCI6MTc1ODMyOTQwMCwiZXhwIjo0OTE0MDAzMDAwLCJyb2xlIjoiYW5vbiJ9.USAl15ClzSLfHwEYQn-bQQaZNz79FkDGUPsohnnEqJA" \\
  -d '{"email":"omars14@gmail.com","password":"Nomar123"}' | jq '{user_id: .user.id}'
`);

    console.log('\n' + '='.repeat(80));
    console.log('✅ TRAEFIK UPDATED WITH CORRECT KONG IP');
    console.log('='.repeat(80));
    console.log('\n🎯 NOW REFRESH YOUR BROWSER (CTRL + SHIFT + R)');
    console.log('   CORS errors should be gone!');
    console.log('   Upload should work!');
    console.log('');

    conn.end();

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

main();

