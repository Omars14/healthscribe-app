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

    console.log('🔍 Checking API Route Patch Status\n');
    
    // Check for old URL
    const oldCheck = await executeCommand(conn, `
docker exec healthscribe-app grep -c "yaznemrwbingjwqutbvb" /app/.next/server/app/api/transcriptions/route.js 2>/dev/null || echo "0"
`);

    console.log('Old cloud URL occurrences: ' + oldCheck.trim() + '\n');

    // Check for new URL
    const newCheck = await executeCommand(conn, `
docker exec healthscribe-app grep -c "supabase.healthscribe.pro" /app/.next/server/app/api/transcriptions/route.js 2>/dev/null || echo "0"
`);

    console.log('New self-hosted URL occurrences: ' + newCheck.trim() + '\n');

    // Show a sample of the file
    console.log('Sample of route.js:\n');
    await executeCommand(conn, `
docker exec healthscribe-app cat /app/.next/server/app/api/transcriptions/route.js | head -200 | tail -100
`);

    conn.end();

  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

main();

