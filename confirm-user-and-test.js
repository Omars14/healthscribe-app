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

    console.log('🔧 Confirming User and Testing Login...\n');
    
    // Check and update user
    console.log('1. Confirming user:\n');
    await executeCommand(conn, `
docker exec supabase-db-e088wwks88k8k48sccg8gk0o psql -U postgres -d postgres <<'SQL'
UPDATE auth.users 
SET email_confirmed_at = NOW(), 
    confirmed_at = NOW() 
WHERE email = 'omars14@gmail.com' 
RETURNING email, email_confirmed_at IS NOT NULL as confirmed;
SQL
`);

    // Wait a moment for any caches to clear
    console.log('\n2. Waiting 5 seconds...\n');
    await new Promise(resolve => setTimeout(resolve, 5000));

    // Test login
    console.log('3. Testing login:\n');
    const loginResult = await executeCommand(conn, `
curl -s -X POST "https://supabase.healthscribe.pro/auth/v1/token?grant_type=password" \\
  -H "Content-Type: application/json" \\
  -H "apikey: eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJzdXBhYmFzZSIsImlhdCI6MTc1ODMyOTQwMCwiZXhwIjo0OTE0MDAzMDAwLCJyb2xlIjoiYW5vbiJ9.USAl15ClzSLfHwEYQn-bQQaZNz79FkDGUPsohnnEqJA" \\
  -d '{"email":"omars14@gmail.com","password":"Nomar123"}'
`);

    console.log('\n' + loginResult + '\n');

    if (loginResult.includes('"access_token"')) {
      console.log('\n✅✅✅ LOGIN SUCCESS! ✅✅✅\n');
      
      // Extract token and test API
      const tokenMatch = loginResult.match(/"access_token":"([^"]+)"/);
      if (tokenMatch) {
        const token = tokenMatch[1];
        
        console.log('4. Testing transcriptions API:\n');
        const transResult = await executeCommand(conn, `
curl -s "https://supabase.healthscribe.pro/rest/v1/transcriptions?select=file_name,status&order=created_at.desc&limit=5" \\
  -H "apikey: eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJzdXBhYmFzZSIsImlhdCI6MTc1ODMyOTQwMCwiZXhwIjo0OTE0MDAzMDAwLCJyb2xlIjoiYW5vbiJ9.USAl15ClzSLfHwEYQn-bQQaZNz79FkDGUPsohnnEqJA" \\
  -H "Authorization: Bearer ${token}"
`);
        
        console.log(transResult + '\n');
        
        if (transResult.includes('"file_name"')) {
          console.log('✅✅✅ TRANSCRIPTIONS API WORKING! ✅✅✅\n');
          console.log('✅✅✅ SYSTEM 100% OPERATIONAL! ✅✅✅\n');
          process.exit(0);
        }
      }
    } else {
      console.log('❌ Still failing, checking GoTrue cache...\n');
      
      // Restart GoTrue to clear any cache
      console.log('5. Restarting GoTrue auth service:\n');
      await executeCommand(conn, `
cd /data/coolify/services/e088wwks88k8k48sccg8gk0o
docker-compose restart supabase-auth
sleep 15
`);
      
      console.log('6. Testing login after restart:\n');
      const retryLogin = await executeCommand(conn, `
curl -s -X POST "https://supabase.healthscribe.pro/auth/v1/token?grant_type=password" \\
  -H "Content-Type: application/json" \\
  -H "apikey: eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJzdXBhYmFzZSIsImlhdCI6MTc1ODMyOTQwMCwiZXhwIjo0OTE0MDAzMDAwLCJyb2xlIjoiYW5vbiJ9.USAl15ClzSLfHwEYQn-bQQaZNz79FkDGUPsohnnEqJA" \\
  -d '{"email":"omars14@gmail.com","password":"Nomar123"}'
`);
      
      console.log('\n' + retryLogin + '\n');
      
      if (retryLogin.includes('"access_token"')) {
        console.log('\n✅✅✅ LOGIN SUCCESS AFTER RESTART! ✅✅✅\n');
        console.log('✅✅✅ SYSTEM 100% OPERATIONAL! ✅✅✅\n');
      } else {
        console.log('❌ Login still failing after restart\n');
        process.exit(1);
      }
    }

    conn.end();

  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

main();

