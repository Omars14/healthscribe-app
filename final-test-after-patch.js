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

    console.log('🔄 RESTARTING AND TESTING PATCHED SYSTEM\n');
    console.log('=' .repeat(80) + '\n');
    
    // Restart container
    console.log('🔄 Restarting container...\n');
    await executeCommand(conn, `
docker restart healthscribe-app
sleep 35
docker ps --filter "name=healthscribe-app" --format "{{.Status}}"
`);

    // Update Traefik
    console.log('\n🔀 Updating Traefik routing...\n');
    await executeCommand(conn, `
APP_IP=\$(docker inspect healthscribe-app | grep -oP '"IPAddress": "\\K[0-9.]+' | grep -v "^$" | head -1)
echo "App IP: \$APP_IP"

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
`);

    // Test application
    console.log('\n✅ Testing application...\n');
    await executeCommand(conn, `
curl -sI https://healthscribe.pro | head -3
`);

    // Test login
    console.log('\nTesting login...\n');
    const token = await executeCommand(conn, `
curl -s -X POST "https://supabase.healthscribe.pro/auth/v1/token?grant_type=password" \\
  -H "Content-Type: application/json" \\
  -H "apikey: eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJzdXBhYmFzZSIsImlhdCI6MTc1ODMyOTQwMCwiZXhwIjo0OTE0MDAzMDAwLCJyb2xlIjoiYW5vbiJ9.USAl15ClzSLfHwEYQn-bQQaZNz79FkDGUPsohnnEqJA" \\
  -d '{"email":"omars14@gmail.com","password":"Nomar123"}' | jq -r '.access_token'
`);

    if (token.includes('eyJ')) {
      console.log('✅ Login: SUCCESS\n');
      
      // Test transcriptions API
      console.log('Testing transcriptions API...\n');
      await executeCommand(conn, `
TOKEN="${token.trim()}"
curl -s "https://healthscribe.pro/api/transcriptions" \\
  -H "Authorization: Bearer \$TOKEN" | jq '{success, count, first_file: .transcriptions[0].file_name}'
`);
    }

    console.log('\n' + '='.repeat(80));
    console.log('✅ TESTING IN BROWSER NOW');
    console.log('='.repeat(80));
    console.log('');

    conn.end();

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

main();

