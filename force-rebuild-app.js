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

      stream.on('close', (code) => {
        if (code !== 0) {
          console.error(`Command exited with code ${code}`);
        }
        resolve(output);
      }).on('data', (data) => {
        output += data.toString();
        process.stdout.write(data.toString());
      }).stderr.on('data', (data) => {
        process.stderr.write(data.toString());
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

    console.log('🔧 FORCING APP REBUILD WITH LATEST CODE\n');
    console.log('=' .repeat(80) + '\n');

    console.log('1️⃣ Finding app container...\n');
    const containerName = 'tkwoos4soccckws84088wc04-184252873467';
    console.log(`Container: ${containerName}\n`);

    console.log('2️⃣ Finding source directory...\n');
    const findSource = await executeCommand(conn, `docker inspect ${containerName} --format '{{.Mounts}}' | grep -oP '/data/coolify/[^\\s]+' | head -1 || echo '/data/coolify/applications'`);
    const sourceDir = findSource.trim() || '/data/coolify/applications';
    console.log(`Source dir: ${sourceDir}\n`);

    console.log('3️⃣ Pulling latest code from GitHub...\n');
    await executeCommand(conn, `cd ${sourceDir} && git fetch origin && git reset --hard origin/master && git pull origin master`);

    console.log('\n4️⃣ Rebuilding Docker image...\n');
    await executeCommand(conn, `cd ${sourceDir} && docker build -t healthscribe-new:latest -f Dockerfile .`);

    console.log('\n5️⃣ Restarting container with new image...\n');
    await executeCommand(conn, `docker restart ${containerName}`);

    console.log('\n6️⃣ Waiting for app to be ready...\n');
    await new Promise(resolve => setTimeout(resolve, 10000));

    console.log('7️⃣ Checking app status...\n');
    await executeCommand(conn, `docker logs ${containerName} --tail 30 2>&1 | grep -i 'ready\|start\|listen' || docker logs ${containerName} --tail 10`);

    console.log('\n\n' + '='.repeat(80));
    console.log('✅ REBUILD COMPLETE!');
    console.log('='.repeat(80));
    console.log('\n🌐 App should now be running with latest code');
    console.log('🔄 Try uploading a file again and check console for new logs\n');
    console.log('Expected new logs:');
    console.log('  📤 Starting upload: filename.mp3');
    console.log('  ✅ Upload successful, ID: ...');
    console.log('  🔄 Fetching transcriptions to show new upload...\n');

    conn.end();

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

main();

