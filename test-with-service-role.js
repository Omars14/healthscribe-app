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
  console.log('🔑 Testing with Service Role Key (Bypasses ALL RLS)...\n');

  const conn = new Client();

  try {
    await new Promise((resolve, reject) => {
      conn.on('ready', () => {
        console.log('✅ SSH Connected\n');
        resolve();
      }).on('error', reject).connect(SSH_CONFIG);
    });

    console.log('='.repeat(70));
    console.log('Testing with Service Role Key');
    console.log('='.repeat(70));
    
    await executeCommand(conn, `
      # Service role key bypasses ALL RLS
      SERVICE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoic2VydmljZV9yb2xlIiwiaXNzIjoic3VwYWJhc2UiLCJpYXQiOjE3NTg1MTQwMTAsImV4cCI6MjM4OTIzNDAxMH0.qjBCdR_u9CWR9Fhx1VwoZdBdtetp_h9bE9qEieyQM_4"
      
      echo "Fetching transcriptions with service role..."
      curl -s "https://supabase.healthscribe.pro/rest/v1/transcriptions?select=file_name,status,created_at&order=created_at.desc&limit=5" \\
        -H "apikey: \$SERVICE_KEY" \\
        -H "Authorization: Bearer \$SERVICE_KEY" | jq '.'
      
      echo ""
      echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
      echo ""
      
      echo "Counting all transcriptions..."
      curl -s "https://supabase.healthscribe.pro/rest/v1/transcriptions?select=count" \\
        -H "apikey: \$SERVICE_KEY" \\
        -H "Authorization: Bearer \$SERVICE_KEY" \\
        -H "Prefer: count=exact" | jq '.'
      
      echo ""
      echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
      echo ""
      
      echo "Checking user profiles..."
      curl -s "https://supabase.healthscribe.pro/rest/v1/user_profiles?select=email,role" \\
        -H "apikey: \$SERVICE_KEY" \\
        -H "Authorization: Bearer \$SERVICE_KEY" | jq '.'
    `, 'Testing with service role');

    conn.end();
    console.log('\n✅ SSH session closed');

    console.log('\n' + '='.repeat(80));
    console.log('📊 SERVICE ROLE TEST COMPLETE');
    console.log('='.repeat(80));
    
    console.log('\n💡 If service role works but regular auth does not:');
    console.log('The issue is specifically with RLS/auth, not the data itself.');
    console.log('We can configure the app to use service role for backend operations.');
    console.log('');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  }
}

main();

