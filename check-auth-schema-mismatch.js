#!/usr/bin/env node

const { Client } = require('ssh2');

const SSH_CONFIG = {
  host: '154.26.155.207',
  port: 22,
  username: 'root',
  password: 'Nomar123'
};

function executeCommand(conn, command, description) {
  return new Promise((resolve, reject) => {
    if (description) console.log(`\n🔧 ${description}...`);
    
    conn.exec(command, (err, stream) => {
      if (err) {
        reject(err);
        return;
      }

      let output = '';
      let errorOutput = '';

      stream.on('close', (code, signal) => {
        resolve({ output, errorOutput, code });
      }).on('data', (data) => {
        output += data.toString();
        process.stdout.write(data.toString());
      }).stderr.on('data', (data) => {
        errorOutput += data.toString();
      });
    });
  });
}

async function main() {
  console.log('🔍 Checking Auth Schema Mismatch...\n');

  const conn = new Client();

  try {
    await new Promise((resolve, reject) => {
      conn.on('ready', () => {
        console.log('✅ SSH Connected\n');
        resolve();
      }).on('error', reject).connect(SSH_CONFIG);
    });

    // Step 1: Check auth.users table schema
    console.log('='.repeat(70));
    console.log('STEP 1: Checking auth.users Schema');
    console.log('='.repeat(70));
    
    await executeCommand(conn, `
      docker exec supabase_db_supabase psql -U postgres -d postgres -c "
        SELECT 
          column_name,
          data_type,
          is_nullable
        FROM information_schema.columns
        WHERE table_schema = 'auth' AND table_name = 'users'
        ORDER BY ordinal_position;
      "
    `, 'Checking schema');

    // Step 2: Check auth logs for specific error
    console.log('\n' + '='.repeat(70));
    console.log('STEP 2: Checking Recent Auth Error Details');
    console.log('='.repeat(70));
    
    await executeCommand(conn, `
      echo "Recent auth errors:"
      docker logs supabase_auth_supabase --tail 50 2>&1 | grep -i "error\\|scan\\|column" | tail -10
    `, 'Checking logs');

    // Step 3: Try to recreate user from scratch using GoTrue's expected schema
    console.log('\n' + '='.repeat(70));
    console.log('STEP 3: Recreating User with Full Schema');
    console.log('='.repeat(70));
    
    await executeCommand(conn, `
      docker exec supabase_db_supabase psql -U postgres -d postgres <<'EOSQL'
-- Delete existing user
DELETE FROM auth.users WHERE email = 'omars14@gmail.com';
DELETE FROM public.user_profiles WHERE email = 'omars14@gmail.com';

-- Create user with ALL required fields
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  invited_at,
  confirmation_token,
  confirmation_sent_at,
  recovery_token,
  recovery_sent_at,
  email_change_token_new,
  email_change,
  email_change_sent_at,
  last_sign_in_at,
  raw_app_meta_data,
  raw_user_meta_data,
  is_super_admin,
  created_at,
  updated_at,
  phone,
  phone_confirmed_at,
  phone_change,
  phone_change_token,
  phone_change_sent_at,
  confirmed_at,
  email_change_token_current,
  email_change_confirm_status,
  banned_until,
  reauthentication_token,
  reauthentication_sent_at,
  is_sso_user,
  deleted_at
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  'a144ed1d-abb3-4b7d-8517-d35612c6e1d9',
  'authenticated',
  'authenticated',
  'omars14@gmail.com',
  crypt('Nomar123', gen_salt('bf')),
  NOW(),
  NULL,
  '',
  NULL,
  '',
  NULL,
  '',
  '',
  NULL,
  NOW(),
  '{"provider":"email","providers":["email"]}',
  '{}',
  false,
  NOW(),
  NOW(),
  NULL,
  NULL,
  '',
  '',
  NULL,
  NOW(),
  '',
  0,
  NULL,
  '',
  NULL,
  false,
  NULL
);

-- Recreate profile
INSERT INTO public.user_profiles (id, email, role, created_at, updated_at)
VALUES (
  'a144ed1d-abb3-4b7d-8517-d35612c6e1d9',
  'omars14@gmail.com',
  'admin',
  NOW(),
  NOW()
);

-- Verify
SELECT id, email, confirmation_token, confirmed_at FROM auth.users WHERE email = 'omars14@gmail.com';

EOSQL
    `, 'Recreating user');

    // Step 4: Restart auth and test
    console.log('\n' + '='.repeat(70));
    console.log('STEP 4: Testing Login After Schema Fix');
    console.log('='.repeat(70));
    
    await executeCommand(conn, `
      echo "Restarting auth service..."
      docker restart supabase_auth_supabase
      
      echo "Waiting 15 seconds..."
      sleep 15
      
      echo ""
      echo "Testing login..."
      RESPONSE=\$(curl -s -X POST "https://supabase.healthscribe.pro/auth/v1/token?grant_type=password" \\
        -H "Content-Type: application/json" \\
        -H "apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYW5vbiIsImlzcyI6InN1cGFiYXNlIiwiaWF0IjoxNzU4NTE0MDEwLCJleHAiOjIzODkyMzQwMTB9.aEtU27HNIhkw1qj_4q2tnTyvLnGvWTWvHjJYFnsB3hI" \\
        -d '{"email":"omars14@gmail.com","password":"Nomar123"}')
      
      ACCESS_TOKEN=\$(echo "\$RESPONSE" | jq -r '.access_token' 2>/dev/null)
      
      if [ -n "\$ACCESS_TOKEN" ] && [ "\$ACCESS_TOKEN" != "null" ]; then
        echo "✅ LOGIN SUCCESSFUL!"
        echo "Token: \${ACCESS_TOKEN:0:60}..."
        
        echo ""
        echo "Testing transcriptions API..."
        curl -s -X GET "https://supabase.healthscribe.pro/rest/v1/transcriptions?select=file_name,status&order=created_at.desc&limit=5" \\
          -H "apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYW5vbiIsImlzcyI6InN1cGFiYXNlIiwiaWF0IjoxNzU4NTE0MDEwLCJleHAiOjIzODkyMzQwMTB9.aEtU27HNIhkw1qj_4q2tnTyvLnGvWTWvHjJYFnsB3hI" \\
          -H "Authorization: Bearer \$ACCESS_TOKEN" | jq '.'
      else
        echo "❌ Login failed"
        echo "\$RESPONSE" | jq '.'
      fi
    `, 'Testing after fix');

    conn.end();
    console.log('\n✅ SSH session closed');

    console.log('\n' + '='.repeat(80));
    console.log('📊 SCHEMA CHECK COMPLETE');
    console.log('='.repeat(80));

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  }
}

main();

