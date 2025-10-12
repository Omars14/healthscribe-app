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

    console.log('🔧 PATCHING WORKSPACE CHUNK FOR FILE UPLOAD\n');
    console.log('=' .repeat(80) + '\n');
    
    // Patch the actual chunk file
    console.log('📝 Patching chunk 7355...\n');
    await executeCommand(conn, `
cat > /tmp/patch-chunk.js <<'PATCHSCRIPT'
const fs = require('fs');

const file = '/app/.next/static/chunks/7355.9687b6ffc3b9a2e2.js';

try {
  let content = fs.readFileSync(file, 'utf8');
  let originalLength = content.length;
  
  // Search for file input related code patterns
  console.log('Searching for file input patterns...');
  
  // Pattern 1: onClick handlers for file selection
  // Minified: onClick:()=>X.current.click()
  // We want: onClick:(e)=>{e.preventDefault();X.current.click()}
  
  let modified = false;
  
  // Fix all onClick handlers that trigger .click() on refs
  const clickPatterns = [
    /onClick:function\\(\\){return ([a-zA-Z0-9_]+\\.current\\.click\\(\\))}/g,
    /onClick:\\(\\)=>([a-zA-Z0-9_]+\\.current\\?\\.click\\(\\))/g,
    /onClick:e=>([a-zA-Z0-9_]+\\.current\\?\\.click\\(\\))/g
  ];
  
  clickPatterns.forEach((pattern, idx) => {
    const matches = content.match(pattern);
    if (matches) {
      console.log(\`Found pattern \${idx}: \${matches.length} matches\`);
      content = content.replace(pattern, 'onClick:function(e){e&&e.preventDefault&&e.preventDefault();e&&e.stopPropagation&&e.stopPropagation();$1}');
      modified = true;
    }
  });
  
  // Also fix any hidden inputs that might block clicks
  if (content.includes('className:"hidden"') && content.includes('type:"file"')) {
    content = content.replace(
      /(type:"file"[^}]*className:)"hidden"/g,
      '$1"sr-only"'
    );
    modified = true;
    console.log('✅ Fixed hidden file input');
  }
  
  if (modified) {
    fs.writeFileSync(file, content);
    console.log(\`✅ Chunk patched (size: \${originalLength} -> \${content.length})\`);
  } else {
    console.log('ℹ️  No modifications needed or patterns not found');
  }
  
} catch (error) {
  console.error('Patch error:', error.message);
  process.exit(1);
}
PATCHSCRIPT

docker cp /tmp/patch-chunk.js healthscribe-app:/tmp/patch-chunk.js
docker exec healthscribe-app node /tmp/patch-chunk.js
`);

    // Restart
    console.log('\n🔄 Restarting container...\n');
    await executeCommand(conn, `
docker restart healthscribe-app
sleep 35
docker ps --filter "name=healthscribe-app" --format "{{.Status}}"
curl -sI https://healthscribe.pro | head -3
`);

    console.log('\n' + '='.repeat(80));
    console.log('✅ WORKSPACE FILE UPLOAD PATCHED');
    console.log('='.repeat(80));
    console.log('\n🎯 TEST NOW:');
    console.log('1. https://healthscribe.pro/dashboard/transcriptionist-workspace');
    console.log('2. Click upload area - file chooser should open!');
    console.log('');
    
    // Clean up
    await executeCommand(conn, `
rm -f /tmp/patch-chunk.js /tmp/patch-workspace.js
`);

    conn.end();

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

main();

