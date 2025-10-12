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

    console.log('🔧 FIXING STORAGE SERVICE CONFIGURATION\n');
    console.log('=' .repeat(80) + '\n');
    
    // Check storage service logs
    console.log('📋 Step 1: Checking storage service logs...\n');
    await executeCommand(conn, `
docker logs supabase-storage-e088wwks88k8k48sccg8gk0o --tail 50 | head -40
`);

    // Check storage service environment
    console.log('\n🔧 Step 2: Checking storage service configuration...\n');
    await executeCommand(conn, `
docker exec supabase-storage-e088wwks88k8k48sccg8gk0o env | grep -E "DATABASE|POSTGRES|FILE_SIZE_LIMIT" | head -10
`);

    // Restart entire Supabase stack in correct order
    console.log('\n🔄 Step 3: Restarting Supabase services in correct order...\n');
    await executeCommand(conn, `
cd /data/coolify/services/e088wwks88k8k48sccg8gk0o

echo "Restarting database..."
docker-compose restart supabase-db
sleep 15

echo "Restarting storage..."
docker-compose restart supabase-storage
sleep 15

echo "Restarting Kong..."
docker-compose restart supabase-kong
sleep 20

docker ps --filter "name=e088" --format "{{.Names}} - {{.Status}}" | grep -E "db|storage|kong"
`);

    // Test storage via Kong with proper auth
    console.log('\n✅ Step 4: Testing storage via Kong...\n');
    await executeCommand(conn, `
# Get auth token
TOKEN=\$(curl -s -X POST "https://supabase.healthscribe.pro/auth/v1/token?grant_type=password" \\
  -H "Content-Type: application/json" \\
  -H "apikey: eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJzdXBhYmFzZSIsImlhdCI6MTc1ODMyOTQwMCwiZXhwIjo0OTE0MDAzMDAwLCJyb2xlIjoiYW5vbiJ9.USAl15ClzSLfHwEYQn-bQQaZNz79FkDGUPsohnnEqJA" \\
  -d '{"email":"omars14@gmail.com","password":"Nomar123"}' | jq -r '.access_token')

echo "Token obtained: \${TOKEN:0:50}..."
echo ""

# List buckets with proper headers
curl -s "https://supabase.healthscribe.pro/storage/v1/bucket" \\
  -H "apikey: eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJzdXBhYmFzZSIsImlhdCI6MTc1ODMyOTQwMCwiZXhwIjo0OTE0MDAzMDAwLCJyb2xlIjoiYW5vbiJ9.USAl15ClzSLfHwEYQn-bQQaZNz79FkDGUPsohnnEqJA" \\
  -H "Authorization: Bearer \$TOKEN" | jq '.'
`);

    // Create a test upload
    console.log('\n🧪 Step 5: Testing file upload...\n');
    await executeCommand(conn, `
TOKEN=\$(curl -s -X POST "https://supabase.healthscribe.pro/auth/v1/token?grant_type=password" \\
  -H "Content-Type: application/json" \\
  -H "apikey: eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJzdXBhYmFzZSIsImlhdCI6MTc1ODMyOTQwMCwiZXhwIjo0OTE0MDAzMDAwLCJyb2xlIjoiYW5vbiJ9.USAl15ClzSLfHwEYQn-bQQaZNz79FkDGUPsohnnEqJA" \\
  -d '{"email":"omars14@gmail.com","password":"Nomar123"}' | jq -r '.access_token')

# Create a small test file
echo "test audio content" > /tmp/test.mp3

# Try to upload
curl -X POST "https://supabase.healthscribe.pro/storage/v1/object/audio-files/test/test.mp3" \\
  -H "apikey: eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJzdXBhYmFzZSIsImlhdCI6MTc1ODMyOTQwMCwiZXhwIjo0OTE0MDAzMDAwLCJyb2xlIjoiYW5vbiJ9.USAl15ClzSLfHwEYQn-bQQaZNz79FkDGUPsohnnEqJA" \\
  -H "Authorization: Bearer \$TOKEN" \\
  -H "Content-Type: audio/mpeg" \\
  -F "file=@/tmp/test.mp3"

rm /tmp/test.mp3
`);

    console.log('\n' + '='.repeat(80));
    console.log('✅ STORAGE SERVICE RESTARTED');
    console.log('='.repeat(80));
    console.log('\n🎯 TRY UPLOADING IN BROWSER NOW');
    console.log('');

    conn.end();

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

main();

