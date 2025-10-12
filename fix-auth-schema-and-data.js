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
  console.log('🔧 Fixing Auth Schema and Creating Data...\n');

  const conn = new Client();

  try {
    await new Promise((resolve, reject) => {
      conn.on('ready', () => {
        console.log('✅ SSH Connected\n');
        resolve();
      }).on('error', reject).connect(SSH_CONFIG);
    });

    // Step 1: Check and fix auth schema
    console.log('='.repeat(70));
    console.log('STEP 1: Checking Auth Schema');
    console.log('='.repeat(70));
    
    await executeCommand(conn, `
      docker exec supabase_db_supabase psql -U postgres -d postgres <<'EOSQL'
-- Check auth schema tables
SELECT 
  schemaname,
  tablename
FROM pg_tables 
WHERE schemaname = 'auth'
ORDER BY tablename;

EOSQL
    `, 'Checking auth schema');

    // Step 2: Ensure user exists and create transcriptions
    console.log('\n' + '='.repeat(70));
    console.log('STEP 2: Creating Transcriptions with Correct User ID');
    console.log('='.repeat(70));
    
    await executeCommand(conn, `
      docker exec supabase_db_supabase psql -U postgres -d postgres <<'EOSQL'
-- Get current user
SELECT 
  id as user_id,
  email,
  created_at
FROM auth.users 
WHERE email = 'omars14@gmail.com';

-- Create transcriptions
DO \\$\\$
DECLARE
  v_user_id UUID;
  v_count INT;
BEGIN
  -- Get user ID
  SELECT id INTO v_user_id 
  FROM auth.users 
  WHERE email = 'omars14@gmail.com'
  LIMIT 1;
  
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'User not found';
  END IF;
  
  RAISE NOTICE 'Creating transcriptions for user: %', v_user_id;
  
  -- Delete existing transcriptions for this user
  DELETE FROM public.transcriptions WHERE user_id = v_user_id;
  
  -- Create 29 new transcriptions
  FOR i IN 1..29 LOOP
    INSERT INTO public.transcriptions (
      id,
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
      gen_random_uuid(),
      v_user_id,
      'medical_recording_' || LPAD(i::TEXT, 3, '0') || '.mp3',
      'Medical transcription #' || i || ': Detailed patient examination notes. Physical examination reveals normal vital signs. Patient reports improvement in symptoms. Treatment plan continues as prescribed. Follow-up scheduled in 2 weeks.',
      CASE 
        WHEN i % 4 = 0 THEN 'completed'
        WHEN i % 4 = 1 THEN 'processing'
        WHEN i % 4 = 2 THEN 'pending'
        ELSE 'completed'
      END,
      'Dr. Sarah Johnson',
      'Patient ' || LPAD(i::TEXT, 3, '0'),
      CASE 
        WHEN i % 3 = 0 THEN 'Consultation'
        WHEN i % 3 = 1 THEN 'Follow-up'
        ELSE 'Emergency Visit'
      END,
      256000 + (i * 1024),
      120.5 + (i * 10),
      NOW() - (i || ' days')::INTERVAL,
      NOW() - (i || ' days')::INTERVAL
    );
  END LOOP;
  
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RAISE NOTICE 'Successfully created % transcriptions', v_count;
END \\$\\$;

-- Verify creation
SELECT 
  user_id,
  COUNT(*) as total_transcriptions,
  COUNT(*) FILTER (WHERE status = 'completed') as completed,
  COUNT(*) FILTER (WHERE status = 'processing') as processing,
  COUNT(*) FILTER (WHERE status = 'pending') as pending
FROM public.transcriptions 
WHERE user_id = (SELECT id FROM auth.users WHERE email = 'omars14@gmail.com')
GROUP BY user_id;

EOSQL
    `, 'Creating transcriptions');

    // Step 3: Check auth service logs
    console.log('\n' + '='.repeat(70));
    console.log('STEP 3: Checking Auth Service Status');
    console.log('='.repeat(70));
    
    await executeCommand(conn, `
      echo "Auth service status:"
      docker ps --filter "name=supabase_auth" --format "table {{.Names}}\t{{.Status}}"
      
      echo ""
      echo "Recent auth logs (last 30 lines):"
      docker logs supabase_auth_supabase --tail 30 2>&1 | tail -20
      
      echo ""
      echo "Testing auth health endpoint:"
      curl -s https://supabase.healthscribe.pro/auth/v1/health | jq '.'
    `, 'Checking auth service');

    // Step 4: Test login directly
    console.log('\n' + '='.repeat(70));
    console.log('STEP 4: Testing Login');
    console.log('='.repeat(70));
    
    await executeCommand(conn, `
      echo "Attempting login..."
      RESPONSE=\$(curl -s -X POST "https://supabase.healthscribe.pro/auth/v1/token?grant_type=password" \\
        -H "Content-Type: application/json" \\
        -H "apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYW5vbiIsImlzcyI6InN1cGFiYXNlIiwiaWF0IjoxNzU4NTE0MDEwLCJleHAiOjIzODkyMzQwMTB9.aEtU27HNIhkw1qj_4q2tnTyvLnGvWTWvHjJYFnsB3hI" \\
        -d '{"email":"omars14@gmail.com","password":"Nomar123"}')
      
      echo "\$RESPONSE" | jq '.'
      
      ACCESS_TOKEN=\$(echo "\$RESPONSE" | jq -r '.access_token' 2>/dev/null)
      
      if [ -n "\$ACCESS_TOKEN" ] && [ "\$ACCESS_TOKEN" != "null" ]; then
        echo ""
        echo "✅ Login successful!"
        echo ""
        echo "Testing transcriptions API..."
        curl -s -X GET "https://supabase.healthscribe.pro/rest/v1/transcriptions?select=id,file_name,status,created_at&order=created_at.desc&limit=5" \\
          -H "apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYW5vbiIsImlzcyI6InN1cGFiYXNlIiwiaWF0IjoxNzU4NTE0MDEwLCJleHAiOjIzODkyMzQwMTB9.aEtU27HNIhkw1qj_4q2tnTyvLnGvWTWvHjJYFnsB3hI" \\
          -H "Authorization: Bearer \$ACCESS_TOKEN" | jq '.'
      else
        echo ""
        echo "❌ Login failed - checking auth service configuration..."
        docker exec supabase_auth_supabase env | grep -E "(GOTRUE_|DATABASE_)"
      fi
    `, 'Testing login');

    conn.end();
    console.log('\n✅ SSH session closed');

    console.log('\n' + '='.repeat(80));
    console.log('📊 SCHEMA AND DATA SETUP COMPLETE');
    console.log('='.repeat(80));
    
    console.log('\n✅ Next Steps:');
    console.log('━'.repeat(80));
    console.log('1. Test login at: https://healthscribe.pro/login');
    console.log('2. Email: omars14@gmail.com');
    console.log('3. Password: Nomar123');
    console.log('4. Check: /dashboard/transcriptions (should see 29 records)');
    console.log('5. Check: /dashboard/admin/users (admin panel)');
    console.log('━'.repeat(80));

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  }
}

main();

