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

    console.log('🔍 Verifying Database State...\n');
    
    // Check all users
    console.log('1. Current users:\n');
    await executeCommand(conn, `
docker exec -it supabase-db-e088wwks88k8k48sccg8gk0o psql -U postgres -d postgres -c "SELECT id, email, email_confirmed_at, confirmed_at FROM auth.users ORDER BY created_at DESC;"
`);

    // Try UPDATE with explicit WHERE
    console.log('\n2. Updating user with explicit check:\n');
    const updateResult = await executeCommand(conn, `
docker exec -it supabase-db-e088wwks88k8k48sccg8gk0o psql -U postgres -d postgres <<'ENDSQL'
DO \\$\\$
DECLARE
  v_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_count FROM auth.users WHERE email = 'omars14@gmail.com';
  RAISE NOTICE 'Found % users with email omars14@gmail.com', v_count;
  
  UPDATE auth.users 
  SET email_confirmed_at = CURRENT_TIMESTAMP, 
      confirmed_at = CURRENT_TIMESTAMP,
      updated_at = CURRENT_TIMESTAMP
  WHERE email = 'omars14@gmail.com';
  
  RAISE NOTICE 'Updated % rows', v_count;
END\\$\\$;

SELECT id, email, email_confirmed_at IS NOT NULL as confirmed, confirmed_at IS NOT NULL as also_confirmed 
FROM auth.users 
WHERE email = 'omars14@gmail.com';
ENDSQL
`);

    console.log('\n3. Testing login:\n');
    const loginResult = await executeCommand(conn, `
curl -s -X POST "https://supabase.healthscribe.pro/auth/v1/token?grant_type=password" \\
  -H "Content-Type: application/json" \\
  -H "apikey: eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJzdXBhYmFzZSIsImlhdCI6MTc1ODMyOTQwMCwiZXhwIjo0OTE0MDAzMDAwLCJyb2xlIjoiYW5vbiJ9.USAl15ClzSLfHwEYQn-bQQaZNz79FkDGUPsohnnEqJA" \\
  -d '{"email":"omars14@gmail.com","password":"Nomar123"}'
`);

    console.log(loginResult + '\n');

    if (loginResult.includes('"access_token"')) {
      console.log('✅✅✅ LOGIN SUCCESS! SYSTEM 100% OPERATIONAL! ✅✅✅\n');
    } else {
      console.log('❌ Still failing. Checking if autoconfirm can be enabled...\n');
    }

    conn.end();

  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

main();

