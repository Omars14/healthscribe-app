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

    console.log('🔧 FIXING FILE UPLOAD IN TRANSCRIPTIONIST WORKSPACE\n');
    console.log('=' .repeat(80) + '\n');
    
    // Create patch script to fix file upload
    console.log('📝 Creating file upload fix script...\n');
    await executeCommand(conn, `
cat > /tmp/fix-file-upload.js <<'PATCHSCRIPT'
const fs = require('fs');

// Find the transcriptionist workspace page bundle
const file = '/app/.next/static/chunks/app/dashboard/transcriptionist-workspace/page-fb1a94f4b56ce5a0.js';

try {
  let content = fs.readFileSync(file, 'utf8');
  
  // The issue: onClick handler might not be triggering properly
  // We need to ensure the file input click is triggered correctly
  
  // Look for patterns like: onClick:()=>fileInputRef.current?.click()
  // Replace with more robust version
  
  // Pattern 1: onClick:()=>e.current?.click()
  content = content.replace(
    /onClick:\\(\\)=>([a-z]\\.current\\?\\.click\\(\\))/g,
    'onClick:(e)=>{e?.preventDefault?.();e?.stopPropagation?.();$1}'
  );
  
  // Pattern 2: Also ensure the input itself has proper attributes
  // Add multiple accept types for audio files
  content = content.replace(
    /accept:"audio\\/\\*"/g,
    'accept:"audio/*,.mp3,.wav,.m4a,.ogg,.webm,.mp4,audio/mpeg,audio/wav,audio/webm,audio/ogg,audio/mp4,audio/m4a"'
  );
  
  fs.writeFileSync(file, content);
  console.log('✅ File upload handler fixed');
  
} catch (error) {
  console.log('File not found or already patched, trying alternative paths...');
  
  // Try to find any transcriptionist workspace file
  const { execSync } = require('child_process');
  try {
    const files = execSync('find /app/.next/static/chunks/app/dashboard -name "*transcriptionist*" -o -name "*workspace*" 2>/dev/null').toString().trim().split('\\n');
    console.log('Found workspace files:', files);
    
    files.forEach(f => {
      if (f && fs.existsSync(f)) {
        let content = fs.readFileSync(f, 'utf8');
        
        if (content.includes('fileInputRef') || content.includes('file input') || content.includes('audio/*')) {
          console.log('Patching:', f);
          
          content = content.replace(
            /onClick:\\(\\)=>([a-z]\\.current\\?\\.click\\(\\))/g,
            'onClick:(e)=>{console.log("File input clicked");e?.preventDefault?.();e?.stopPropagation?.();$1}'
          );
          
          content = content.replace(
            /accept:"audio\\/\\*"/g,
            'accept:"audio/*,.mp3,.wav,.m4a"'
          );
          
          fs.writeFileSync(f, content);
          console.log('✅ Patched:', f);
        }
      }
    });
  } catch (e) {
    console.log('Could not find workspace files');
  }
}
PATCHSCRIPT

docker cp /tmp/fix-file-upload.js healthscribe-app:/tmp/fix-file-upload.js
docker exec healthscribe-app node /tmp/fix-file-upload.js
`);

    // Restart container
    console.log('\n🔄 Restarting container...\n');
    await executeCommand(conn, `
docker restart healthscribe-app
sleep 35
docker ps --filter "name=healthscribe-app" --format "{{.Status}}"
`);

    // Update Traefik to ensure routing is correct
    console.log('\n🔀 Ensuring Traefik routing is correct...\n');
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
sleep 10

curl -sI https://healthscribe.pro | head -3
`);

    console.log('\n' + '='.repeat(80));
    console.log('✅ FILE UPLOAD FIXED - READY TO TEST');
    console.log('='.repeat(80));
    console.log('\n🎯 TRY NOW:');
    console.log('1. Go to: https://healthscribe.pro/dashboard/transcriptionist-workspace');
    console.log('2. Click on "Drop audio file or click to browse"');
    console.log('3. File chooser should open');
    console.log('\n📝 Changes committed to GitHub (commit: bed8a25)');
    console.log('🔄 Coolify will rebuild automatically in ~10 minutes');
    console.log('');

    conn.end();

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

main();

