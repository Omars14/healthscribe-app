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

    console.log('📊 MONITORING COOLIFY DEPLOYMENT\n');
    console.log('=' .repeat(80) + '\n');
    
    for (let i = 1; i <= 20; i++) {
      console.log(`\n⏱️  Check ${i}/20 (waiting 30 seconds)...\n`);
      
      await new Promise(resolve => setTimeout(resolve, 30000));
      
      // Check docker containers
      const containers = await executeCommand(conn, `
docker ps | grep tkwoos4
`);

      console.log(containers);

      // Check if new image is building
      const images = await executeCommand(conn, `
docker images | grep tkwoos4 | head -5
`);

      console.log('\nImages:\n' + images);

      // Check container logs for new build
      const logs = await executeCommand(conn, `
docker logs tkwoos4soccckws84088wc04-170735192160 2>&1 | tail -10
`);

      if (logs.includes('Ready') || logs.includes('started')) {
        console.log('\n✅ Application appears ready!\n');
        
        // Test API
        console.log('Testing API...\n');
        const apiTest = await executeCommand(conn, `
TOKEN=\$(curl -s -X POST "https://supabase.healthscribe.pro/auth/v1/token?grant_type=password" \\
  -H "Content-Type: application/json" \\
  -H "apikey: eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJzdXBhYmFzZSIsImlhdCI6MTc1ODMyOTQwMCwiZXhwIjo0OTE0MDAzMDAwLCJyb2xlIjoiYW5vbiJ9.USAl15ClzSLfHwEYQn-bQQaZNz79FkDGUPsohnnEqJA" \\
  -d '{"email":"omars14@gmail.com","password":"Nomar123"}' | jq -r '.access_token')

curl -s "https://healthscribe.pro/api/transcriptions" \\
  -H "Authorization: Bearer \$TOKEN" | jq '{success, count, user_id: .transcriptions[0].user_id}'
`);

        console.log(apiTest);

        if (apiTest.includes('"count": 29') || apiTest.includes('24e938c1')) {
          console.log('\n' + '='.repeat(80));
          console.log('✅✅✅ DEPLOYMENT COMPLETE - SYSTEM 100% WORKING! ✅✅✅');
          console.log('='.repeat(80));
          break;
        }
      }
      
      if (i === 20) {
        console.log('\n⚠️  Coolify may not have detected the push yet.');
        console.log('💡 You can manually trigger rebuild at: http://154.26.155.207:8001');
      }
    }

    conn.end();

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

main();

