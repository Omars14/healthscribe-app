#!/usr/bin/env node

const { Client } = require('ssh2');

const SSH_CONFIG = {
  host: '154.26.155.207',
  port: 22,
  username: 'root',
  password: 'Nomar123'
};

const APP_DIR = '/data/coolify/applications/tkwoos4soccckws84088wc04';

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

    console.log('🔧 FORCING CACHE-BUSTING REBUILD\n');
    console.log('=' .repeat(80) + '\n');

    console.log('1️⃣ Adding cache-busting parameter to environment...\n');
    await executeCommand(conn, `
cd "${APP_DIR}"

# Add a cache-busting timestamp to force new build
CACHE_BUST=$(date +%s)
echo "" >> .env
echo "# Cache bust: $CACHE_BUST" >> .env

echo "✅ Cache bust added: $CACHE_BUST"
`);

    console.log('\n2️⃣ Stopping application...\n');
    await executeCommand(conn, `
cd "${APP_DIR}"
docker compose down
sleep 3
echo "✅ Application stopped"
`);

    console.log('\n3️⃣ Removing old images to force complete rebuild...\n');
    await executeCommand(conn, `
# Remove old healthscribe images
docker images | grep healthscribe | awk '{print $3}' | xargs -r docker rmi -f 2>&1 | head -5 || echo "Images removed"
echo "✅ Old images removed"
`);

    console.log('\n4️⃣ Rebuilding from scratch (this will take 2-5 minutes)...\n');
    await executeCommand(conn, `
cd "${APP_DIR}"
docker compose build --no-cache --pull
echo "✅ Build complete"
`);

    console.log('\n5️⃣ Starting application...\n');
    await executeCommand(conn, `
cd "${APP_DIR}"
docker compose up -d
sleep 10
echo "✅ Application started"
`);

    console.log('\n6️⃣ Waiting for application to be ready...\n');
    for (let i = 0; i < 20; i++) {
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      try {
        const logs = await executeCommand(conn, `
CONTAINER_NAME=$(docker ps | grep tkwoos4soccckws84088wc04 | awk '{print $NF}')
if [ -n "$CONTAINER_NAME" ]; then
  docker logs $CONTAINER_NAME --tail 5 2>&1 | grep -i "ready"
fi
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

    console.log('\n7️⃣ Verifying container status...\n');
    await executeCommand(conn, `
docker ps | grep tkwoos4soccckws84088wc04
`);

    console.log('\n\n' + '='.repeat(80));
    console.log('✅✅✅ CACHE-BUSTING REBUILD COMPLETE! ✅✅✅');
    console.log('='.repeat(80));
    console.log('\n🎯 CRITICAL: NOW YOU MUST CLEAR BROWSER CACHE:');
    console.log('');
    console.log('METHOD 1 - INCOGNITO (EASIEST):');
    console.log('  1. Open INCOGNITO/PRIVATE window');
    console.log('  2. Go to https://healthscribe.pro');
    console.log('  3. Login and try upload');
    console.log('');
    console.log('METHOD 2 - HARD RELOAD:');
    console.log('  1. Press F12');
    console.log('  2. RIGHT-CLICK refresh button');
    console.log('  3. Select "Empty Cache and Hard Reload"');
    console.log('');
    console.log('METHOD 3 - DIFFERENT BROWSER:');
    console.log('  1. Use a different browser you havent used');
    console.log('  2. This guarantees fresh cache');
    console.log('');
    console.log('✅ After clearing cache, you should see:');
    console.log('   "Uploading file via API route (bypasses RLS)..."');
    console.log('');
    console.log('❌ If you still see:');
    console.log('   "Uploading file directly to Supabase Storage..."');
    console.log('   Then cache is NOT cleared yet!');
    console.log('');

    conn.end();

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

main();

