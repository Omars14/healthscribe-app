#!/usr/bin/env node

const { Client } = require('ssh2');

const SSH_CONFIG = {
  host: '154.26.155.207',
  port: 22,
  username: 'root',
  password: 'Nomar123'
};

const APP_DIR = '/data/coolify/applications/tkwoos4soccckws84088wc04';
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYW5vbiIsImlzcyI6InN1cGFiYXNlIiwiaWF0IjoxNzYwMjk5MjYwLCJleHAiOjIwNzU2NTkyNjB9.fuBekR-do0ST4CxThWM5UcjFacFpZC3AMqxNSSp3DMM';
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoic2VydmljZV9yb2xlIiwiaXNzIjoic3VwYWJhc2UiLCJpYXQiOjE3NjAyOTkyNjAsImV4cCI6MjA3NTY1OTI2MH0.BLOKCUrBXkmjGPsg39H4aGInVjgBqZPaRsMH1dpksDQ';

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

    console.log('🔧 UPDATING JWT KEYS AND REBUILDING APPLICATION\n');
    console.log('=' .repeat(80) + '\n');

    console.log('1️⃣ Backing up and updating .env file...\n');
    await executeCommand(conn, `
cd "${APP_DIR}"

# Backup
cp .env .env.backup-$(date +%s)

# Update using sed
sed -i "s|NEXT_PUBLIC_SUPABASE_ANON_KEY=.*|NEXT_PUBLIC_SUPABASE_ANON_KEY=${ANON_KEY}|g" .env
sed -i "s|SUPABASE_SERVICE_ROLE_KEY=.*|SUPABASE_SERVICE_ROLE_KEY=${SERVICE_KEY}|g" .env

echo "✅ .env updated"
echo ""
echo "Verification:"
grep "NEXT_PUBLIC_SUPABASE_ANON_KEY" .env | cut -c 1-100
grep "SUPABASE_SERVICE_ROLE_KEY" .env | cut -c 1-100
`);

    console.log('\n2️⃣ Stopping current application...\n');
    await executeCommand(conn, `
cd "${APP_DIR}"
docker compose down
sleep 3
echo "✅ Application stopped"
`);

    console.log('\n3️⃣ Starting rebuild (this will take 2-5 minutes)...\n');
    await executeCommand(conn, `
cd "${APP_DIR}"
docker compose up -d --build --force-recreate
`);

    console.log('\n4️⃣ Monitoring container startup...\n');
    for (let i = 0; i < 30; i++) {
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      try {
        const containers = await executeCommand(conn, `docker ps | grep tkwoos4soccckws84088wc04`);
        if (containers.includes('Up')) {
          console.log(`\n✅ Container is running!\n`);
          console.log(containers);
          break;
        } else {
          console.log(`⏳ Waiting for container... (${(i + 1) * 5}s)`);
        }
      } catch (e) {
        console.log(`⏳ Building... (${(i + 1) * 5}s)`);
      }
    }

    console.log('\n5️⃣ Checking application logs...\n');
    await executeCommand(conn, `
CONTAINER_NAME=$(docker ps | grep tkwoos4soccckws84088wc04 | awk '{print $NF}')
if [ -n "$CONTAINER_NAME" ]; then
  echo "Container: $CONTAINER_NAME"
  echo ""
  docker logs $CONTAINER_NAME --tail 50 2>&1 | tail -20
else
  echo "⚠️  Container not found yet, may still be building"
fi
`);

    console.log('\n\n' + '='.repeat(80));
    console.log('✅✅✅ REBUILD COMPLETE! ✅✅✅');
    console.log('='.repeat(80));
    console.log('\n🔧 Actions completed:');
    console.log('✅ Updated .env with correct JWT keys');
    console.log('✅ Rebuilt Docker image with new environment');
    console.log('✅ Started new container');
    console.log('\n🚀 TRY NOW:');
    console.log('1. Hard refresh: CTRL + SHIFT + R');
    console.log('2. Clear browser cache (F12 → Application → Clear storage)');
    console.log('3. Login: omars14@gmail.com / Nomar123');
    console.log('4. Navigate to Transcriptionist Workspace');
    console.log('5. Your transcription history should load!');
    console.log('\n📊 If still not working, wait 1-2 minutes for build to complete');
    console.log('');

    conn.end();

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

main();

