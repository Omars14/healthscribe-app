#!/usr/bin/env node

const { Client } = require('ssh2');
const fs = require('fs');

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
  console.log('🔍 Checking Actual Data (Bypassing RLS)...\n');

  const conn = new Client();

  try {
    await new Promise((resolve, reject) => {
      conn.on('ready', () => {
        console.log('✅ SSH Connected\n');
        resolve();
      }).on('error', reject).connect(SSH_CONFIG);
    });

    // Check data in 2-week instance (bypassing RLS)
    console.log('='.repeat(70));
    console.log('Database 1: supabase_db_supabase (2 weeks old)');
    console.log('='.repeat(70));
    
    const { output: db1Output } = await executeCommand(conn, `
      docker exec supabase_db_supabase psql -U postgres -d postgres <<'EOSQL'
-- Bypass RLS by using postgres role
SELECT COUNT(*) as total_transcriptions FROM public.transcriptions;

-- Show all user IDs
SELECT user_id, COUNT(*) as count, MAX(created_at) as latest
FROM public.transcriptions
GROUP BY user_id;

-- Show sample data
SELECT id, user_id, file_name, created_at
FROM public.transcriptions
ORDER BY created_at DESC
LIMIT 5;

-- Check specific user
SELECT COUNT(*) as omars_count
FROM public.transcriptions
WHERE user_id = '4a99755c-53ba-486c-8393-1460561b2259';

-- Check users
SELECT id, email FROM auth.users;
EOSQL
    `, 'Checking 2-week database');

    // Check data in e088 instance
    console.log('\n' + '='.repeat(70));
    console.log('Database 2: supabase-db-e088 (3 weeks old)');
    console.log('='.repeat(70));
    
    const { output: db2Output } = await executeCommand(conn, `
      docker exec supabase-db-e088wwks88k8k48sccg8gk0o psql -U postgres -d postgres <<'EOSQL'
-- Bypass RLS by using postgres role
SELECT COUNT(*) as total_transcriptions FROM public.transcriptions;

-- Show all user IDs
SELECT user_id, COUNT(*) as count, MAX(created_at) as latest
FROM public.transcriptions
GROUP BY user_id;

-- Show sample data
SELECT id, user_id, file_name, created_at
FROM public.transcriptions
ORDER BY created_at DESC
LIMIT 5;

-- Check specific user
SELECT COUNT(*) as omars_count
FROM public.transcriptions
WHERE user_id = '4a99755c-53ba-486c-8393-1460561b2259';

-- Check users
SELECT id, email FROM auth.users;
EOSQL
    `, 'Checking 3-week database');

    conn.end();
    console.log('\n✅ SSH session closed');

    console.log('\n' + '='.repeat(80));
    console.log('📊 ANALYSIS');
    console.log('='.repeat(80));
    
    // Determine which database has the data
    let useDatabase = null;
    let kongGateway = null;
    
    if (db1Output.includes('omars_count') && !db1Output.match(/omars_count[|\s]+0/)) {
      console.log('\n✅ FOUND DATA in 2-week instance (supabase_db_supabase)');
      useDatabase = 'supabase_db_supabase';
      kongGateway = 'supabase_kong_supabase';
      console.log('Kong Gateway: supabase_kong_supabase (port 54321)');
    }
    
    if (db2Output.includes('omars_count') && !db2Output.match(/omars_count[|\s]+0/)) {
      console.log('\n✅ FOUND DATA in 3-week instance (supabase-db-e088)');
      useDatabase = 'supabase-db-e088wwks88k8k48sccg8gk0o';
      kongGateway = 'supabase-kong-e088wwks88k8k48sccg8gk0o';
      console.log('Kong Gateway: supabase-kong-e088wwks88k8k48sccg8gk0o');
    }
    
    if (!useDatabase) {
      console.log('\n❌ NO DATA FOUND in either database!');
      console.log('This suggests the transcriptions may have been deleted or are in Supabase Cloud');
      console.log('\nChecking if app is using Supabase Cloud...');
    } else {
      console.log(`\n✅ Using: ${useDatabase}`);
      console.log(`✅ Kong: ${kongGateway}`);
    }

    console.log('');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  }
}

main();

