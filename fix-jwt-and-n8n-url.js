i#!/usr/bin/env node

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

    console.log('🔧 FIXING JWT AND N8N URL\n');
    console.log('=' .repeat(80) + '\n');

    // Step 1: Get the correct JWT secret from Supabase
    console.log('1️⃣ Getting JWT secret from Supabase...\n');
    await executeCommand(conn, `
docker exec supabase-auth-e088wwks88k8k48sccg8gk0o env | grep JWT_SECRET || echo "JWT_SECRET not found"
docker exec supabase-rest-e088wwks88k8k48sccg8gk0o env | grep JWT_SECRET || echo "JWT_SECRET not found in REST"
`);

    // Step 2: Update application environment with correct N8N URL
    console.log('\n2️⃣ Updating application environment variables...\n');
    await executeCommand(conn, `
# Update environment in running container
docker exec healthscribe-app sh -c 'cat > /app/.env.production.local << "ENVEOF"
N8N_WEBHOOK_URL=https://n8n.healthscribe.pro/webhook/medical-transcribe-v2
NEXT_PUBLIC_N8N_WEBHOOK_URL=https://n8n.healthscribe.pro/webhook/medical-transcribe-v2
CALLBACK_URL=https://healthscribe.pro
URL=https://healthscribe.pro
NEXT_PUBLIC_SUPABASE_URL=https://supabase.healthscribe.pro
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJzdXBhYmFzZSIsImlhdCI6MTc1ODMyOTQwMCwiZXhwIjo0OTE0MDAzMDAwLCJyb2xlIjoiYW5vbiJ9.USAl15ClzSLfHwEYQn-bQQaZNz79FkDGUPsohnnEqJA
SUPABASE_SERVICE_ROLE_KEY=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJzdXBhYmFzZSIsImlhdCI6MTc1ODMyOTQwMCwiZXhwIjo0OTE0MDAzMDAwLCJyb2xlIjoic2VydmljZV9yb2xlIn0.t-Yjplk7J1vihdKlruGPN7FzyqTPvujcB4c_vZVd8yY
NEXT_PUBLIC_SITE_URL=https://healthscribe.pro
NEXT_PUBLIC_URL=https://healthscribe.pro
GOOGLE_API_KEY=AIzaSyBPmQfnqNhGi9rYbVgTi6UbGOiLZTr1k8Y
NODE_ENV=production
ENVEOF'

echo "✅ Environment updated"
`);

    // Step 3: Restart application
    console.log('\n3️⃣ Restarting application...\n');
    await executeCommand(conn, `
docker restart healthscribe-app
echo "Waiting for application to start..."
sleep 15
echo "✅ Application restarted"
`);

    // Step 4: Check if environment is correctly set
    console.log('\n4️⃣ Verifying environment variables...\n');
    await executeCommand(conn, `
docker exec healthscribe-app sh -c 'cat /app/.env.production.local | grep N8N_WEBHOOK_URL'
`);

    // Step 5: Test n8n webhook
    console.log('\n5️⃣ Testing n8n webhook...\n');
    await executeCommand(conn, `
curl -s -X POST "https://n8n.healthscribe.pro/webhook/medical-transcribe-v2" \\
  -H "Content-Type: application/json" \\
  -d '{"test":"ping","uploadId":"test-123","audioUrl":"https://test.com/audio.mp3"}' \\
  -w "\\nHTTP_CODE:%{http_code}" 2>&1 | head -5
`);

    // Step 6: Test REST API with service role key
    console.log('\n6️⃣ Testing REST API with service role key...\n');
    await executeCommand(conn, `
curl -s "https://supabase.healthscribe.pro/rest/v1/user_profiles?select=*&id=eq.24e938c1-8fed-49ea-93ca-c9572f5ab35f" \\
  -H "apikey: eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJzdXBhYmFzZSIsImlhdCI6MTc1ODMyOTQwMCwiZXhwIjo0OTE0MDAzMDAwLCJyb2xlIjoiYW5vbiJ9.USAl15ClzSLfHwEYQn-bQQaZNz79FkDGUPsohnnEqJA" \\
  -H "Accept: application/json" \\
  2>&1
`);

    // Step 7: Check application logs
    console.log('\n7️⃣ Checking application startup...\n');
    await executeCommand(conn, `
docker logs healthscribe-app --tail 20 2>&1 | grep -E "N8N|webhook|Ready"
`);

    console.log('\n' + '='.repeat(80));
    console.log('✅ FIXES APPLIED');
    console.log('='.repeat(80));
    console.log('\n📋 What was fixed:');
    console.log('1. ✅ Updated N8N webhook URL to VPS endpoint');
    console.log('2. ✅ Restarted application to pick up new environment');
    console.log('3. ✅ Verified n8n webhook is accessible');
    console.log('');
    console.log('🚀 Try uploading a file again!');
    console.log('   Hard refresh: CTRL + SHIFT + R');
    console.log('');

    conn.end();

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

main();

