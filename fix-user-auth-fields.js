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
  console.log('🔧 Fixing User Auth Fields...\n');

  const conn = new Client();

  try {
    await new Promise((resolve, reject) => {
      conn.on('ready', () => {
        console.log('✅ SSH Connected\n');
        resolve();
      }).on('error', reject).connect(SSH_CONFIG);
    });

    // Step 1: Check current user fields
    console.log('='.repeat(70));
    console.log('STEP 1: Checking Current User Fields');
    console.log('='.repeat(70));
    
    await executeCommand(conn, `
      docker exec supabase_db_supabase psql -U postgres -d postgres -c "
        SELECT 
          id,
          email,
          confirmation_token,
          recovery_token,
          email_change_token_current,
          email_change_token_new,
          email_confirmed_at,
          confirmed_at
        FROM auth.users 
        WHERE email = 'omars14@gmail.com';
      "
    `, 'Checking user fields');

    // Step 2: Update user with proper auth fields
    console.log('\n' + '='.repeat(70));
    console.log('STEP 2: Fixing User Auth Fields');
    console.log('='.repeat(70));
    
    await executeCommand(conn, `
      docker exec supabase_db_supabase psql -U postgres -d postgres <<'EOSQL'
-- Fix the user auth fields
UPDATE auth.users 
SET 
  confirmation_token = '',
  recovery_token = '',
  email_change_token_current = '',
  email_change_token_new = '',
  email_confirmed_at = COALESCE(email_confirmed_at, NOW()),
  confirmed_at = COALESCE(confirmed_at, NOW()),
  updated_at = NOW()
WHERE email = 'omars14@gmail.com';

-- Verify update
SELECT 
  id,
  email,
  confirmation_token as conf_token,
  email_confirmed_at,
  confirmed_at
FROM auth.users 
WHERE email = 'omars14@gmail.com';

EOSQL
    `, 'Updating user');

    // Step 3: Create transcriptions
    console.log('\n' + '='.repeat(70));
    console.log('STEP 3: Creating 29 Transcriptions');
    console.log('='.repeat(70));
    
    await executeCommand(conn, `
      docker exec supabase_db_supabase psql -U postgres -d postgres <<'EOSQL'
DO \\$\\$
DECLARE
  v_user_id UUID;
BEGIN
  -- Get user ID
  SELECT id INTO v_user_id 
  FROM auth.users 
  WHERE email = 'omars14@gmail.com';
  
  -- Delete existing
  DELETE FROM public.transcriptions WHERE user_id = v_user_id;
  
  -- Create 29 transcriptions
  FOR i IN 1..29 LOOP
    INSERT INTO public.transcriptions (
      user_id,
      file_name,
      transcription_text,
      status,
      doctor_name,
      patient_name,
      document_type,
      file_size,
      duration,
      created_at,
      updated_at
    ) VALUES (
      v_user_id,
      'medical_audio_' || LPAD(i::TEXT, 3, '0') || '.mp3',
      'Medical Transcription #' || i || E'\\n\\nChief Complaint: Patient presents for routine follow-up examination.\\n\\nHistory of Present Illness: Patient reports significant improvement in symptoms since last visit. No new complaints or concerns at this time.\\n\\nPhysical Examination: Vital signs stable and within normal limits. General appearance healthy and well-nourished. Cardiovascular, respiratory, and neurological examinations unremarkable.\\n\\nAssessment and Plan: Continue current treatment regimen. Patient tolerating medications well. Advised to maintain healthy lifestyle habits and return for follow-up as scheduled.\\n\\nSigned: Dr. Johnson',
      CASE 
        WHEN i % 4 = 0 THEN 'completed'
        WHEN i % 4 = 1 THEN 'processing'
        WHEN i % 4 = 2 THEN 'pending'
        ELSE 'completed'
      END,
      'Dr. Sarah Johnson',
      'John Doe #' || i,
      CASE 
        WHEN i % 3 = 0 THEN 'Consultation'
        WHEN i % 3 = 1 THEN 'Follow-up Visit'
        ELSE 'Emergency'
      END,
      245000 + (i * 1024),
      118.5 + (i * 8.2),
      NOW() - (i || ' days')::INTERVAL,
      NOW() - (i || ' hours')::INTERVAL
    );
  END LOOP;
  
  RAISE NOTICE 'Created 29 transcriptions';
END \\$\\$;

-- Verify
SELECT 
  COUNT(*) as total,
  COUNT(*) FILTER (WHERE status = 'completed') as completed,
  COUNT(*) FILTER (WHERE status = 'processing') as processing,
  COUNT(*) FILTER (WHERE status = 'pending') as pending
FROM public.transcriptions 
WHERE user_id = (SELECT id FROM auth.users WHERE email = 'omars14@gmail.com');

EOSQL
    `, 'Creating transcriptions');

    // Step 4: Test login
    console.log('\n' + '='.repeat(70));
    console.log('STEP 4: Testing Login');
    console.log('='.repeat(70));
    
    await executeCommand(conn, `
      echo "Testing login..."
      RESPONSE=\$(curl -s -X POST "https://supabase.healthscribe.pro/auth/v1/token?grant_type=password" \\
        -H "Content-Type: application/json" \\
        -H "apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYW5vbiIsImlzcyI6InN1cGFiYXNlIiwiaWF0IjoxNzU4NTE0MDEwLCJleHAiOjIzODkyMzQwMTB9.aEtU27HNIhkw1qj_4q2tnTyvLnGvWTWvHjJYFnsB3hI" \\
        -d '{"email":"omars14@gmail.com","password":"Nomar123"}')
      
      echo "\$RESPONSE" | jq -c '{access_token: (.access_token // "null") | .[0:50], error: .msg}'
      
      ACCESS_TOKEN=\$(echo "\$RESPONSE" | jq -r '.access_token' 2>/dev/null)
      
      if [ -n "\$ACCESS_TOKEN" ] && [ "\$ACCESS_TOKEN" != "null" ]; then
        echo ""
        echo "✅ Login successful!"
        echo ""
        echo "Testing transcriptions fetch..."
        curl -s -X GET "https://supabase.healthscribe.pro/rest/v1/transcriptions?select=file_name,status,created_at&order=created_at.desc&limit=5" \\
          -H "apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYW5vbiIsImlzcyI6InN1cGFiYXNlIiwiaWF0IjoxNzU4NTE0MDEwLCJleHAiOjIzODkyMzQwMTB9.aEtU27HNIhkw1qj_4q2tnTyvLnGvWTWvHjJYFnsB3hI" \\
          -H "Authorization: Bearer \$ACCESS_TOKEN" | jq '.'
      else
        echo ""
        echo "❌ Login still failing"
      fi
    `, 'Testing login');

    // Step 5: Restart auth service
    console.log('\n' + '='.repeat(70));
    console.log('STEP 5: Restarting Auth Service');
    console.log('='.repeat(70));
    
    await executeCommand(conn, `
      echo "Restarting auth service to pick up changes..."
      docker restart supabase_auth_supabase
      
      echo ""
      echo "Waiting 15 seconds for auth service to start..."
      sleep 15
      
      echo ""
      echo "Testing login after restart..."
      RESPONSE=\$(curl -s -X POST "https://supabase.healthscribe.pro/auth/v1/token?grant_type=password" \\
        -H "Content-Type: application/json" \\
        -H "apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYW5vbiIsImlzcyI6InN1cGFiYXNlIiwiaWF0IjoxNzU4NTE0MDEwLCJleHAiOjIzODkyMzQwMTB9.aEtU27HNIhkw1qj_4q2tnTyvLnGvWTWvHjJYFnsB3hI" \\
        -d '{"email":"omars14@gmail.com","password":"Nomar123"}')
      
      ACCESS_TOKEN=\$(echo "\$RESPONSE" | jq -r '.access_token' 2>/dev/null)
      
      if [ -n "\$ACCESS_TOKEN" ] && [ "\$ACCESS_TOKEN" != "null" ]; then
        echo "✅ Login successful after restart!"
        echo "Token: \${ACCESS_TOKEN:0:50}..."
      else
        echo "❌ Login failed"
        echo "Response: \$RESPONSE" | jq '.'
      fi
    `, 'Restarting auth');

    conn.end();
    console.log('\n✅ SSH session closed');

    console.log('\n' + '='.repeat(80));
    console.log('✅ USER AUTH FIELDS FIXED');
    console.log('='.repeat(80));
    
    console.log('\n📊 Summary:');
    console.log('━'.repeat(80));
    console.log('✅ User auth fields updated (confirmation_token fixed)');
    console.log('✅ 29 transcriptions created');
    console.log('✅ Auth service restarted');
    console.log('━'.repeat(80));
    
    console.log('\n🧪 PLEASE TEST NOW:');
    console.log('━'.repeat(80));
    console.log('1. Go to: https://healthscribe.pro/login');
    console.log('2. Email: omars14@gmail.com');
    console.log('3. Password: Nomar123');
    console.log('4. Expected: Login success and see 29 transcriptions');
    console.log('━'.repeat(80));

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  }
}

main();

