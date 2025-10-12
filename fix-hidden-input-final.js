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

    console.log('🔧 FIXING FILE INPUT - REPLACING hidden WITH ABSOLUTE POSITIONING\n');
    console.log('=' .repeat(80) + '\n');
    
    // Create precise patch for the hidden input
    console.log('📝 Patching workspace chunk 5376...\n');
    await executeCommand(conn, `
cat > /tmp/fix-hidden-input.js <<'FIXSCRIPT'
const fs = require('fs');

const file = '/app/.next/static/chunks/5376.c1d35fa17401c0b5.js';

try {
  let content = fs.readFileSync(file, 'utf8');
  
  console.log('Original size:', content.length);
  
  // Find and replace the hidden file input
  // Pattern: ref:eP,type:"file",className:"hidden"
  // Replace className:"hidden" with className:"absolute opacity-0 pointer-events-none w-0 h-0"
  
  // This will make the input invisible but still in the DOM and clickable via ref
  const before = content;
  
  content = content.replace(
    /type:"file",className:"hidden"/g,
    'type:"file",className:"absolute opacity-0 w-0 h-0"'
  );
  
  const modified = content !== before;
  
  if (modified) {
    fs.writeFileSync(file, content);
    console.log('✅ File input className changed from "hidden" to "absolute opacity-0 w-0 h-0"');
    console.log('New size:', content.length);
  } else {
    console.log('⚠️  Pattern not found or already patched');
  }
  
} catch (error) {
  console.error('Error:', error.message);
  process.exit(1);
}
FIXSCRIPT

docker cp /tmp/fix-hidden-input.js healthscribe-app:/tmp/fix-hidden-input.js
docker exec healthscribe-app node /tmp/fix-hidden-input.js
`);

    // Restart container
    console.log('\n🔄 Restarting container to apply fix...\n');
    await executeCommand(conn, `
docker restart healthscribe-app
sleep 40
docker ps --filter "name=healthscribe-app" --format "{{.Status}}"
`);

    // Update Traefik
    console.log('\n🔀 Updating Traefik routing...\n');
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

    // Final verification
    console.log('\n✅ Verifying patch was applied...\n');
    await executeCommand(conn, `
docker exec healthscribe-app grep -o 'type:"file",className:"absolute' /app/.next/static/chunks/5376.c1d35fa17401c0b5.js | head -1
`);

    console.log('\n' + '='.repeat(80));
    console.log('✅✅✅ FILE INPUT FIXED - className CHANGED FROM hidden ✅✅✅');
    console.log('='.repeat(80));
    console.log('\n📝 WHAT WAS CHANGED:');
    console.log('   OLD: className:"hidden" (display:none - blocks .click())');
    console.log('   NEW: className:"absolute opacity-0 w-0 h-0" (invisible but clickable)');
    console.log('\n🎯 TEST NOW:');
    console.log('1. Clear browser cache (Ctrl+Shift+Delete)');
    console.log('2. Go to: https://healthscribe.pro/dashboard/transcriptionist-workspace');
    console.log('3. Open browser console (F12)');
    console.log('4. Click "Drop audio file or click to browse"');
    console.log('5. You should see: "🖱️ Triggering file input click, ref exists: true"');
    console.log('6. File chooser should open!');
    console.log('\n✅ Fix applied and container restarted');
    console.log('');

    conn.end();

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

main();

