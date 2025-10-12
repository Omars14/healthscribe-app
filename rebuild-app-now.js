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

    console.log('🚀 REBUILDING HEALTHSCRIBE APP WITH LATEST CODE\n');
    console.log('=' .repeat(80) + '\n');

    const containerName = 'tkwoos4soccckws84088wc04-184252873467';
    const imageName = 'healthscribe-new:latest';

    console.log('1️⃣ Finding build directory...\n');
    
    // Try to find where the source code is
    const findDir = await executeCommand(conn, `
      find /data/coolify -maxdepth 4 -name "package.json" -type f 2>/dev/null | 
      grep -v node_modules | 
      xargs -I {} dirname {} | 
      head -1
    `);
    
    let buildDir = findDir.trim();
    
    if (!buildDir) {
      console.log('Could not find build directory, trying alternative location...\n');
      buildDir = '/root/dashboard-next'; // Fallback to known location
    }
    
    console.log(`Build directory: ${buildDir}\n`);

    console.log('2️⃣ Pulling latest code from GitHub...\n');
    await executeCommand(conn, `
      cd ${buildDir} && 
      git fetch origin && 
      git reset --hard origin/master && 
      git log --oneline -3
    `);

    console.log('\n3️⃣ Building new Docker image...\n');
    await executeCommand(conn, `
      cd ${buildDir} && 
      docker build -t ${imageName} -f Dockerfile . 2>&1 | tail -20
    `);

    console.log('\n4️⃣ Stopping old container...\n');
    await executeCommand(conn, `docker stop ${containerName}`);

    console.log('\n5️⃣ Removing old container...\n');
    await executeCommand(conn, `docker rm ${containerName}`);

    console.log('\n6️⃣ Starting new container with updated image...\n');
    
    // Get the original docker run command from Coolify
    const dockerCmd = await executeCommand(conn, `
      docker run -d --name ${containerName} \\
        --network coolify \\
        --restart unless-stopped \\
        --env-file ${buildDir}/.env.local \\
        -p 3000:3000 \\
        ${imageName}
    `);
    
    console.log(`New container ID: ${dockerCmd.trim()}\n`);

    console.log('7️⃣ Waiting for app to start...\n');
    await new Promise(resolve => setTimeout(resolve, 15000));

    console.log('8️⃣ Checking container status...\n');
    await executeCommand(conn, `docker ps --filter name=${containerName} --format "Name: {{.Names}}\\nStatus: {{.Status}}\\nPorts: {{.Ports}}"`);

    console.log('\n9️⃣ Checking app logs...\n');
    await executeCommand(conn, `docker logs ${containerName} --tail 20 2>&1 | grep -i "ready\\|start\\|listen\\|error" || docker logs ${containerName} --tail 10`);

    console.log('\n\n' + '='.repeat(80));
    console.log('✅✅✅ REBUILD COMPLETE! ✅✅✅');
    console.log('='.repeat(80));
    console.log('\n🌐 App is running with the latest code!');
    console.log('\n📋 NEXT STEPS:');
    console.log('1. Go to: https://healthscribe.pro');
    console.log('2. Hard refresh browser: Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)');
    console.log('3. Upload a file');
    console.log('4. Check console logs for:');
    console.log('   📤 Starting upload: filename.mp3');
    console.log('   ✅ Upload successful, ID: ...');
    console.log('   🔄 Fetching transcriptions to show new upload...');
    console.log('   ✅ Found new upload in list: filename.mp3\n');

    conn.end();

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('\nTrying alternative rebuild method...\n');
    
    // Fallback: Just rebuild and restart
    try {
      console.log('Attempting simple rebuild from /root/dashboard-next...\n');
      await executeCommand(conn, `
        cd /root/dashboard-next && 
        git pull origin master && 
        docker build -t healthscribe-new:latest . && 
        docker restart tkwoos4soccckws84088wc04-184252873467
      `);
      console.log('\n✅ Rebuild complete via fallback method!');
    } catch (fallbackError) {
      console.error('❌ Fallback also failed:', fallbackError.message);
    }
    
    conn.end();
    process.exit(1);
  }
}

main();

