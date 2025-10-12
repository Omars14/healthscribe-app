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

    console.log('🔧 FIXING DATABASE ROLES\n');
    console.log('=' .repeat(80) + '\n');

    // Step 1: Check database roles
    console.log('1️⃣ Checking database roles...\n');
    await executeCommand(conn, `
docker exec supabase-db-e088wwks88k8k48sccg8gk0o psql -U postgres -d postgres -c "
SELECT rolname FROM pg_roles WHERE rolname IN ('anon', 'authenticated', 'service_role');
"
`);

    // Step 2: Create missing roles
    console.log('\n2️⃣ Creating/fixing roles...\n');
    await executeCommand(conn, `
docker exec supabase-db-e088wwks88k8k48sccg8gk0o psql -U postgres -d postgres << 'SQL'
-- Create roles if they don't exist
DO \\$\\$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'anon') THEN
    CREATE ROLE anon NOLOGIN NOINHERIT;
  END IF;
  
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'authenticated') THEN
    CREATE ROLE authenticated NOLOGIN NOINHERIT;
  END IF;
  
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'service_role') THEN
    CREATE ROLE service_role NOLOGIN NOINHERIT BYPASSRLS;
  END IF;
END
\\$\\$;

-- Grant permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated, service_role;

-- Grant permissions on specific tables
GRANT ALL ON public.transcriptions TO anon, authenticated, service_role;
GRANT ALL ON public.user_profiles TO anon, authenticated, service_role;

-- Show created roles
SELECT rolname, rolsuper, rolinherit, rolcreaterole, rolcreatedb, rolcanlogin, rolbypassrls 
FROM pg_roles 
WHERE rolname IN ('anon', 'authenticated', 'service_role');
SQL
`);

    // Step 3: Test database connection from PostgREST container
    console.log('\n3️⃣ Testing database connection from PostgREST...\n');
    await executeCommand(conn, `
docker exec supabase-rest-e088wwks88k8k48sccg8gk0o sh -c '
  apk add --no-cache postgresql-client 2>/dev/null || true
  psql "postgresql://postgres:postgres@10.0.3.3:5432/postgres" -c "SELECT 1;" 2>&1
' || echo "Could not test from PostgREST container"
`);

    // Step 4: Restart PostgREST
    console.log('\n4️⃣ Restarting PostgREST...\n');
    await executeCommand(conn, `
docker restart supabase-rest-e088wwks88k8k48sccg8gk0o
sleep 15
echo "✅ Restarted"
`);

    // Step 5: Check logs
    console.log('\n5️⃣ Checking PostgREST logs...\n');
    await executeCommand(conn, `
docker logs supabase-rest-e088wwks88k8k48sccg8gk0o 2>&1 | tail -30
`);

    // Step 6: Test REST API
    console.log('\n6️⃣ Testing REST API...\n');
    await executeCommand(conn, `
curl -s "http://10.0.1.9:3000/transcriptions?select=id,status&limit=3" \\
  -H "apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYW5vbiIsImlzcyI6InN1cGFiYXNlIiwiaWF0IjoxNzYwMjk5MjYwLCJleHAiOjIwNzU2NTkyNjB9.fuBekR-do0ST4CxThWM5UcjFacFpZC3AMqxNSSp3DMM" \\
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoic2VydmljZV9yb2xlIiwiaXNzIjoic3VwYWJhc2UiLCJpYXQiOjE3NjAyOTkyNjAsImV4cCI6MjA3NTY1OTI2MH0.BLOKCUrBXkmjGPsg39H4aGInVjgBqZPaRsMH1dpksDQ"
`);

    // Step 7: Test via Traefik
    console.log('\n\n7️⃣ Testing via Traefik...\n');
    await executeCommand(conn, `
curl -s "https://supabase.healthscribe.pro/rest/v1/transcriptions?select=id,status&limit=3" \\
  -H "apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYW5vbiIsImlzcyI6InN1cGFiYXNlIiwiaWF0IjoxNzYwMjk5MjYwLCJleHAiOjIwNzU2NTkyNjB9.fuBekR-do0ST4CxThWM5UcjFacFpZC3AMqxNSSp3DMM" \\
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoic2VydmljZV9yb2xlIiwiaXNzIjoic3VwYWJhc2UiLCJpYXQiOjE3NjAyOTkyNjAsImV4cCI6MjA3NTY1OTI2MH0.BLOKCUrBXkmjGPsg39H4aGInVjgBqZPaRsMH1dpksDQ"
`);

    console.log('\n\n' + '='.repeat(80));
    console.log('✅ DATABASE ROLES FIXED');
    console.log('='.repeat(80) + '\n');

    conn.end();

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

main();

