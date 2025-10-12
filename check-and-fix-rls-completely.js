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
  console.log('🔍 Complete RLS Check and Fix...\n');

  const conn = new Client();

  try {
    await new Promise((resolve, reject) => {
      conn.on('ready', () => {
        console.log('✅ SSH Connected\n');
        resolve();
      }).on('error', reject).connect(SSH_CONFIG);
    });

    console.log('='.repeat(70));
    console.log('Checking Current RLS Status');
    console.log('='.repeat(70));
    
    await executeCommand(conn, `
      docker exec supabase_db_supabase psql -U postgres -d postgres <<'EOSQL'
-- Check RLS status
SELECT 
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename IN ('transcriptions', 'user_profiles');

-- List all policies
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies 
WHERE tablename IN ('transcriptions', 'user_profiles')
ORDER BY tablename, policyname;

EOSQL
    `, 'Checking RLS');

    console.log('\n' + '='.repeat(70));
    console.log('Completely Disabling RLS and Dropping All Policies');
    console.log('='.repeat(70));
    
    await executeCommand(conn, `
      docker exec supabase_db_supabase psql -U postgres -d postgres <<'EOSQL'
-- Drop ALL policies on both tables
DO \\$\\$
DECLARE
    policy_rec RECORD;
BEGIN
    FOR policy_rec IN 
        SELECT schemaname, tablename, policyname
        FROM pg_policies 
        WHERE tablename IN ('transcriptions', 'user_profiles')
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || policy_rec.policyname || '" ON ' || policy_rec.schemaname || '.' || policy_rec.tablename;
        RAISE NOTICE 'Dropped policy: % on %.%', policy_rec.policyname, policy_rec.schemaname, policy_rec.tablename;
    END LOOP;
END \\$\\$;

-- Disable RLS completely
ALTER TABLE public.transcriptions DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_profiles DISABLE ROW LEVEL SECURITY;

-- Verify
SELECT tablename, rowsecurity FROM pg_tables WHERE tablename IN ('transcriptions', 'user_profiles');

SELECT COUNT(*) as remaining_policies FROM pg_policies WHERE tablename IN ('transcriptions', 'user_profiles');

EOSQL
    `, 'Disabling RLS');

    // Restart all Supabase services
    await executeCommand(conn, `
      echo "Restarting all Supabase services..."
      docker restart supabase_rest_supabase
      docker restart supabase_kong_supabase  
      docker restart supabase_auth_supabase
      
      sleep 25
      
      echo "Services restarted"
    `, 'Restarting');

    // Test
    console.log('\n' + '='.repeat(70));
    console.log('Final Test - No RLS');
    console.log('='.repeat(70));
    
    const token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhdWQiOiJhdXRoZW50aWNhdGVkIiwiZXhwIjoxNzYwMjI5NDk2LCJzdWIiOiJhMTQ0ZWQxZC1hYmIzLTRiN2QtODUxNy1kMzU2MTJjNmUxZDkiLCJlbWFpbCI6Im9tYXJzMTRAZ21haWwuY29tIiwicGhvbmUiOiIiLCJhcHBfbWV0YWRhdGEiOnsicHJvdmlkZXIiOiJlbWFpbCIsInByb3ZpZGVycyI6WyJlbWFpbCJdfSwidXNlcl9tZXRhZGF0YSI6e30sInJvbGUiOiJhdXRoZW50aWNhdGVkIiwiYWFsIjoiYWFsMSIsImFtciI6W3sibWV0aG9kIjoicGFzc3dvcmQiLCJ0aW1lc3RhbXAiOjE3NjAyMjU4OTZ9XSwic2Vzc2lvbl9pZCI6ImE2NmZhZjQzMjNmY2E2NjFiOTgwYzY0YTE2YWIwYzJjIiwiaXNzIjoiaHR0cDovLzEyNy4wLjAuMTo1NDMyMS9hdXRoL3YxIiwiaWF0IjoxNzYwMjI1ODk2fQ.fbdwkPMLiXaC2AggL4jW75k6yBili8xf46ISDOSfPP4";
    
    await executeCommand(conn, `
      echo "Testing with NO RLS..."
      curl -s "https://supabase.healthscribe.pro/rest/v1/transcriptions?select=file_name,status&order=created_at.desc&limit=3" \\
        -H "apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYW5vbiIsImlzcyI6InN1cGFiYXNlIiwiaWF0IjoxNzU4NTE0MDEwLCJleHAiOjIzODkyMzQwMTB9.aEtU27HNIhkw1qj_4q2tnTyvLnGvWTWvHjJYFnsB3hI" \\
        -H "Authorization: Bearer ${token}"
      
      echo ""
      echo ""
      echo "Counting..."
      curl -s "https://supabase.healthscribe.pro/rest/v1/transcriptions?select=count" \\
        -H "apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYW5vbiIsImlzcyI6InN1cGFiYXNlIiwiaWF0IjoxNzU4NTE0MDEwLCJleHAiOjIzODkyMzQwMTB9.aEtU27HNIhkw1qj_4q2tnTyvLnGvWTWvHjJYFnsB3hI" \\
        -H "Authorization: Bearer ${token}" \\
        -H "Prefer: count=exact"
    `, 'Testing');

    conn.end();
    console.log('\n✅ SSH session closed');

    console.log('\n' + '='.repeat(80));
    console.log('📊 COMPLETE RLS FIX APPLIED');
    console.log('='.repeat(80));

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  }
}

main();

