#!/usr/bin/env node

const { Client } = require('ssh2');
const jwt = require('jsonwebtoken');

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

    console.log('🔑 REGENERATING JWT TOKENS\n');
    console.log('=' .repeat(80) + '\n');

    // Get the correct JWT secret
    console.log('1️⃣ Getting JWT secret...\n');
    const jwtSecret = 'p6WslAn863JJYORSGONvfi3sXLpkqKQv';
    console.log(`JWT Secret: ${jwtSecret}\n`);

    // Generate new tokens
    console.log('2️⃣ Generating new JWT tokens...\n');
    
    const anonToken = jwt.sign(
      {
        role: 'anon',
        iss: 'supabase',
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + (365 * 24 * 60 * 60 * 10) // 10 years
      },
      jwtSecret
    );

    const serviceRoleToken = jwt.sign(
      {
        role: 'service_role',
        iss: 'supabase',
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + (365 * 24 * 60 * 60 * 10) // 10 years
      },
      jwtSecret
    );

    console.log('✅ New tokens generated:\n');
    console.log(`Anon Key: ${anonToken}\n`);
    console.log(`Service Role Key: ${serviceRoleToken}\n`);

    // Test the new tokens
    console.log('3️⃣ Testing new tokens with REST API...\n');
    await executeCommand(conn, `
curl -s "http://10.0.1.9:3000/transcriptions?select=id,status&limit=3" \\
  -H "apikey: ${anonToken}" \\
  -H "Authorization: Bearer ${serviceRoleToken}"
`);

    // Update application environment
    console.log('\n\n4️⃣ Updating application environment...\n');
    await executeCommand(conn, `
cd /data/coolify/applications/tkwoos4soccckws84088wc04

# Update .env file
sed -i 's|NEXT_PUBLIC_SUPABASE_ANON_KEY=.*|NEXT_PUBLIC_SUPABASE_ANON_KEY=${anonToken}|' .env
sed -i 's|SUPABASE_SERVICE_ROLE_KEY=.*|SUPABASE_SERVICE_ROLE_KEY=${serviceRoleToken}|' .env

echo "✅ .env updated"
cat .env | grep -E "ANON_KEY|SERVICE_ROLE"
`);

    // Restart application
    console.log('\n5️⃣ Restarting application...\n');
    await executeCommand(conn, `
docker restart tkwoos4soccckws84088wc04-184252873467
sleep 15
echo "✅ Application restarted"
`);

    // Update .env.local on local machine
    console.log('\n6️⃣ Updating local .env.local file...\n');
    console.log('Please update your local .env.local file with these values:\n');
    console.log('NEXT_PUBLIC_SUPABASE_ANON_KEY=' + anonToken);
    console.log('SUPABASE_SERVICE_ROLE_KEY=' + serviceRoleToken);
    console.log('');

    // Final test
    console.log('7️⃣ Final test via Traefik...\n');
    await executeCommand(conn, `
curl -s "https://supabase.healthscribe.pro/rest/v1/transcriptions?select=id,status&limit=3" \\
  -H "apikey: ${anonToken}" \\
  -H "Authorization: Bearer ${serviceRoleToken}"
`);

    console.log('\n\n' + '='.repeat(80));
    console.log('✅✅✅ JWT TOKENS REGENERATED! ✅✅✅');
    console.log('='.repeat(80));
    console.log('\n📋 Summary:');
    console.log(`✅ New Anon Key: ${anonToken}`);
    console.log(`✅ New Service Role Key: ${serviceRoleToken}`);
    console.log('\n🚀 Hard refresh browser and check transcription history!');
    console.log('');

    conn.end();

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

main();

