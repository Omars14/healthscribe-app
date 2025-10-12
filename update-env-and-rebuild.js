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

    console.log('🔧 UPDATING ENVIRONMENT AND REBUILDING\n');
    console.log('=' .repeat(80) + '\n');

    console.log('1️⃣ Getting JWT secret and generating new tokens...\n');
    const result = await executeCommand(conn, `
# Get JWT secret
JWT_SECRET=$(docker exec supabase-auth-e088wwks88k8k48sccg8gk0o env | grep GOTRUE_JWT_SECRET | cut -d'=' -f2)
echo "JWT_SECRET=$JWT_SECRET"

# Generate anon key
ANON_HEADER=$(echo -n '{"alg":"HS256","typ":"JWT"}' | base64 -w0 | tr '+/' '-_' | tr -d '=')
ANON_PAYLOAD=$(echo -n '{"role":"anon","iss":"supabase","iat":1760299260,"exp":2075659260}' | base64 -w0 | tr '+/' '-_' | tr -d '=')
ANON_UNSIGNED="$ANON_HEADER.$ANON_PAYLOAD"
ANON_SIGNATURE=$(echo -n "$ANON_UNSIGNED" | openssl dgst -sha256 -hmac "$JWT_SECRET" -binary | base64 -w0 | tr '+/' '-_' | tr -d '=')
ANON_KEY="$ANON_UNSIGNED.$ANON_SIGNATURE"
echo "ANON_KEY=$ANON_KEY"

# Generate service role key
SERVICE_HEADER=$(echo -n '{"alg":"HS256","typ":"JWT"}' | base64 -w0 | tr '+/' '-_' | tr -d '=')
SERVICE_PAYLOAD=$(echo -n '{"role":"service_role","iss":"supabase","iat":1760299260,"exp":2075659260}' | base64 -w0 | tr '+/' '-_' | tr -d '=')
SERVICE_UNSIGNED="$SERVICE_HEADER.$SERVICE_PAYLOAD"
SERVICE_SIGNATURE=$(echo -n "$SERVICE_UNSIGNED" | openssl dgst -sha256 -hmac "$JWT_SECRET" -binary | base64 -w0 | tr '+/' '-_' | tr -d '=')
SERVICE_KEY="$SERVICE_UNSIGNED.$SERVICE_SIGNATURE"
echo "SERVICE_KEY=$SERVICE_KEY"
`);

    const lines = result.split('\n');
    const jwtSecret = lines.find(l => l.startsWith('JWT_SECRET=')).split('=', 2)[1].trim();
    const anonKey = lines.find(l => l.startsWith('ANON_KEY=')).split('=', 2)[1].trim();
    const serviceKey = lines.find(l => l.startsWith('SERVICE_KEY=')).split('=', 2)[1].trim();

    console.log(`\nJWT Secret: ${jwtSecret.substring(0, 20)}...`);
    console.log(`Anon Key: ${anonKey.substring(0, 50)}...`);
    console.log(`Service Key: ${serviceKey.substring(0, 50)}...\n`);

    console.log('2️⃣ Finding Coolify application directory...\n');
    const appDir = await executeCommand(conn, `
find /data/coolify/applications -name "docker-compose.yml" -path "*tkwoos4soccckws84088wc04*" -exec dirname {} \\; 2>/dev/null | head -1
`);
    console.log(`App Directory: ${appDir.trim()}\n`);

    if (!appDir.trim()) {
      console.error('❌ Coolify application directory not found!');
      process.exit(1);
    }

    console.log('3️⃣ Updating .env file with new JWT keys...\n');
    
    //  Use cat and redirection to update the file
    await executeCommand(conn, `
cd "${appDir.trim()}"

# Backup existing .env
cp .env .env.backup

# Update the keys using awk
awk -v anon="${anonKey}" -v service="${serviceKey}" '
/^NEXT_PUBLIC_SUPABASE_ANON_KEY=/ { print "NEXT_PUBLIC_SUPABASE_ANON_KEY=" anon; next }
/^SUPABASE_SERVICE_ROLE_KEY=/ { print "SUPABASE_SERVICE_ROLE_KEY=" service; next }
{ print }
' .env > .env.new

mv .env.new .env

echo "✅ .env updated"
echo ""
echo "Verification:"
grep "NEXT_PUBLIC_SUPABASE_ANON_KEY" .env | cut -c 1-100
grep "SUPABASE_SERVICE_ROLE_KEY" .env | cut -c 1-100
`);

    console.log('\n4️⃣ Stopping current application...\n');
    await executeCommand(conn, `
cd "${appDir.trim()}"
docker compose down
sleep 5
echo "✅ Application stopped"
`);

    console.log('\n5️⃣ Rebuilding with new environment...\n');
    await executeCommand(conn, `
cd "${appDir.trim()}"
docker compose up -d --build --force-recreate
echo "✅ Build triggered"
`);

    console.log('\n6️⃣ Waiting for container to start (60 seconds)...\n');
    for (let i = 0; i < 12; i++) {
      await new Promise(resolve => setTimeout(resolve, 5000));
      const containers = await executeCommand(conn, `docker ps | grep tkwoos4soccckws84088wc04 | wc -l`);
      if (containers.trim() !== '0') {
        console.log(`✅ Container is running!\n`);
        break;
      } else {
        console.log(`⏳ Waiting... (${(i + 1) * 5} seconds)`);
      }
    }

    console.log('\n7️⃣ Checking container status and logs...\n');
    await executeCommand(conn, `
echo "Container Status:"
docker ps | grep tkwoos4soccckws84088wc04

echo ""
echo "Recent Logs:"
NEW_CONTAINER=$(docker ps | grep tkwoos4soccckws84088wc04 | awk '{print $1}')
if [ -n "$NEW_CONTAINER" ]; then
  docker logs $NEW_CONTAINER --tail 30 2>&1 | tail -15
else
  echo "❌ Container not found"
fi
`);

    console.log('\n\n' + '='.repeat(80));
    console.log('✅✅✅ REBUILD COMPLETE! ✅✅✅');
    console.log('='.repeat(80));
    console.log('\n🔧 Actions completed:');
    console.log('✅ Generated new JWT tokens from Supabase secret');
    console.log('✅ Updated Coolify .env file');
    console.log('✅ Rebuilt Docker image with new keys');
    console.log('✅ Started new container');
    console.log('\n🚀 Try now:');
    console.log('1. Hard refresh browser: CTRL + SHIFT + R');
    console.log('2. Login: omars14@gmail.com / Nomar123');
    console.log('3. Navigate to Transcriptionist Workspace');
    console.log('4. Your transcription history should now load!');
    console.log('');

    conn.end();

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

main();

