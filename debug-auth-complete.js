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

    console.log('🔍 Debugging GoTrue Authentication...\n');
    
    // Check JWT secret configuration
    console.log('1. Checking JWT Secret Configuration:\n');
    await executeCommand(conn, `
docker exec supabase-auth-e088wwks88k8k48sccg8gk0o env | grep JWT_SECRET
echo "---"
cat /data/coolify/services/e088wwks88k8k48sccg8gk0o/.env | grep JWT
`);

    // Check GoTrue logs for auth errors
    console.log('\n2. Checking GoTrue Logs:\n');
    await executeCommand(conn, `
docker logs supabase-auth-e088wwks88k8k48sccg8gk0o --tail 50 | grep -i "error\\|login\\|credential"
`);

    // Check database schema
    console.log('\n3. Checking Database Schema:\n');
    await executeCommand(conn, `
docker exec supabase-db-e088wwks88k8k48sccg8gk0o psql -U postgres -d postgres -c "SELECT column_name, data_type, is_nullable FROM information_schema.columns WHERE table_schema = 'auth' AND table_name = 'users' ORDER BY ordinal_position;"
`);

    // Check current users
    console.log('\n4. Checking Current Users:\n');
    await executeCommand(conn, `
docker exec supabase-db-e088wwks88k8k48sccg8gk0o psql -U postgres -d postgres -c "SELECT id, email, encrypted_password IS NOT NULL as has_password, email_confirmed_at IS NOT NULL as confirmed, created_at FROM auth.users;"
`);

    // Try signup instead of login
    console.log('\n5. Testing Signup (auto-confirm):\n');
    const signupResult = await executeCommand(conn, `
curl -s -X POST "https://supabase.healthscribe.pro/auth/v1/signup" \\
  -H "Content-Type: application/json" \\
  -H "apikey: eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJzdXBhYmFzZSIsImlhdCI6MTc1ODMyOTQwMCwiZXhwIjo0OTE0MDAzMDAwLCJyb2xlIjoiYW5vbiJ9.USAl15ClzSLfHwEYQn-bQQaZNz79FkDGUPsohnnEqJA" \\
  -d '{"email":"test2@healthscribe.pro","password":"Test1234!"}' | jq '.'
`);

    if (signupResult.includes('"access_token"')) {
      console.log('\n✅ Signup works! Issue is with existing user...\n');
    }

    conn.end();

  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

main();

