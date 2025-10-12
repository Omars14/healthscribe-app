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

    console.log('🔍 DIAGNOSING LOGIN ERROR\n');
    console.log('=' .repeat(80) + '\n');

    // Step 1: Check what the auth endpoint is actually returning
    console.log('1️⃣ Testing auth endpoint response...\n');
    await executeCommand(conn, `
echo "Full response from Supabase auth:"
curl -s -X POST "https://supabase.healthscribe.pro/auth/v1/token?grant_type=password" \\
  -H "Content-Type: application/json" \\
  -H "apikey: eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJzdXBhYmFzZSIsImlhdCI6MTc1ODMyOTQwMCwiZXhwIjo0OTE0MDAzMDAwLCJyb2xlIjoiYW5vbiJ9.USAl15ClzSLfHwEYQn-bQQaZNz79FkDGUPsohnnEqJA" \\
  -d '{"email":"omars14@gmail.com","password":"Nomar123"}' \\
  -v 2>&1 | head -50
`);

    // Step 2: Check auth container directly
    console.log('\n2️⃣ Testing auth container directly (internal)...\n');
    const authIp = (await executeCommand(conn, `docker inspect supabase-auth-e088wwks88k8k48sccg8gk0o 2>/dev/null | grep '"IPAddress"' | grep -v '""' | head -1 | awk -F'"' '{print $4}'`)).trim();
    console.log(`Auth IP: ${authIp}\n`);
    
    await executeCommand(conn, `
curl -s -X POST "http://${authIp}:9999/token?grant_type=password" \\
  -H "Content-Type: application/json" \\
  -H "apikey: eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJzdXBhYmFzZSIsImlhdCI6MTc1ODMyOTQwMCwiZXhwIjo0OTE0MDAzMDAwLCJyb2xlIjoiYW5vbiJ9.USAl15ClzSLfHwEYQn-bQQaZNz79FkDGUPsohnnEqJA" \\
  -d '{"email":"omars14@gmail.com","password":"Nomar123"}' \\
  2>&1 | head -20
`);

    // Step 3: Check Kong status
    console.log('\n3️⃣ Checking Kong status...\n');
    await executeCommand(conn, `
docker ps -f name=kong | grep -E "NAME|kong"
echo ""
docker logs supabase-kong-e088wwks88k8k48sccg8gk0o --tail 10 2>&1 || echo "Kong container not running or no logs"
`);

    // Step 4: Check Traefik routing
    console.log('\n4️⃣ Checking Traefik routing...\n');
    await executeCommand(conn, `
cat /data/coolify/proxy/dynamic/healthscribe-complete.yaml | grep -A 10 "supabase-auth:"
`);

    console.log('\n' + '='.repeat(80));
    console.log('📊 DIAGNOSIS COMPLETE');
    console.log('='.repeat(80));

    conn.end();

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

main();

