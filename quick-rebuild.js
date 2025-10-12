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

    console.log('🔄 QUICK REBUILD\n');

    console.log('1️⃣ Pulling latest code...\n');
    await executeCommand(conn, `
cd /root/healthscribe-build
git pull origin master
echo "✅ Latest code pulled"
git log --oneline -1
`);

    console.log('\n2️⃣ Rebuilding Docker image...\n');
    await executeCommand(conn, `
cd /root/healthscribe-build
export $(cat /data/coolify/applications/tkwoos4soccckws84088wc04/.env | grep -v '^#' | grep -v '^$' | xargs)
docker build \\
  --build-arg NEXT_PUBLIC_SUPABASE_URL="$NEXT_PUBLIC_SUPABASE_URL" \\
  --build-arg NEXT_PUBLIC_SUPABASE_ANON_KEY="$NEXT_PUBLIC_SUPABASE_ANON_KEY" \\
  --build-arg SUPABASE_SERVICE_ROLE_KEY="$SUPABASE_SERVICE_ROLE_KEY" \\
  --build-arg N8N_WEBHOOK_URL="$N8N_WEBHOOK_URL" \\
  --build-arg NEXT_PUBLIC_N8N_WEBHOOK_URL="$NEXT_PUBLIC_N8N_WEBHOOK_URL" \\
  --build-arg NEXT_PUBLIC_URL="$NEXT_PUBLIC_URL" \\
  --build-arg NEXT_PUBLIC_API_URL="$NEXT_PUBLIC_API_URL" \\
  --no-cache \\
  -t healthscribe-new:latest \\
  .
echo "✅ Build complete"
`);

    console.log('\n3️⃣ Restarting container...\n');
    await executeCommand(conn, `
cd /data/coolify/applications/tkwoos4soccckws84088wc04
docker compose down
sleep 3
docker compose up -d
echo "✅ Container restarted"
`);

    console.log('\n4️⃣ Waiting for app to be ready...\n');
    for (let i = 0; i < 20; i++) {
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      try {
        const logs = await executeCommand(conn, `
docker logs tkwoos4soccckws84088wc04-184252873467 --tail 5 2>&1 | grep -i "ready"
`);
        
        if (logs.includes('Ready')) {
          console.log(`\n✅ Ready!\n`);
          break;
        }
      } catch (e) {}
      console.log(`⏳ ${(i + 1) * 2}s...`);
    }

    console.log('\n✅✅✅ REBUILD COMPLETE!\n');
    console.log('Test again in incognito mode - audio playback should work now!\n');

    conn.end();

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

main();

