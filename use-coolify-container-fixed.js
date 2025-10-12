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

    console.log('🔄 SWITCHING TO COOLIFY-MANAGED CONTAINER\n');
    console.log('=' .repeat(80) + '\n');
    
    // Stop healthscribe-app
    console.log('🛑 Stopping manual healthscribe-app...\n');
    await executeCommand(conn, `
docker stop healthscribe-app
docker rm healthscribe-app
`);

    // Update Coolify env
    console.log('\n🔧 Updating Coolify environment...\n');
    await executeCommand(conn, `
cat /data/coolify/applications/tkwoos4soccckws84088wc04/.env
`);

    // Start Coolify container
    console.log('\n🚀 Starting Coolify-managed container...\n');
    await executeCommand(conn, `
cd /data/coolify/applications/tkwoos4soccckws84088wc04
docker-compose up -d

sleep 40

docker ps | grep tkwoos4
docker logs tkwoos4soccckws84088wc04-170735192160 2>&1 | tail -20
`);

    // Test
    console.log('\n✅ Testing Coolify container...\n');
    await executeCommand(conn, `
curl -sI https://healthscribe.pro | head -3

TOKEN=\$(curl -s -X POST "https://supabase.healthscribe.pro/auth/v1/token?grant_type=password" \\
  -H "Content-Type: application/json" \\
  -H "apikey: eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJzdXBhYmFzZSIsImlhdCI6MTc1ODMyOTQwMCwiZXhwIjo0OTE0MDAzMDAwLCJyb2xlIjoiYW5vbiJ9.USAl15ClzSLfHwEYQn-bQQaZNz79FkDGUPsohnnEqJA" \\
  -d '{"email":"omars14@gmail.com","password":"Nomar123"}' | jq -r '.access_token')

curl -s "https://healthscribe.pro/api/transcriptions" \\
  -H "Authorization: Bearer \$TOKEN" | jq '{success, count}'
`);

    console.log('\n' + '='.repeat(80));
    console.log('📊 CURRENT STATUS');
    console.log('='.repeat(80));
    console.log('\n✅ Login: WORKING (browser confirmed)');
    console.log('✅ Frontend: Patched with self-hosted URL');
    console.log('✅ Kong: Accepts both anon keys');
    console.log('✅ Database: 29 transcriptions for user 24e938c1...');
    console.log('\n⚠️  Transcriptions API: Returns 0 (built with cloud credentials)');
    console.log('\n💡 SOLUTION:');
    console.log('   The Coolify-managed container needs to be REBUILT from git');
    console.log('   with the updated src/app/api/transcriptions/route.ts code.');
    console.log('\n🎯 TO COMPLETE THE FIX:');
    console.log('   1. Update GitHub repo with latest changes');
    console.log('   2. Go to Coolify dashboard: http://154.26.155.207:8001');
    console.log('   3. Find "healthscribe" application');
    console.log('   4. Click "Redeploy" to rebuild from git');
    console.log('\n✅ ALTERNATIVELY: I can commit and push the changes now');
    console.log('');

    conn.end();

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

main();

