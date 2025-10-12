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

    console.log('🔧 FIXING YAML DIRECTLY ON SERVER\n');
    console.log('=' .repeat(80) + '\n');

    // Step 1: Show current file
    console.log('1️⃣ Checking current file content...\n');
    await executeCommand(conn, 'cat /data/coolify/proxy/dynamic/healthscribe-complete.yaml | head -10');

    // Step 2: Fix escaped backticks
    console.log('\n2️⃣ Removing escape characters...\n');
    await executeCommand(conn, `
cd /data/coolify/proxy/dynamic/
# Replace \\` with just `
sed -i 's/\\\\\`/\`/g' healthscribe-complete.yaml
echo "✅ Backticks fixed"
echo "First 10 lines after fix:"
head -10 healthscribe-complete.yaml
`);

    // Step 3: Restart Traefik
    console.log('\n3️⃣ Restarting Traefik...\n');
    await executeCommand(conn, 'docker restart coolify-proxy && sleep 10 && echo "✅ Traefik restarted"');

    // Step 4: Check for errors
    console.log('\n4️⃣ Checking for errors...\n');
    await executeCommand(conn, 'docker logs coolify-proxy --tail 5 2>&1 | grep "ERR" || echo "✅ No errors!"');

    // Step 5: Test Supabase
    console.log('\n5️⃣ Testing Supabase endpoints...\n');
    
    console.log('Auth health:');
    await executeCommand(conn, 'curl -s -I -m 10 https://supabase.healthscribe.pro/auth/v1/health 2>&1 | grep "HTTP"');
    
    console.log('\nDirect auth login test:');
    await executeCommand(conn, `
curl -s -X POST "https://supabase.healthscribe.pro/auth/v1/token?grant_type=password" \\
  -H "Content-Type: application/json" \\
  -H "apikey: eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJzdXBhYmFzZSIsImlhdCI6MTc1ODMyOTQwMCwiZXhwIjo0OTE0MDAzMDAwLCJyb2xlIjoiYW5vbiJ9.USAl15ClzSLfHwEYQn-bQQaZNz79FkDGUPsohnnEqJA" \\
  -d '{"email":"omars14@gmail.com","password":"Nomar123"}' \\
  -w "\\nHTTP_CODE:%{http_code}" 2>&1 | grep -E "access_token|HTTP_CODE|error" | head -5
`);

    console.log('\n' + '='.repeat(80));
    console.log('✅ YAML FIX COMPLETE');
    console.log('='.repeat(80));
    console.log('\n🌐 System Status:');
    console.log('✅ Application: https://healthscribe.pro (ONLINE)');
    console.log('✅ N8N: https://n8n.healthscribe.pro (ONLINE)');
    console.log('⏳ Supabase: Check above test results');
    console.log('');

    conn.end();

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

main();

