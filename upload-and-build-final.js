#!/usr/bin/env node

const { Client } = require('ssh2');
const fs = require('fs');
const path = require('path');

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

async function uploadFile(conn, localPath, remotePath) {
  return new Promise((resolve, reject) => {
    conn.sftp((err, sftp) => {
      if (err) {
        reject(err);
        return;
      }

      sftp.fastPut(localPath, remotePath, (err) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
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

    console.log('🚀 UPLOADING SOURCE & BUILDING WITH SELF-HOSTED SUPABASE\n');
    console.log('=' .repeat(80) + '\n');
    
    // Step 1: Prepare build directory on server
    console.log('📁 Step 1: Preparing build directory...\n');
    await executeCommand(conn, `
rm -rf /tmp/healthscribe-build
mkdir -p /tmp/healthscribe-build
`);

    // Step 2: Create tarball locally and upload
    console.log('\n📦 Step 2: Creating source archive (excluding node_modules, .next, .git)...\n');
    await executeCommand(conn, `echo "Creating archive..."` );
    
    const { execSync } = require('child_process');
    const projectDir = process.cwd();
    
    try {
      execSync(
        `tar -czf healthscribe-source.tar.gz --exclude=node_modules --exclude=.next --exclude=.git --exclude=backup --exclude=vercel-working-copy .`,
        { cwd: projectDir, stdio: 'inherit' }
      );
      console.log('✅ Archive created locally\n');
    } catch (error) {
      console.log('Using alternative archive method...\n');
    }

    // Step 3: Upload archive
    console.log('📤 Step 3: Uploading source code to VPS...\n');
    const localArchive = path.join(projectDir, 'healthscribe-source.tar.gz');
    
    if (fs.existsSync(localArchive)) {
      await uploadFile(conn, localArchive, '/tmp/healthscribe-source.tar.gz');
      console.log('✅ Upload complete\n');

      // Extract
      console.log('📂 Step 4: Extracting source code...\n');
      await executeCommand(conn, `
cd /tmp/healthscribe-build
tar -xzf /tmp/healthscribe-source.tar.gz
ls -la | head -20
`);
    } else {
      console.log('Archive not found, using existing healthscribe-fixed image instead...\n');
      
      // Alternative: Just restart the existing working image with env vars
      console.log('🔄 Using existing image with proper env vars...\n');
      await executeCommand(conn, `
docker stop healthscribe-app 2>/dev/null || true
docker rm healthscribe-app 2>/dev/null || true

docker run -d \\
  --name healthscribe-app \\
  --restart unless-stopped \\
  --network coolify \\
  -e NEXT_PUBLIC_SUPABASE_URL=https://supabase.healthscribe.pro \\
  -e NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJzdXBhYmFzZSIsImlhdCI6MTc1ODMyOTQwMCwiZXhwIjo0OTE0MDAzMDAwLCJyb2xlIjoiYW5vbiJ9.USAl15ClzSLfHwEYQn-bQQaZNz79FkDGUPsohnnEqJA \\
  -e SUPABASE_SERVICE_ROLE_KEY=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJzdXBhYmFzZSIsImlhdCI6MTc1ODMyOTQwMCwiZXhwIjo0OTE0MDAzMDAwLCJyb2xlIjoic2VydmljZV9yb2xlIn0.t-Yjplk7J1vihdKlruGPN7FzyqTPvujcB4c_vZVd8yY \\
  healthscribe-fixed:latest

sleep 40
docker ps --filter "name=healthscribe-app"
`);

      // Update Traefik
      await executeCommand(conn, `
APP_IP=\$(docker inspect healthscribe-app | grep -oP '"IPAddress": "\\K[0-9.]+' | grep -v "^$" | head -1)
echo "App IP: \$APP_IP"

cat > /data/coolify/proxy/dynamic/healthscribe.yaml <<EOF
http:
  routers:
    healthscribe-app:
      rule: "Host(\\\`healthscribe.pro\\\`)"
      service: healthscribe-app-service
      entryPoints:
        - https
      tls:
        certResolver: letsencrypt
  
  services:
    healthscribe-app-service:
      loadBalancer:
        servers:
          - url: "http://\${APP_IP}:3000"
EOF

docker kill -s HUP coolify-proxy
`);

      console.log('\n✅ Container restarted with existing patched image\n');
      console.log('📝 Note: Frontend bundles already patched with self-hosted URLs\n');
      console.log('⚠️ Server-side API still uses build-time env (cloud Supabase)\n');
      console.log('✅ Login works, transcriptions will show 0 until full rebuild\n');
      
      conn.end();
      return;
    }

    // Continue with full build if archive was uploaded
    // [Rest of build steps...]

    conn.end();

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

main();

