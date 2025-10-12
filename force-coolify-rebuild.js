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

    console.log('🔧 UPDATING JWT KEYS IN COOLIFY APPLICATION\n');
    console.log('=' .repeat(80) + '\n');

    console.log('1️⃣ Getting JWT secret from Supabase Auth...\n');
    const jwtSecret = await executeCommand(conn, `
docker exec supabase-auth-e088wwks88k8k48sccg8gk0o env | grep GOTRUE_JWT_SECRET | cut -d'=' -f2
`);
    console.log(`JWT Secret: ${jwtSecret.trim()}\n`);

    console.log('2️⃣ Generating new JWT tokens...\n');
    const tokens = await executeCommand(conn, `
JWT_SECRET="${jwtSecret.trim()}"

# Generate anon key
ANON_HEADER=$(echo -n '{"alg":"HS256","typ":"JWT"}' | base64 -w0 | tr '+/' '-_' | tr -d '=')
ANON_PAYLOAD=$(echo -n '{"role":"anon","iss":"supabase","iat":1760299260,"exp":2075659260}' | base64 -w0 | tr '+/' '-_' | tr -d '=')
ANON_UNSIGNED="$ANON_HEADER.$ANON_PAYLOAD"
ANON_SIGNATURE=$(echo -n "$ANON_UNSIGNED" | openssl dgst -sha256 -hmac "$JWT_SECRET" -binary | base64 -w0 | tr '+/' '-_' | tr -d '=')
ANON_KEY="$ANON_UNSIGNED.$ANON_SIGNATURE"

# Generate service role key
SERVICE_HEADER=$(echo -n '{"alg":"HS256","typ":"JWT"}' | base64 -w0 | tr '+/' '-_' | tr -d '=')
SERVICE_PAYLOAD=$(echo -n '{"role":"service_role","iss":"supabase","iat":1760299260,"exp":2075659260}' | base64 -w0 | tr '+/' '-_' | tr -d '=')
SERVICE_UNSIGNED="$SERVICE_HEADER.$SERVICE_PAYLOAD"
SERVICE_SIGNATURE=$(echo -n "$SERVICE_UNSIGNED" | openssl dgst -sha256 -hmac "$JWT_SECRET" -binary | base64 -w0 | tr '+/' '-_' | tr -d '=')
SERVICE_KEY="$SERVICE_UNSIGNED.$SERVICE_SIGNATURE"

echo "ANON_KEY=$ANON_KEY"
echo "SERVICE_KEY=$SERVICE_KEY"
`);
    
    const lines = tokens.trim().split('\n');
    const anonKey = lines.find(l => l.startsWith('ANON_KEY=')).split('=')[1];
    const serviceKey = lines.find(l => l.startsWith('SERVICE_KEY=')).split('=')[1];
    
    console.log(`Anon Key: ${anonKey.substring(0, 50)}...`);
    console.log(`Service Key: ${serviceKey.substring(0, 50)}...\n`);

    console.log('3️⃣ Updating Coolify environment variables...\n');
    await executeCommand(conn, `
# Find Coolify application directory
APP_DIR=$(find /data/coolify -name ".env" -path "*/applications/tkwoos4soccckws84088wc04*" -exec dirname {} \\; 2>/dev/null | head -1)

if [ -z "$APP_DIR" ]; then
  echo "❌ Coolify application directory not found"
  exit 1
fi

echo "App directory: $APP_DIR"

cd "$APP_DIR"

# Update .env file
sed -i 's|NEXT_PUBLIC_SUPABASE_ANON_KEY=.*|NEXT_PUBLIC_SUPABASE_ANON_KEY=${anonKey}|g' .env
sed -i 's|SUPABASE_SERVICE_ROLE_KEY=.*|SUPABASE_SERVICE_ROLE_KEY=${serviceKey}|g' .env

echo "✅ .env updated"

# Verify
echo "Verification:"
grep "NEXT_PUBLIC_SUPABASE_ANON_KEY" .env | cut -c 1-80
grep "SUPABASE_SERVICE_ROLE_KEY" .env | cut -c 1-80
`);

    console.log('\n4️⃣ Restarting application container...\n');
    await executeCommand(conn, `
docker restart tkwoos4soccckws84088wc04-184252873467
sleep 20
echo "✅ Container restarted"
`);

    console.log('\n5️⃣ Checking application startup...\n');
    await executeCommand(conn, `
docker logs tkwoos4soccckws84088wc04-184252873467 --tail 30 2>&1 | grep -E "Ready|Error|JWS" || echo "Checking..."
`);

    console.log('\n\n' + '='.repeat(80));
    console.log('⚠️  ENVIRONMENT UPDATED BUT KEYS STILL BAKED IN BUILD ⚠️');
    console.log('='.repeat(80));
    console.log('\n❌ The problem: JWT keys are baked into the Next.js build');
    console.log('✅ Solution: We need to trigger a Coolify rebuild from Git');
    console.log('\n📝 To fix this properly:');
    console.log('   1. Go to Coolify dashboard: https://coolify.healthscribe.pro');
    console.log('   2. Find the healthscribe application');
    console.log('   3. Click "Force Redeploy" or "Rebuild"');
    console.log('   4. Wait 2-5 minutes for the build to complete');
    console.log('\nOR run this command manually:');
    console.log('   ssh root@154.26.155.207');
    console.log('   cd /data/coolify/applications/tkwoos4soccckws84088wc04*');
    console.log('   docker compose down');
    console.log('   docker compose up -d --build');
    console.log('');

    conn.end();

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

main();

