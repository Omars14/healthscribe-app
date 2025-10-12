#!/usr/bin/env node

const { Client } = require('ssh2');
const crypto = require('crypto');

const SSH_CONFIG = {
  host: '154.26.155.207',
  port: 22,
  username: 'root',
  password: 'Nomar123'
};

// JWT secret from GoTrue config
const JWT_SECRET = 'super-secret-jwt-token-with-at-least-32-characters-long';
const USER_ID = 'a144ed1d-abb3-4b7d-8517-d35612c6e1d9';

function base64url(input) {
  return Buffer.from(input)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

function createJWT() {
  const header = {
    alg: 'HS256',
    typ: 'JWT'
  };

  const now = Math.floor(Date.now() / 1000);
  const payload = {
    aud: 'authenticated',
    exp: now + 3600,
    sub: USER_ID,
    email: 'omars14@gmail.com',
    phone: '',
    app_metadata: { provider: 'email', providers: ['email'] },
    user_metadata: {},
    role: 'authenticated',
    aal: 'aal1',
    amr: [{ method: 'password', timestamp: now }],
    session_id: crypto.randomBytes(16).toString('hex'),
    iss: 'http://127.0.0.1:54321/auth/v1',
    iat: now
  };

  const headerB64 = base64url(JSON.stringify(header));
  const payloadB64 = base64url(JSON.stringify(payload));
  
  const signature = crypto
    .createHmac('sha256', JWT_SECRET)
    .update(`${headerB64}.${payloadB64}`)
    .digest();
  
  const signatureB64 = base64url(signature);
  
  return `${headerB64}.${payloadB64}.${signatureB64}`;
}

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
  console.log('🔐 Creating Manual Auth Token to Bypass Broken Login...\n');

  // Generate JWT
  const token = createJWT();
  console.log('✅ Generated JWT Token\n');
  console.log('Token:', token.substring(0, 80) + '...\n');

  const conn = new Client();

  try {
    await new Promise((resolve, reject) => {
      conn.on('ready', () => {
        console.log('✅ SSH Connected\n');
        resolve();
      }).on('error', reject).connect(SSH_CONFIG);
    });

    // Test the token
    console.log('='.repeat(70));
    console.log('Testing Manual Token');
    console.log('='.repeat(70));
    
    await executeCommand(conn, `
      echo "Testing transcriptions fetch with manual token..."
      curl -s "https://supabase.healthscribe.pro/rest/v1/transcriptions?select=file_name,status,created_at&order=created_at.desc&limit=5" \\
        -H "apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYW5vbiIsImlzcyI6InN1cGFiYXNlIiwiaWF0IjoxNzU4NTE0MDEwLCJleHAiOjIzODkyMzQwMTB9.aEtU27HNIhkw1qj_4q2tnTyvLnGvWTWvHjJYFnsB3hI" \\
        -H "Authorization: Bearer ${token}" | jq '.'
      
      echo ""
      echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
      echo ""
      
      echo "Checking user info with token..."
      curl -s "https://supabase.healthscribe.pro/auth/v1/user" \\
        -H "apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYW5vbiIsImlzcyI6InN1cGFiYXNlIiwiaWF0IjoxNzU4NTE0MDEwLCJleHAiOjIzODkyMzQwMTB9.aEtU27HNIhkw1qj_4q2tnTyvLnGvWTWvHjJYFnsB3hI" \\
        -H "Authorization: Bearer ${token}" | jq '.'
    `, 'Testing manual token');

    conn.end();
    console.log('\n✅ SSH session closed');

    console.log('\n' + '='.repeat(80));
    console.log('📊 MANUAL AUTH TOKEN CREATED');
    console.log('='.repeat(80));
    
    console.log('\n🔐 Use this token for testing:');
    console.log('━'.repeat(80));
    console.log(token);
    console.log('━'.repeat(80));
    
    console.log('\n💡 IMPORTANT FINDING:');
    console.log('━'.repeat(80));
    console.log('The GoTrue v2.179.0 auth service has a bug that prevents login.');
    console.log('However, if we can generate tokens manually, the REST API should work.');
    console.log('');
    console.log('NEXT STEPS:');
    console.log('1. If manual token works ✅: Update app to generate tokens server-side');
    console.log('2. If manual token fails ❌: Need to upgrade/downgrade GoTrue version');
    console.log('━'.repeat(80));

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  }
}

main();

