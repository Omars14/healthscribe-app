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

    console.log('🚀 TRIGGERING APPLICATION REBUILD\n');
    console.log('=' .repeat(80) + '\n');

    // Step 1: Stop current container
    console.log('1️⃣ Stopping current container...\n');
    await executeCommand(conn, `
docker stop healthscribe-app
docker rm healthscribe-app
echo "✅ Container removed"
`);

    // Step 2: Pull latest code
    console.log('\n2️⃣ Pulling latest code from GitHub...\n');
    await executeCommand(conn, `
cd /root/dashboard-next 2>/dev/null || cd /data/coolify/applications/*/dashboard-next 2>/dev/null || echo "Repo not found in expected locations"
git fetch origin
git reset --hard origin/master
echo "✅ Latest code pulled"
git log --oneline -5
`);

    // Step 3: Build new Docker image
    console.log('\n3️⃣ Building new Docker image...\n');
    await executeCommand(conn, `
cd /root/dashboard-next 2>/dev/null || cd $(find /data/coolify/applications -name dashboard-next -type d | head -1)

# Create environment file for build
cat > .env.production << 'EOF'
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
EOF

echo "✅ Environment file created"

# Build image
docker build -t healthscribe-app:latest . 2>&1 | tail -30
`);

    // Step 4: Start new container
    console.log('\n4️⃣ Starting new container...\n');
    const appNetwork = (await executeCommand(conn, `docker network ls | grep coolify | awk '{print $2}' | head -1`)).trim();
    console.log(`Network: ${appNetwork}\n`);

    await executeCommand(conn, `
docker run -d \\
  --name healthscribe-app \\
  --network ${appNetwork} \\
  -p 3000:3000 \\
  --restart unless-stopped \\
  --env-file $(find /data/coolify/applications -name dashboard-next -type d | head -1)/.env.production \\
  healthscribe-app:latest

echo "✅ Container started"
sleep 10
`);

    // Step 5: Check logs
    console.log('\n5️⃣ Checking application logs...\n');
    await executeCommand(conn, `
docker logs healthscribe-app --tail 20 2>&1
`);

    // Step 6: Test
    console.log('\n6️⃣ Testing application...\n');
    await executeCommand(conn, `
echo "Application:"
curl -s -I https://healthscribe.pro | grep HTTP

echo ""
echo "N8N webhook from app logs:"
docker logs healthscribe-app 2>&1 | grep -i "n8n.*webhook" | tail -3
`);

    console.log('\n' + '='.repeat(80));
    console.log('✅ REBUILD COMPLETE');
    console.log('='.repeat(80));
    console.log('\n🎉 Application rebuilt with correct configuration!');
    console.log('');
    console.log('🌐 Test now:');
    console.log('1. Hard refresh: CTRL + SHIFT + R');
    console.log('2. Try uploading a file');
    console.log('3. Check n8n receives the correct webhook');
    console.log('');

    conn.end();

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

main();

