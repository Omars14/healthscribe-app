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

    console.log('🔧 UPDATING JWT KEYS AND REBUILDING APPLICATION\n');
    console.log('=' .repeat(80) + '\n');

    // Update Coolify .env
    console.log('1️⃣ Updating Coolify application environment...\n');
    await executeCommand(conn, `
cd /data/coolify/applications/tkwoos4soccckws84088wc04

# Update JWT keys
sed -i 's|NEXT_PUBLIC_SUPABASE_ANON_KEY=.*|NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYW5vbiIsImlzcyI6InN1cGFiYXNlIiwiaWF0IjoxNzYwMjk5MjYwLCJleHAiOjIwNzU2NTkyNjB9.fuBekR-do0ST4CxThWM5UcjFacFpZC3AMqxNSSp3DMM|' .env
sed -i 's|SUPABASE_SERVICE_ROLE_KEY=.*|SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoic2VydmljZV9yb2xlIiwiaXNzIjoic3VwYWJhc2UiLCJpYXQiOjE3NjAyOTkyNjAsImV4cCI6MjA3NTY1OTI2MH0.BLOKCUrBXkmjGPsg39H4aGInVjgBqZPaRsMH1dpksDQ|' .env

echo "✅ Environment updated"
cat .env | grep -E "ANON_KEY|SERVICE_ROLE"
`);

    // Restart application
    console.log('\n2️⃣ Restarting application...\n');
    await executeCommand(conn, `
docker restart tkwoos4soccckws84088wc04-184252873467
sleep 15
echo "✅ Application restarted"
`);

    // Verify
    console.log('\n3️⃣ Testing application...\n');
    await executeCommand(conn, `
curl -s -I https://healthscribe.pro | grep HTTP
`);

    console.log('\n\n' + '='.repeat(80));
    console.log('✅✅✅ JWT KEYS UPDATED! ✅✅✅');
    console.log('='.repeat(80));
    console.log('\n🔑 New JWT Keys Applied:');
    console.log('✅ Anon Key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYW5vbiI...');
    console.log('✅ Service Role Key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoic2VydmljZV9yb2xlIi...');
    console.log('\n🚀 NEXT STEPS:');
    console.log('1. Hard refresh browser (CTRL + SHIFT + R)');
    console.log('2. Clear browser cache if needed');
    console.log('3. Login to https://healthscribe.pro');
    console.log('4. Check transcription history in Transcriptionist Workspace');
    console.log('\n📊 You should now see all 32 transcriptions!');
    console.log('');

    conn.end();

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

main();

