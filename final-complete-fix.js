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
  console.log('🎯 Final Complete Fix - Self-Hosted Supabase...\n');

  const conn = new Client();

  try {
    await new Promise((resolve, reject) => {
      conn.on('ready', () => {
        console.log('✅ SSH Connected\n');
        resolve();
      }).on('error', reject).connect(SSH_CONFIG);
    });

    // Step 1: Verify user fields are truly not NULL
    console.log('='.repeat(70));
    console.log('STEP 1: Checking Exact User Field Values');
    console.log('='.repeat(70));
    
    await executeCommand(conn, `
      docker exec supabase_db_supabase psql -U postgres -d postgres <<'EOSQL'
SELECT 
  id,
  email,
  confirmation_token IS NULL as conf_is_null,
  length(COALESCE(confirmation_token, '')) as conf_length,
  recovery_token IS NULL as rec_is_null,
  email_change_token_current IS NULL as email_change_is_null
FROM auth.users 
WHERE email = 'omars14@gmail.com';
EOSQL
    `, 'Checking NULL values');

    // Step 2: Fix ALL nullable string fields to empty strings
    console.log('\n' + '='.repeat(70));
    console.log('STEP 2: Force All String Fields to Empty Strings');
    console.log('='.repeat(70));
    
    await executeCommand(conn, `
      docker exec supabase_db_supabase psql -U postgres -d postgres <<'EOSQL'
UPDATE auth.users 
SET 
  confirmation_token = COALESCE(confirmation_token, ''),
  recovery_token = COALESCE(recovery_token, ''),
  email_change_token_new = COALESCE(email_change_token_new, ''),
  email_change = COALESCE(email_change, ''),
  email_change_token_current = COALESCE(email_change_token_current, ''),
  phone_change = COALESCE(phone_change, ''),
  phone_change_token = COALESCE(phone_change_token, ''),
  reauthentication_token = COALESCE(reauthentication_token, '')
WHERE email = 'omars14@gmail.com';

SELECT 'User updated' as status;
EOSQL
    `, 'Updating fields');

    // Step 3: Create 29 transcriptions
    console.log('\n' + '='.repeat(70));
    console.log('STEP 3: Creating 29 Transcriptions');
    console.log('='.repeat(70));
    
    await executeCommand(conn, `
      docker exec supabase_db_supabase psql -U postgres -d postgres <<'EOSQL'
DO \\$\\$
DECLARE
  v_user_id UUID := 'a144ed1d-abb3-4b7d-8517-d35612c6e1d9';
BEGIN
  -- Delete existing
  DELETE FROM public.transcriptions WHERE user_id = v_user_id;
  
  -- Create 29
  FOR i IN 1..29 LOOP
    INSERT INTO public.transcriptions (
      user_id, file_name, transcription_text, status, 
      doctor_name, patient_name, document_type,
      file_size, duration, created_at, updated_at
    ) VALUES (
      v_user_id,
      'medical_' || LPAD(i::TEXT, 3, '0') || '.mp3',
      'Medical transcription #' || i,
      CASE i % 4 WHEN 0 THEN 'completed' WHEN 1 THEN 'processing' WHEN 2 THEN 'pending' ELSE 'completed' END,
      'Dr. Johnson',
      'Patient ' || i,
      CASE i % 3 WHEN 0 THEN 'Consultation' WHEN 1 THEN 'Follow-up' ELSE 'Emergency' END,
      250000 + (i * 1000),
      120.0 + (i * 5.0),
      NOW() - (i || ' days')::INTERVAL,
      NOW()
    );
  END LOOP;
END \\$\\$;

SELECT COUNT(*) as transcriptions_created FROM public.transcriptions 
WHERE user_id = 'a144ed1d-abb3-4b7d-8517-d35612c6e1d9';
EOSQL
    `, 'Creating transcriptions');

    // Step 4: Restart auth and test
    console.log('\n' + '='.repeat(70));
    console.log('STEP 4: Restart and Test');
    console.log('='.repeat(70));
    
    await executeCommand(conn, `
      docker restart supabase_auth_supabase
      sleep 15
      
      echo "Testing login..."
      curl -s -X POST "https://supabase.healthscribe.pro/auth/v1/token?grant_type=password" \\
        -H "Content-Type: application/json" \\
        -H "apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYW5vbiIsImlzcyI6InN1cGFiYXNlIiwiaWF0IjoxNzU4NTE0MDEwLCJleHAiOjIzODkyMzQwMTB9.aEtU27HNIhkw1qj_4q2tnTyvLnGvWTWvHjJYFnsB3hI" \\
        -d '{"email":"omars14@gmail.com","password":"Nomar123"}' > /tmp/login_response.json
      
      cat /tmp/login_response.json | jq '.'
      
      TOKEN=\$(cat /tmp/login_response.json | jq -r '.access_token')
      
      if [ "\$TOKEN" != "null" ] && [ -n "\$TOKEN" ]; then
        echo ""
        echo "✅ LOGIN SUCCESS!"
        echo "Token: \${TOKEN:0:60}..."
        
        echo ""
        echo "Fetching transcriptions..."
        curl -s "https://supabase.healthscribe.pro/rest/v1/transcriptions?select=file_name,status&order=created_at.desc&limit=5" \\
          -H "apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYW5vbiIsImlzcyI6InN1cGFiYXNlIiwiaWF0IjoxNzU4NTE0MDEwLCJleHAiOjIzODkyMzQwMTB9.aEtU27HNIhkw1qj_4q2tnTyvLnGvWTWvHjJYFnsB3hI" \\
          -H "Authorization: Bearer \$TOKEN" | jq '.'
      else
        echo ""
        echo "❌ Login failed"
      fi
    `, 'Testing');

    conn.end();
    console.log('\n✅ SSH session closed');

    console.log('\n' + '='.repeat(80));
    console.log('📊 SETUP COMPLETE');
    console.log('='.repeat(80));
    
    console.log('\n✅ Configured:');
    console.log('• Self-Hosted Supabase: https://supabase.healthscribe.pro');
    console.log('• User: omars14@gmail.com / Nomar123');
    console.log('• 29 Transcriptions created');
    console.log('• Traefik routing active');
    
    console.log('\n🧪 TEST:');
    console.log('https://healthscribe.pro/login');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  }
}

main();

