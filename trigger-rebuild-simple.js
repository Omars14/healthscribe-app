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

    console.log('🔧 TRIGGERING COOLIFY REBUILD\n');
    console.log('=' .repeat(80) + '\n');

    console.log('1️⃣ Finding Coolify application directory...\n');
    const appDir = await executeCommand(conn, `
find /data/coolify/applications -name "docker-compose.yml" -path "*tkwoos4soccckws84088wc04*" -exec dirname {} \\; 2>/dev/null | head -1
`);
    console.log(`App Directory: ${appDir.trim()}\n`);

    if (!appDir.trim()) {
      console.error('❌ Coolify application directory not found!');
      process.exit(1);
    }

    console.log('2️⃣ Checking docker-compose.yml...\n');
    await executeCommand(conn, `
cat "${appDir.trim()}/docker-compose.yml"
`);

    console.log('\n3️⃣ Stopping and rebuilding application...\n');
    await executeCommand(conn, `
cd "${appDir.trim()}"
docker compose down
sleep 5
docker compose up -d --build --force-recreate
`);

    console.log('\n4️⃣ Waiting for application to start (30 seconds)...\n');
    await new Promise(resolve => setTimeout(resolve, 30000));

    console.log('\n5️⃣ Checking new container status...\n');
    await executeCommand(conn, `
docker ps | grep tkwoos4soccckws84088wc04
`);

    console.log('\n6️⃣ Checking application logs...\n');
    await executeCommand(conn, `
NEW_CONTAINER=$(docker ps | grep tkwoos4soccckws84088wc04 | awk '{print $1}')
docker logs $NEW_CONTAINER --tail 30 2>&1 | grep -E "Ready|Error|JWS" || echo "No relevant logs yet"
`);

    console.log('\n\n' + '='.repeat(80));
    console.log('✅✅✅ REBUILD COMPLETE! ✅✅✅');
    console.log('='.repeat(80));
    console.log('\n🚀 Try now:');
    console.log('1. Hard refresh: CTRL + SHIFT + R');
    console.log('2. Login and check transcription history!');
    console.log('');

    conn.end();

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

main();

