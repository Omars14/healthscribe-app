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

    console.log('🔧 REBUILDING FROM GITHUB SOURCE\n');
    console.log('=' .repeat(80) + '\n');

    console.log('1️⃣ Cloning/updating repository...\n');
    await executeCommand(conn, `
cd /root
if [ -d "dashboard-next-build" ]; then
  echo "Updating existing repository..."
  cd dashboard-next-build
  git fetch origin
  git reset --hard origin/master
else
  echo "Cloning repository..."
  git clone https://github.com/YOUR_USERNAME/dashboard-next.git dashboard-next-build
  cd dashboard-next-build
fi

echo "✅ Source code ready"
echo "Current commit:"
git log -1 --oneline
`);

    console.log('\n2️⃣ Loading environment variables...\n');
    const envVars = await executeCommand(conn, `
cat /data/coolify/applications/tkwoos4soccckws84088wc04/.env | grep -E "NEXT_PUBLIC_SUPABASE_URL=|NEXT_PUBLIC_SUPABASE_ANON_KEY=|SUPABASE_SERVICE_ROLE_KEY=|N8N_WEBHOOK_URL=|NEXT_PUBLIC_URL="
`);
    console.log('Environment loaded\n');

    console.log('3️⃣ Building Docker image with build args...\n');
    await executeCommand(conn, `
cd /root/dashboard-next-build

# Load env vars
export $(cat /data/coolify/applications/tkwoos4soccckws84088wc04/.env | grep -v '^#' | xargs)

# Build with all required build args
docker build \\
  --build-arg NEXT_PUBLIC_SUPABASE_URL="$NEXT_PUBLIC_SUPABASE_URL" \\
  --build-arg NEXT_PUBLIC_SUPABASE_ANON_KEY="$NEXT_PUBLIC_SUPABASE_ANON_KEY" \\
  --build-arg SUPABASE_SERVICE_ROLE_KEY="$SUPABASE_SERVICE_ROLE_KEY" \\
  --build-arg N8N_WEBHOOK_URL="$N8N_WEBHOOK_URL" \\
  --build-arg NEXT_PUBLIC_N8N_WEBHOOK_URL="$NEXT_PUBLIC_N8N_WEBHOOK_URL" \\
  --build-arg NEXT_PUBLIC_URL="$NEXT_PUBLIC_URL" \\
  --build-arg NEXT_PUBLIC_API_URL="$NEXT_PUBLIC_API_URL" \\
  --no-cache \\
  -t healthscribe-fresh:$(date +%s) \\
  -t healthscribe-fresh:latest \\
  .

echo "✅ Build complete"
`);

    console.log('\n4️⃣ Updating docker-compose to use new image...\n');
    await executeCommand(conn, `
cd /data/coolify/applications/tkwoos4soccckws84088wc04

# Update docker-compose to use new image
sed -i "s|image: 'healthscribe-final:latest'|image: 'healthscribe-fresh:latest'|g" docker-compose.yaml

echo "✅ docker-compose.yaml updated"
cat docker-compose.yaml | grep "image:"
`);

    console.log('\n5️⃣ Stopping old container...\n');
    await executeCommand(conn, `
cd /data/coolify/applications/tkwoos4soccckws84088wc04
docker compose down
sleep 3
echo "✅ Old container stopped"
`);

    console.log('\n6️⃣ Starting new container...\n');
    await executeCommand(conn, `
cd /data/coolify/applications/tkwoos4soccckws84088wc04
docker compose up -d
echo "✅ New container started"
`);

    console.log('\n7️⃣ Waiting for application to be ready...\n');
    for (let i = 0; i < 20; i++) {
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      try {
        const logs = await executeCommand(conn, `
docker logs tkwoos4soccckws84088wc04-184252873467 --tail 5 2>&1 | grep -i "ready"
`);
        
        if (logs.includes('Ready')) {
          console.log(`\n✅ Application is ready!\n`);
          break;
        } else {
          console.log(`⏳ Waiting... (${(i + 1) * 3}s)`);
        }
      } catch (e) {
        console.log(`⏳ Starting... (${(i + 1) * 3}s)`);
      }
    }

    console.log('\n8️⃣ Verifying new code is loaded...\n');
    await executeCommand(conn, `
echo "Container status:"
docker ps | grep tkwoos4soccckws84088wc04

echo ""
echo "Recent logs:"
docker logs tkwoos4soccckws84088wc04-184252873467 --tail 10 2>&1
`);

    console.log('\n\n' + '='.repeat(80));
    console.log('✅✅✅ REBUILD FROM GITHUB COMPLETE! ✅✅✅');
    console.log('='.repeat(80));
    console.log('\n🚀 NOW TEST IN INCOGNITO:');
    console.log('1. Open incognito window');
    console.log('2. Go to https://healthscribe.pro');
    console.log('3. Login and upload a file');
    console.log('4. Check console - should see:');
    console.log('   "Uploading file via API route (bypasses RLS)..."');
    console.log('');

    conn.end();

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

main();

