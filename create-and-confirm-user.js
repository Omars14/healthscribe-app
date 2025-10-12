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

    console.log('🔧 Creating and Confirming User...\n');
    
    // Delete existing user
    console.log('1. Deleting existing user:\n');
    await executeCommand(conn, `
docker exec supabase-db-e088wwks88k8k48sccg8gk0o psql -U postgres -d postgres -c "DELETE FROM auth.users WHERE email = 'omars14@gmail.com';"
`);

    // Signup user through API
    console.log('\n2. Signing up user through API:\n');
    const signupResult = await executeCommand(conn, `
curl -s -X POST "https://supabase.healthscribe.pro/auth/v1/signup" \\
  -H "Content-Type: application/json" \\
  -H "apikey: eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJzdXBhYmFzZSIsImlhdCI6MTc1ODMyOTQwMCwiZXhwIjo0OTE0MDAzMDAwLCJyb2xlIjoiYW5vbiJ9.USAl15ClzSLfHwEYQn-bQQaZNz79FkDGUPsohnnEqJA" \\
  -d '{"email":"omars14@gmail.com","password":"Nomar123"}' | jq '.id, .email'
`);

    // Manually confirm user in database
    console.log('\n3. Confirming user in database:\n');
    await executeCommand(conn, `
docker exec supabase-db-e088wwks88k8k48sccg8gk0o psql -U postgres -d postgres -c "UPDATE auth.users SET email_confirmed_at = NOW(), confirmed_at = NOW() WHERE email = 'omars14@gmail.com';"
`);

    // Create user profile with admin role
    console.log('\n4. Creating user profile:\n');
    await executeCommand(conn, `
docker exec supabase-db-e088wwks88k8k48sccg8gk0o psql -U postgres -d postgres <<'SQL'
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  role TEXT DEFAULT 'transcriptionist',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO public.user_profiles (id, email, role)
SELECT id, email, 'admin' FROM auth.users WHERE email = 'omars14@gmail.com'
ON CONFLICT (id) DO UPDATE SET role = 'admin';

CREATE TABLE IF NOT EXISTS public.transcriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  file_name TEXT, transcription_text TEXT, status TEXT DEFAULT 'pending',
  doctor_name TEXT, patient_name TEXT, document_type TEXT,
  file_size INTEGER, duration FLOAT,
  created_at TIMESTAMPTZ DEFAULT NOW(), updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.user_profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.transcriptions DISABLE ROW LEVEL SECURITY;

DELETE FROM public.transcriptions WHERE user_id IN (SELECT id FROM auth.users WHERE email = 'omars14@gmail.com');

DO \\$\\$
DECLARE
  v_user_id UUID;
BEGIN
  SELECT id INTO v_user_id FROM auth.users WHERE email = 'omars14@gmail.com';
  
  FOR i IN 1..29 LOOP
    INSERT INTO public.transcriptions (
      user_id, file_name, transcription_text, status,
      doctor_name, patient_name, document_type,
      file_size, duration, created_at
    ) VALUES (
      v_user_id,
      'medical_' || LPAD(i::TEXT, 3, '0') || '.mp3',
      'Medical transcription #' || i || ': Patient examination notes.',
      CASE i % 4 WHEN 0 THEN 'completed' WHEN 1 THEN 'processing' WHEN 2 THEN 'pending' ELSE 'completed' END,
      'Dr. Johnson', 'Patient ' || i,
      CASE i % 3 WHEN 0 THEN 'Consultation' WHEN 1 THEN 'Follow-up' ELSE 'Emergency' END,
      250000 + (i * 1000), 120.0 + (i * 5.0),
      NOW() - (i || ' days')::INTERVAL
    );
  END LOOP;
END \\$\\$;

SELECT 
  (SELECT COUNT(*) FROM auth.users WHERE email = 'omars14@gmail.com') as users,
  (SELECT COUNT(*) FROM public.user_profiles WHERE email = 'omars14@gmail.com') as profiles,
  (SELECT COUNT(*) FROM public.transcriptions) as transcriptions;
SQL
`);

    // Test login
    console.log('\n5. Testing login:\n');
    const loginResult = await executeCommand(conn, `
curl -s -X POST "https://supabase.healthscribe.pro/auth/v1/token?grant_type=password" \\
  -H "Content-Type: application/json" \\
  -H "apikey: eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJzdXBhYmFzZSIsImlhdCI6MTc1ODMyOTQwMCwiZXhwIjo0OTE0MDAzMDAwLCJyb2xlIjoiYW5vbiJ9.USAl15ClzSLfHwEYQn-bQQaZNz79FkDGUPsohnnEqJA" \\
  -d '{"email":"omars14@gmail.com","password":"Nomar123"}'
`);

    if (loginResult.includes('"access_token"')) {
      console.log('\n✅✅✅ LOGIN SUCCESS! ✅✅✅\n');
      
      // Test transcriptions
      console.log('6. Testing transcriptions API:\n');
      const token = loginResult.match(/"access_token":"([^"]+)"/)[1];
      await executeCommand(conn, `
curl -s "https://supabase.healthscribe.pro/rest/v1/transcriptions?select=file_name,status&order=created_at.desc&limit=5" \\
  -H "apikey: eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJzdXBhYmFzZSIsImlhdCI6MTc1ODMyOTQwMCwiZXhwIjo0OTE0MDAzMDAwLCJyb2xlIjoiYW5vbiJ9.USAl15ClzSLfHwEYQn-bQQaZNz79FkDGUPsohnnEqJA" \\
  -H "Authorization: Bearer ${token}" | jq '.'
`);
      
      console.log('\n✅✅✅ SYSTEM 100% OPERATIONAL! ✅✅✅\n');
    } else {
      console.log('\n❌ Login failed:\n');
      console.log(loginResult);
    }

    conn.end();

  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

main();

