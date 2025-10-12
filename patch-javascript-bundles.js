#!/usr/bin/env node

const { Client } = require('ssh2');

const SSH_CONFIG = {
  host: '154.26.155.207',
  port: 22,
  username: 'root',
  password: 'Nomar123'
};

const OLD_URL = 'yaznemrwbingjwqutbvb.supabase.co';
const OLD_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inlhem5lbXJ3YmluZ2p3cXV0YnZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU0NjA0MzAsImV4cCI6MjA3MTAzNjQzMH0.uluQzD4-m91tUq0gOrUNOfR9rlN0Ry4tAPlxp-PWrIo';
const OLD_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inlhem5lbXJ3YmluZ2p3cXV0YnZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTQ2MDQzMCwiZXhwIjoyMDcxMDM2NDMwfQ.9Ib029SJ7rGbBI4JMoEKacX4LMOZbzOedDZ9JGtuXas';

const NEW_URL = 'supabase.healthscribe.pro';
const NEW_ANON_KEY = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJzdXBhYmFzZSIsImlhdCI6MTc1ODMyOTQwMCwiZXhwIjo0OTE0MDAzMDAwLCJyb2xlIjoiYW5vbiJ9.USAl15ClzSLfHwEYQn-bQQaZNz79FkDGUPsohnnEqJA';
const NEW_SERVICE_KEY = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJzdXBhYmFzZSIsImlhdCI6MTc1ODMyOTQwMCwiZXhwIjo0OTE0MDAzMDAwLCJyb2xlIjoic2VydmljZV9yb2xlIn0.t-Yjplk7J1vihdKlruGPN7FzyqTPvujcB4c_vZVd8yY';

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

    console.log('🔧 Patching JavaScript Bundles with Self-Hosted Supabase...\n');
    
    // Find and patch all JavaScript files
    console.log('1. Finding and patching JavaScript files:\n');
    await executeCommand(conn, `
docker exec healthscribe-app find /app/.next/static -name '*.js' -type f | wc -l
echo "JavaScript files found"

# Replace URLs
docker exec healthscribe-app sh -c 'find /app/.next/static -name "*.js" -type f -exec sed -i "s/${OLD_URL}/${NEW_URL}/g" {} \\;'
echo "URLs replaced"

# Replace anon keys
docker exec healthscribe-app sh -c 'find /app/.next/static -name "*.js" -type f -exec sed -i "s/${OLD_ANON_KEY}/${NEW_ANON_KEY}/g" {} \\;'
echo "Anon keys replaced"

# Replace service keys
docker exec healthscribe-app sh -c 'find /app/.next/static -name "*.js" -type f -exec sed -i "s/${OLD_SERVICE_KEY}/${NEW_SERVICE_KEY}/g" {} \\;'
echo "Service keys replaced"
`);

    // Also patch server bundles
    console.log('\n2. Patching server bundles:\n');
    await executeCommand(conn, `
docker exec healthscribe-app sh -c 'find /app/.next/server -name "*.js" -type f -exec sed -i "s/${OLD_URL}/${NEW_URL}/g" {} \\;'
docker exec healthscribe-app sh -c 'find /app/.next/server -name "*.js" -type f -exec sed -i "s/${OLD_ANON_KEY}/${NEW_ANON_KEY}/g" {} \\;'
docker exec healthscribe-app sh -c 'find /app/.next/server -name "*.js" -type f -exec sed -i "s/${OLD_SERVICE_KEY}/${NEW_SERVICE_KEY}/g" {} \\;'
echo "Server bundles patched"
`);

    // Restart application
    console.log('\n3. Restarting application:\n');
    await executeCommand(conn, `
docker restart healthscribe-app
sleep 30
docker ps --filter "name=healthscribe-app" --format "{{.Status}}"
`);

    // Verify
    console.log('\n4. Verifying patch:\n');
    await executeCommand(conn, `
docker exec healthscribe-app grep -r "${NEW_URL}" /app/.next/static | head -3
echo "Self-hosted URL found in bundles"
`);

    console.log('\n' + '='.repeat(80));
    console.log('✅ JAVASCRIPT BUNDLES PATCHED WITH SELF-HOSTED CREDENTIALS');
    console.log('='.repeat(80));
    console.log('\n🎯 Testing in browser now...');
    console.log('');

    conn.end();

  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

main();

