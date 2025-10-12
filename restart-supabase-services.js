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
  console.log('🔄 Restarting Supabase Services to Clear Cache...\n');

  const conn = new Client();

  try {
    await new Promise((resolve, reject) => {
      conn.on('ready', () => {
        console.log('✅ SSH Connected\n');
        resolve();
      }).on('error', reject).connect(SSH_CONFIG);
    });

    // Restart REST and Kong services
    console.log('='.repeat(70));
    console.log('Restarting Supabase Services');
    console.log('='.repeat(70));
    
    await executeCommand(conn, `
      echo "Restarting REST service (clears RLS cache)..."
      docker restart supabase_rest_supabase
      
      echo ""
      echo "Restarting Kong (API gateway)..."
      docker restart supabase_kong_supabase
      
      echo ""
      echo "Waiting 20 seconds for services to start..."
      sleep 20
      
      echo ""
      echo "Checking service status..."
      docker ps --filter "name=supabase_(rest|kong)_supabase" --format "table {{.Names}}\t{{.Status}}"
    `, 'Restarting services');

    // Test again
    console.log('\n' + '='.repeat(70));
    console.log('Testing After Restart');
    console.log('='.repeat(70));
    
    const token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhdWQiOiJhdXRoZW50aWNhdGVkIiwiZXhwIjoxNzYwMjI5NDk2LCJzdWIiOiJhMTQ0ZWQxZC1hYmIzLTRiN2QtODUxNy1kMzU2MTJjNmUxZDkiLCJlbWFpbCI6Im9tYXJzMTRAZ21haWwuY29tIiwicGhvbmUiOiIiLCJhcHBfbWV0YWRhdGEiOnsicHJvdmlkZXIiOiJlbWFpbCIsInByb3ZpZGVycyI6WyJlbWFpbCJdfSwidXNlcl9tZXRhZGF0YSI6e30sInJvbGUiOiJhdXRoZW50aWNhdGVkIiwiYWFsIjoiYWFsMSIsImFtciI6W3sibWV0aG9kIjoicGFzc3dvcmQiLCJ0aW1lc3RhbXAiOjE3NjAyMjU4OTZ9XSwic2Vzc2lvbl9pZCI6ImE2NmZhZjQzMjNmY2E2NjFiOTgwYzY0YTE2YWIwYzJjIiwiaXNzIjoiaHR0cDovLzEyNy4wLjAuMTo1NDMyMS9hdXRoL3YxIiwiaWF0IjoxNzYwMjI1ODk2fQ.fbdwkPMLiXaC2AggL4jW75k6yBili8xf46ISDOSfPP4";
    
    await executeCommand(conn, `
      echo "Testing transcriptions API..."
      curl -s "https://supabase.healthscribe.pro/rest/v1/transcriptions?select=file_name,status&order=created_at.desc&limit=5" \\
        -H "apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYW5vbiIsImlzcyI6InN1cGFiYXNlIiwiaWF0IjoxNzU4NTE0MDEwLCJleHAiOjIzODkyMzQwMTB9.aEtU27HNIhkw1qj_4q2tnTyvLnGvWTWvHjJYFnsB3hI" \\
        -H "Authorization: Bearer ${token}" | jq '.'
      
      echo ""
      echo "Counting transcriptions..."
      curl -s "https://supabase.healthscribe.pro/rest/v1/transcriptions?select=count" \\
        -H "apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYW5vbiIsImlzcyI6InN1cGFiYXNlIiwiaWF0IjoxNzU4NTE0MDEwLCJleHAiOjIzODkyMzQwMTB9.aEtU27HNIhkw1qj_4q2tnTyvLnGvWTWvHjJYFnsB3hI" \\
        -H "Authorization: Bearer ${token}" \\
        -H "Prefer: count=exact"
    `, 'Testing API');

    conn.end();
    console.log('\n✅ SSH session closed');

    console.log('\n' + '='.repeat(80));
    console.log('📊 RESTART COMPLETE');
    console.log('='.repeat(80));
    
    console.log('\nIf the API works now, the system is fully operational ✅');
    console.log('');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  }
}

main();

