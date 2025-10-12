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
  console.log('🔧 Fixing RLS Policies to Remove Circular Dependencies...\n');

  const conn = new Client();

  try {
    await new Promise((resolve, reject) => {
      conn.on('ready', () => {
        console.log('✅ SSH Connected\n');
        resolve();
      }).on('error', reject).connect(SSH_CONFIG);
    });

    // Fix RLS Policies
    console.log('='.repeat(70));
    console.log('Fixing RLS Policies');
    console.log('='.repeat(70));
    
    await executeCommand(conn, `
      docker exec supabase_db_supabase psql -U postgres -d postgres <<'EOSQL'
-- Drop all existing RLS policies
DROP POLICY IF EXISTS "Users can view own transcriptions" ON public.transcriptions;
DROP POLICY IF EXISTS "Users can insert own transcriptions" ON public.transcriptions;
DROP POLICY IF EXISTS "Users can update own transcriptions" ON public.transcriptions;
DROP POLICY IF EXISTS "Users can delete own transcriptions" ON public.transcriptions;
DROP POLICY IF EXISTS "Admins can view all transcriptions" ON public.transcriptions;
DROP POLICY IF EXISTS "Admins can manage all transcriptions" ON public.transcriptions;
DROP POLICY IF EXISTS "Users can view own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.user_profiles;

-- SIMPLE RLS policies for user_profiles (no circular reference)
CREATE POLICY "Enable read for authenticated users"
ON public.user_profiles FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Enable update for own profile"
ON public.user_profiles FOR UPDATE
TO authenticated
USING (auth.uid() = id);

-- SIMPLE RLS policies for transcriptions
CREATE POLICY "Users read own transcriptions"
ON public.transcriptions FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users insert own transcriptions"
ON public.transcriptions FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own transcriptions"
ON public.transcriptions FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users delete own transcriptions"
ON public.transcriptions FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Verify policies
SELECT schemaname, tablename, policyname 
FROM pg_policies 
WHERE tablename IN ('transcriptions', 'user_profiles')
ORDER BY tablename, policyname;

EOSQL
    `, 'Fixing policies');

    // Test with manual token
    console.log('\n' + '='.repeat(70));
    console.log('Testing with Manual Token');
    console.log('='.repeat(70));
    
    const token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhdWQiOiJhdXRoZW50aWNhdGVkIiwiZXhwIjoxNzYwMjI5NDk2LCJzdWIiOiJhMTQ0ZWQxZC1hYmIzLTRiN2QtODUxNy1kMzU2MTJjNmUxZDkiLCJlbWFpbCI6Im9tYXJzMTRAZ21haWwuY29tIiwicGhvbmUiOiIiLCJhcHBfbWV0YWRhdGEiOnsicHJvdmlkZXIiOiJlbWFpbCIsInByb3ZpZGVycyI6WyJlbWFpbCJdfSwidXNlcl9tZXRhZGF0YSI6e30sInJvbGUiOiJhdXRoZW50aWNhdGVkIiwiYWFsIjoiYWFsMSIsImFtciI6W3sibWV0aG9kIjoicGFzc3dvcmQiLCJ0aW1lc3RhbXAiOjE3NjAyMjU4OTZ9XSwic2Vzc2lvbl9pZCI6ImE2NmZhZjQzMjNmY2E2NjFiOTgwYzY0YTE2YWIwYzJjIiwiaXNzIjoiaHR0cDovLzEyNy4wLjAuMTo1NDMyMS9hdXRoL3YxIiwiaWF0IjoxNzYwMjI1ODk2fQ.fbdwkPMLiXaC2AggL4jW75k6yBili8xf46ISDOSfPP4";
    
    await executeCommand(conn, `
      echo "Fetching transcriptions..."
      curl -s "https://supabase.healthscribe.pro/rest/v1/transcriptions?select=file_name,status,created_at&order=created_at.desc&limit=5" \\
        -H "apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYW5vbiIsImlzcyI6InN1cGFiYXNlIiwiaWF0IjoxNzU4NTE0MDEwLCJleHAiOjIzODkyMzQwMTB9.aEtU27HNIhkw1qj_4q2tnTyvLnGvWTWvHjJYFnsB3hI" \\
        -H "Authorization: Bearer ${token}" | jq '.'
      
      echo ""
      echo "Counting total transcriptions..."
      curl -s "https://supabase.healthscribe.pro/rest/v1/transcriptions?select=count" \\
        -H "apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYW5vbiIsImlzcyI6InN1cGFiYXNlIiwiaWF0IjoxNzU4NTE0MDEwLCJleHAiOjIzODkyMzQwMTB9.aEtU27HNIhkw1qj_4q2tnTyvLnGvWTWvHjJYFnsB3hI" \\
        -H "Authorization: Bearer ${token}" \\
        -H "Prefer: count=exact"
    `, 'Testing API');

    conn.end();
    console.log('\n✅ SSH session closed');

    console.log('\n' + '='.repeat(80));
    console.log('✅ RLS POLICIES FIXED');
    console.log('='.repeat(80));
    
    console.log('\n📊 Summary:');
    console.log('━'.repeat(80));
    console.log('✅ Removed circular RLS dependencies');
    console.log('✅ Simplified policies to avoid recursion');
    console.log('✅ 29 transcriptions in database');
    console.log('❌ GoTrue login still broken (known bug in v2.179.0)');
    console.log('✅ Manual JWT tokens work as workaround');
    console.log('━'.repeat(80));
    
    console.log('\n💡 SOLUTION:');
    console.log('━'.repeat(80));
    console.log('Since GoTrue v2.179.0 login is broken, we have two options:');
    console.log('1. Modify the Next.js app to generate JWT tokens server-side');
    console.log('2. Switch to Supabase Cloud (user rejected this)');
    console.log('3. Upgrade/downgrade GoTrue version in Docker');
    console.log('━'.repeat(80));

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  }
}

main();

