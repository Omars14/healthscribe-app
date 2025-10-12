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

    console.log('🚀 RESTARTING WITH COMPLETE ENVIRONMENT VARIABLES\n');
    console.log('=' .repeat(80) + '\n');
    
    // Stop and remove
    console.log('🛑 Stopping old container...\n');
    await executeCommand(conn, `
docker stop healthscribe-app
docker rm healthscribe-app
`);

    // Start with ALL env vars
    console.log('\n🚀 Starting with complete environment...\n');
    await executeCommand(conn, `
docker run -d \\
  --name healthscribe-app \\
  --restart unless-stopped \\
  --network coolify \\
  -e NEXT_PUBLIC_SUPABASE_URL=https://supabase.healthscribe.pro \\
  -e NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJzdXBhYmFzZSIsImlhdCI6MTc1ODMyOTQwMCwiZXhwIjo0OTE0MDAzMDAwLCJyb2xlIjoiYW5vbiJ9.USAl15ClzSLfHwEYQn-bQQaZNz79FkDGUPsohnnEqJA \\
  -e SUPABASE_SERVICE_ROLE_KEY=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJzdXBhYmFzZSIsImlhdCI6MTc1ODMyOTQwMCwiZXhwIjo0OTE0MDAzMDAwLCJyb2xlIjoic2VydmljZV9yb2xlIn0.t-Yjplk7J1vihdKlruGPN7FzyqTPvujcB4c_vZVd8yY \\
  -e N8N_WEBHOOK_URL=https://n8n.healthscribe.pro/webhook/medical-transcribe-v2 \\
  -e NODE_ENV=production \\
  healthscribe-fixed:latest

echo "Waiting for container to start..."
sleep 40

docker ps --filter "name=healthscribe-app" --format "table {{.Names}}\\t{{.Status}}"
docker logs healthscribe-app --tail 5
`);

    // Update Traefik
    console.log('\n🔀 Updating Traefik...\n');
    await executeCommand(conn, `
APP_IP=\$(docker inspect healthscribe-app | grep -oP '"IPAddress": "\\K[0-9.]+' | grep -v "^$" | head -1)

cat > /data/coolify/proxy/dynamic/healthscribe.yaml <<EOF
http:
  routers:
    healthscribe-app:
      rule: "Host(\\\`healthscribe.pro\\\`)"
      service: healthscribe-app-service
      entryPoints:
        - https
      tls:
        certResolver: letsencrypt
  
  services:
    healthscribe-app-service:
      loadBalancer:
        servers:
          - url: "http://\${APP_IP}:3000"
EOF

docker kill -s HUP coolify-proxy
sleep 10

curl -sI https://healthscribe.pro | head -2
`);

    // Re-apply patches to server bundles
    console.log('\n🔧 Re-applying server patches...\n');
    await executeCommand(conn, `
docker cp /tmp/patch-api.js healthscribe-app:/tmp/patch-api.js
docker exec healthscribe-app node /tmp/patch-api.js | tail -5
`);

    // Restart one more time
    console.log('\n🔄 Final restart...\n');
    await executeCommand(conn, `
docker restart healthscribe-app
sleep 35
docker ps --filter "name=healthscribe-app" --format "{{.Status}}"
`);

    // Final test
    console.log('\n✅ FINAL TEST...\n');
    await executeCommand(conn, `
TOKEN=\$(curl -s -X POST "https://supabase.healthscribe.pro/auth/v1/token?grant_type=password" \\
  -H "Content-Type: application/json" \\
  -H "apikey: eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJzdXBhYmFzZSIsImlhdCI6MTc1ODMyOTQwMCwiZXhwIjo0OTE0MDAzMDAwLCJyb2xlIjoiYW5vbiJ9.USAl15ClzSLfHwEYQn-bQQaZNz79FkDGUPsohnnEqJA" \\
  -d '{"email":"omars14@gmail.com","password":"Nomar123"}' | jq -r '.access_token')

echo "API Test:"
curl -s "https://healthscribe.pro/api/transcriptions" \\
  -H "Authorization: Bearer \$TOKEN" | jq '{success, count}'

echo ""
echo "Container logs:"
docker logs healthscribe-app 2>&1 | grep "API Route" | tail -10
`);

    console.log('\n' + '='.repeat(80));
    console.log('✅ SYSTEM READY - TESTING IN BROWSER');
    console.log('='.repeat(80));
    console.log('');

    conn.end();

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

main();

