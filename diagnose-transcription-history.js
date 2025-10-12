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

    console.log('🔍 DIAGNOSING TRANSCRIPTION HISTORY ISSUE\n');
    console.log('=' .repeat(80) + '\n');

    // Step 1: Check database for transcriptions
    console.log('1️⃣ Checking transcriptions in database...\n');
    await executeCommand(conn, `
docker exec supabase-db-e088wwks88k8k48sccg8gk0o psql -U postgres -d postgres -c "
SELECT COUNT(*) as total_transcriptions FROM public.transcriptions;
SELECT user_id, COUNT(*) as count FROM public.transcriptions GROUP BY user_id;
SELECT id, user_id, status, created_at FROM public.transcriptions ORDER BY created_at DESC LIMIT 5;
"
`);

    // Step 2: Check user_id
    console.log('\n2️⃣ Checking user ID...\n');
    await executeCommand(conn, `
docker exec supabase-db-e088wwks88k8k48sccg8gk0o psql -U postgres -d postgres -c "
SELECT id, email FROM auth.users WHERE email = 'omars14@gmail.com';
"
`);

    // Step 3: Check user_profiles table
    console.log('\n3️⃣ Checking user_profiles table...\n');
    await executeCommand(conn, `
docker exec supabase-db-e088wwks88k8k48sccg8gk0o psql -U postgres -d postgres -c "
SELECT id, email, role, is_active FROM public.user_profiles;
"
`);

    // Step 4: Test REST API directly (internal)
    console.log('\n4️⃣ Testing REST API internally...\n');
    const restIp = (await executeCommand(conn, `docker inspect supabase-rest-e088wwks88k8k48sccg8gk0o 2>/dev/null | grep '"IPAddress"' | grep -v '""' | head -1 | awk -F'"' '{print $4}'`)).trim();
    
    await executeCommand(conn, `
echo "Testing transcriptions endpoint:"
curl -s "http://${restIp}:3000/transcriptions?select=*&limit=5" \\
  -H "apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYW5vbiIsImlzcyI6InN1cGFiYXNlIiwiaWF0IjoxNzU4NTE0MDEwLCJleHAiOjIzODkyMzQwMTB9.aEtU27HNIhkw1qj_4q2tnTyvLnGvWTWvHjJYFnsB3hI" \\
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoic2VydmljZV9yb2xlIiwiaXNzIjoic3VwYWJhc2UiLCJpYXQiOjE3NTg1MTQwMTAsImV4cCI6MjM4OTIzNDAxMH0.qjBCdR_u9CWR9Fhx1VwoZdBdtetp_h9bE9qEieyQM_4" \\
  2>&1 | head -20
`);

    // Step 5: Test via Traefik
    console.log('\n5️⃣ Testing via Traefik (external)...\n');
    await executeCommand(conn, `
curl -s "https://supabase.healthscribe.pro/rest/v1/transcriptions?select=*&limit=5" \\
  -H "apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYW5vbiIsImlzcyI6InN1cGFiYXNlIiwiaWF0IjoxNzU4NTE0MDEwLCJleHAiOjIzODkyMzQwMTB9.aEtU27HNIhkw1qj_4q2tnTyvLnGvWTWvHjJYFnsB3hI" \\
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoic2VydmljZV9yb2xlIiwiaXNzIjoic3VwYWJhc2UiLCJpYXQiOjE3NTg1MTQwMTAsImV4cCI6MjM4OTIzNDAxMH0.qjBCdR_u9CWR9Fhx1VwoZdBdtetp_h9bE9qEieyQM_4" \\
  2>&1 | head -20
`);

    // Step 6: Check application API logs
    console.log('\n6️⃣ Checking application logs for transcription requests...\n');
    await executeCommand(conn, `
docker logs tkwoos4soccckws84088wc04-184252873467 2>&1 | grep -i "transcription" | tail -10
`);

    // Step 7: Check PostgREST JWT configuration
    console.log('\n7️⃣ Checking PostgREST JWT configuration...\n');
    await executeCommand(conn, `
docker exec supabase-rest-e088wwks88k8k48sccg8gk0o env | grep -E "PGRST_JWT_SECRET|JWT_SECRET"
`);

    console.log('\n' + '='.repeat(80));
    console.log('📊 DIAGNOSIS COMPLETE');
    console.log('='.repeat(80) + '\n');

    conn.end();

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

main();

