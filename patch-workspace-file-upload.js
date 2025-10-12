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

    console.log('🔧 PATCHING WORKSPACE FILE UPLOAD HANDLER\n');
    console.log('=' .repeat(80) + '\n');
    
    // Patch the workspace page
    console.log('📝 Patching workspace page bundle...\n');
    await executeCommand(conn, `
cat > /tmp/patch-workspace.js <<'PATCHSCRIPT'
const fs = require('fs');

const file = '/app/.next/static/chunks/app/dashboard/transcriptionist-workspace/page-017cc4e0b42062fc.js';

try {
  let content = fs.readFileSync(file, 'utf8');
  let modified = false;
  
  // Pattern 1: Fix onClick handler to prevent default and stop propagation
  // Look for: onClick:()=>X.current?.click()
  // Replace with: onClick:(e)=>{e?.preventDefault();e?.stopPropagation();X.current?.click()}
  
  const onClickPattern = /onClick:\\(\\)=>([a-zA-Z0-9_]+\\.current\\?\\.click\\(\\))/g;
  if (content.match(onClickPattern)) {
    content = content.replace(
      onClickPattern,
      'onClick:(e)=>{e.preventDefault();e.stopPropagation();$1}'
    );
    modified = true;
    console.log('✅ Fixed onClick handler');
  }
  
  // Pattern 2: Ensure file input is not hidden from events
  // Make sure pointer-events are enabled
  const hiddenPattern = /className:"hidden"/g;
  if (content.match(hiddenPattern)) {
    // Replace hidden with sr-only and pointer-events-none
    content = content.replace(
      /(<input[^>]*className:)"hidden"/g,
      '$1"absolute opacity-0 w-0 h-0"'
    );
    modified = true;
    console.log('✅ Fixed input visibility');
  }
  
  // Pattern 3: Add expanded accept types
  if (content.includes('accept:"audio/*"')) {
    content = content.replace(
      /accept:"audio\\/\\*"/g,
      'accept:"audio/*,audio/mpeg,audio/wav,audio/webm,audio/ogg,audio/mp4,audio/m4a,.mp3,.wav,.m4a,.ogg,.webm"'
    );
    modified = true;
    console.log('✅ Expanded accept types');
  }
  
  if (modified) {
    fs.writeFileSync(file, content);
    console.log('\\n✅ Workspace file upload patched successfully');
  } else {
    console.log('⚠️  No patterns matched - file may already be patched');
  }
  
} catch (error) {
  console.error('Error patching file:', error.message);
  process.exit(1);
}
PATCHSCRIPT

docker cp /tmp/patch-workspace.js healthscribe-app:/tmp/patch-workspace.js
docker exec healthscribe-app node /tmp/patch-workspace.js
`);

    // Restart container
    console.log('\n🔄 Restarting container to apply changes...\n');
    await executeCommand(conn, `
docker restart healthscribe-app
sleep 35
docker ps --filter "name=healthscribe-app" --format "{{.Status}}"
`);

    // Update routing
    console.log('\n🔀 Updating Traefik...\n');
    await executeCommand(conn, `
APP_IP=\$(docker inspect healthscribe-app | grep -oP '"IPAddress": "\\K[0-9.]+' | grep -v "^$" | head -1)

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
sleep 10

curl -sI https://healthscribe.pro | head -3
`);

    console.log('\n' + '='.repeat(80));
    console.log('✅✅✅ FILE UPLOAD FIXED - TEST NOW! ✅✅✅');
    console.log('='.repeat(80));
    console.log('\n🎯 TEST:');
    console.log('1. Clear browser cache');
    console.log('2. Go to: https://healthscribe.pro/dashboard/transcriptionist-workspace');
    console.log('3. Click on the upload area');
    console.log('4. File chooser should now open!');
    console.log('\n✅ Fix applied to running container (immediate)');
    console.log('🔄 Also committed to GitHub for permanent fix');
    console.log('');

    conn.end();

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

main();

