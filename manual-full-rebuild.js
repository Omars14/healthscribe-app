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

    console.log('🔨 MANUAL FULL DOCKER IMAGE REBUILD\n');
    console.log('=' .repeat(80) + '\n');
    
    // Step 1: Find all git repositories on VPS
    console.log('📁 Step 1: Finding git repositories...\n');
    await executeCommand(conn, `
find /data/coolify -name ".git" -type d 2>/dev/null | head -10
`);

    // Step 2: Check for build cache or source
    console.log('\n📦 Step 2: Checking for source code...\n');
    const sourceCheck = await executeCommand(conn, `
find /data/coolify/sources -type d 2>/dev/null | head -10
ls -la /data/coolify/ | grep -E "source|build|deploy"
`);

    console.log(sourceCheck);

    // Step 3: Use healthscribe-app as base and rebuild it
    console.log('\n🔧 Step 3: Extracting working container filesystem...\n');
    await executeCommand(conn, `
# Start the working container if stopped
docker start healthscribe-app 2>/dev/null || echo "Already running"
sleep 10

# Export the entire /app directory from working container
docker exec healthscribe-app tar -czf /tmp/app-export.tar.gz -C /app .

# Copy to host
docker cp healthscribe-app:/tmp/app-export.tar.gz /tmp/app-export.tar.gz

# Extract to build directory
mkdir -p /tmp/healthscribe-rebuild
cd /tmp/healthscribe-rebuild
tar -xzf /tmp/app-export.tar.gz

echo "Extracted files:"
ls -la | head -15
`);

    // Step 4: Deploy environment files
    console.log('\n🔑 Step 4: Deploying correct environment configuration...\n');
    await executeCommand(conn, `
cat > /tmp/healthscribe-rebuild/.env.local <<'ENVEOF'
NEXT_PUBLIC_SUPABASE_URL=https://supabase.healthscribe.pro
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJzdXBhYmFzZSIsImlhdCI6MTc1ODMyOTQwMCwiZXhwIjo0OTE0MDAzMDAwLCJyb2xlIjoiYW5vbiJ9.USAl15ClzSLfHwEYQn-bQQaZNz79FkDGUPsohnnEqJA
SUPABASE_SERVICE_ROLE_KEY=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJzdXBhYmFzZSIsImlhdCI6MTc1ODMyOTQwMCwiZXhwIjo0OTE0MDAzMDAwLCJyb2xlIjoic2VydmljZV9yb2xlIn0.t-Yjplk7J1vihdKlruGPN7FzyqTPvujcB4c_vZVd8yY
N8N_WEBHOOK_URL=https://n8n.healthscribe.pro/webhook/medical-transcribe-v2
NODE_ENV=production
MAX_FILE_SIZE=104857600
SUPPORTED_AUDIO_FORMATS=audio/mpeg,audio/wav,audio/webm,audio/ogg,audio/mp4,audio/m4a
ENVEOF

cat > /tmp/healthscribe-rebuild/.env.production.local <<'ENVEOF'
NEXT_PUBLIC_SUPABASE_URL=https://supabase.healthscribe.pro
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJzdXBhYmFzZSIsImlhdCI6MTc1ODMyOTQwMCwiZXhwIjo0OTE0MDAzMDAwLCJyb2xlIjoiYW5vbiJ9.USAl15ClzSLfHwEYQn-bQQaZNz79FkDGUPsohnnEqJA
SUPABASE_SERVICE_ROLE_KEY=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJzdXBhYmFzZSIsImlhdCI6MTc1ODMyOTQwMCwiZXhwIjo0OTE0MDAzMDAwLCJyb2xlIjoic2VydmljZV9yb2xlIn0.t-Yjplk7J1vihdKlruGPN7FzyqTPvujcB4c_vZVd8yY
ENVEOF

echo "Environment files created"
`);

    // Step 5: Rebuild Next.js with new env vars
    console.log('\n🏗️ Step 5: Rebuilding Next.js application with correct environment...\n');
    await executeCommand(conn, `
cd /tmp/healthscribe-rebuild

# Clean previous build
rm -rf .next

# Install if needed
if [ ! -d "node_modules" ]; then
  echo "Installing dependencies..."
  npm install --legacy-peer-deps 2>&1 | tail -20
fi

# Build with correct environment
echo "Building with self-hosted Supabase..."
export NEXT_PUBLIC_SUPABASE_URL=https://supabase.healthscribe.pro
export NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJzdXBhYmFzZSIsImlhdCI6MTc1ODMyOTQwMCwiZXhwIjo0OTE0MDAzMDAwLCJyb2xlIjoiYW5vbiJ9.USAl15ClzSLfHwEYQn-bQQaZNz79FkDGUPsohnnEqJA
export SUPABASE_SERVICE_ROLE_KEY=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJzdXBhYmFzZSIsImlhdCI6MTc1ODMyOTQwMCwiZXhwIjo0OTE0MDAzMDAwLCJyb2xlIjoic2VydmljZV9yb2xlIn0.t-Yjplk7J1vihdKlruGPN7FzyqTPvujcB4c_vZVd8yY

npm run build 2>&1 | tail -50
`);

    // Step 6: Create new Docker image from rebuilt app
    console.log('\n🐳 Step 6: Creating Docker image from rebuilt application...\n');
    await executeCommand(conn, `
cat > /tmp/healthscribe-rebuild/Dockerfile.simple <<'DOCKERFILE'
FROM node:18-alpine
WORKDIR /app
COPY . .
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
EXPOSE 3000
CMD ["npm", "start"]
DOCKERFILE

cd /tmp/healthscribe-rebuild
docker build -f Dockerfile.simple -t healthscribe-selfhosted:latest . 2>&1 | tail -20
`);

    // Step 7: Deploy new container
    console.log('\n🚀 Step 7: Deploying new container...\n');
    await executeCommand(conn, `
docker stop healthscribe-app 2>/dev/null || true
docker rm healthscribe-app 2>/dev/null || true

docker run -d \\
  --name healthscribe-app \\
  --restart unless-stopped \\
  --network coolify \\
  healthscribe-selfhosted:latest

sleep 40

docker ps --filter "name=healthscribe-app" --format "table {{.Names}}\\t{{.Status}}"
`);

    // Step 8: Update Traefik
    console.log('\n🔀 Step 8: Updating Traefik routing...\n');
    await executeCommand(conn, `
APP_IP=\$(docker inspect healthscribe-app | grep -oP '"IPAddress": "\\K[0-9.]+' | grep -v "^$" | head -1)
echo "App IP: \$APP_IP"

cat > /data/coolify/proxy/dynamic/healthscribe.yaml <<EOF
http:
  routers:
    healthscribe-app:
      rule: "Host(\\\`healthscribe.pro\\\`)"
      service: healthscribe-app-service
      entryPoints:
        - https
      tls:
        certResolver: letsencrypt
  
  services:
    healthscribe-app-service:
      loadBalancer:
        servers:
          - url: "http://\${APP_IP}:3000"
EOF

docker kill -s HUP coolify-proxy
sleep 10

curl -sI https://healthscribe.pro | head -3
`);

    // Step 9: Final test
    console.log('\n✅ Step 9: Final system test...\n');
    await executeCommand(conn, `
TOKEN=\$(curl -s -X POST "https://supabase.healthscribe.pro/auth/v1/token?grant_type=password" \\
  -H "Content-Type: application/json" \\
  -H "apikey: eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJzdXBhYmFzZSIsImlhdCI6MTc1ODMyOTQwMCwiZXhwIjo0OTE0MDAzMDAwLCJyb2xlIjoiYW5vbiJ9.USAl15ClzSLfHwEYQn-bQQaZNz79FkDGUPsohnnEqJA" \\
  -d '{"email":"omars14@gmail.com","password":"Nomar123"}' | jq -r '.access_token')

echo "Testing transcriptions API..."
curl -s "https://healthscribe.pro/api/transcriptions" \\
  -H "Authorization: Bearer \$TOKEN" | jq '{success, count}'
`);

    console.log('\n' + '='.repeat(80));
    console.log('✅ REBUILD COMPLETE - TESTING IN BROWSER');
    console.log('='.repeat(80));
    console.log('');

    conn.end();

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

main();

