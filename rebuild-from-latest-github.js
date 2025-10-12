#!/usr/bin/env node

const { Client } = require('ssh2');

const SSH_CONFIG = {
  host: '154.26.155.207',
  port: 22,
  username: 'root',
  password: 'Nomar123'
};

const GITHUB_REPO = 'https://github.com/Omars14/healthscribe-app.git';
const BUILD_DIR = '/root/healthscribe-build';
const APP_DIR = '/data/coolify/applications/tkwoos4soccckws84088wc04';

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

    console.log('🔧 REBUILDING FROM LATEST GITHUB CODE\n');
    console.log('=' .repeat(80) + '\n');

    console.log('1️⃣ Cloning/updating repository from GitHub...\n');
    await executeCommand(conn, `
if [ -d "${BUILD_DIR}" ]; then
  echo "Updating existing repository..."
  cd ${BUILD_DIR}
  git fetch origin
  git reset --hard origin/master
  git pull origin master
else
  echo "Cloning fresh repository..."
  git clone ${GITHUB_REPO} ${BUILD_DIR}
  cd ${BUILD_DIR}
fi

echo "✅ Source code ready"
echo ""
echo "Latest commits:"
git log --oneline -5
`);

    console.log('\n2️⃣ Building Docker image with environment variables...\n');
    await executeCommand(conn, `
cd ${BUILD_DIR}

# Load environment variables from Coolify
export $(cat ${APP_DIR}/.env | grep -v '^#' | grep -v '^$' | xargs)

echo "Building with environment:"
echo "NEXT_PUBLIC_SUPABASE_URL: $NEXT_PUBLIC_SUPABASE_URL"
echo "N8N_WEBHOOK_URL: $N8N_WEBHOOK_URL"

# Build Docker image with all required build args
docker build \\
  --build-arg NEXT_PUBLIC_SUPABASE_URL="$NEXT_PUBLIC_SUPABASE_URL" \\
  --build-arg NEXT_PUBLIC_SUPABASE_ANON_KEY="$NEXT_PUBLIC_SUPABASE_ANON_KEY" \\
  --build-arg SUPABASE_SERVICE_ROLE_KEY="$SUPABASE_SERVICE_ROLE_KEY" \\
  --build-arg N8N_WEBHOOK_URL="$N8N_WEBHOOK_URL" \\
  --build-arg NEXT_PUBLIC_N8N_WEBHOOK_URL="$NEXT_PUBLIC_N8N_WEBHOOK_URL" \\
  --build-arg NEXT_PUBLIC_URL="$NEXT_PUBLIC_URL" \\
  --build-arg NEXT_PUBLIC_API_URL="$NEXT_PUBLIC_API_URL" \\
  --build-arg NEXT_PUBLIC_SITE_URL="$NEXT_PUBLIC_SITE_URL" \\
  --no-cache \\
  -t healthscribe-new:latest \\
  -f Dockerfile \\
  .

echo "✅ Docker image built successfully"
`);

    console.log('\n3️⃣ Updating docker-compose configuration...\n');
    await executeCommand(conn, `
cd ${APP_DIR}

# Backup current docker-compose
cp docker-compose.yaml docker-compose.yaml.backup-$(date +%s)

# Update image name
sed -i "s|image: 'healthscribe-[^']*'|image: 'healthscribe-new:latest'|g" docker-compose.yaml

echo "✅ docker-compose.yaml updated"
grep "image:" docker-compose.yaml
`);

    console.log('\n4️⃣ Stopping old container...\n');
    await executeCommand(conn, `
cd ${APP_DIR}
docker compose down
sleep 5
echo "✅ Old container stopped"
`);

    console.log('\n5️⃣ Starting new container with fresh code...\n');
    await executeCommand(conn, `
cd ${APP_DIR}
docker compose up -d
echo "✅ New container started"
`);

    console.log('\n6️⃣ Waiting for application to be ready (may take 60 seconds)...\n');
    let ready = false;
    for (let i = 0; i < 30; i++) {
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      try {
        const logs = await executeCommand(conn, `
docker logs tkwoos4soccckws84088wc04-184252873467 --tail 10 2>&1 | grep -i "ready"
`);
        
        if (logs.includes('Ready')) {
          console.log(`\n✅ Application is READY!\n`);
          ready = true;
          break;
        } else {
          console.log(`⏳ Waiting... (${(i + 1) * 2}s)`);
        }
      } catch (e) {
        console.log(`⏳ Building/starting... (${(i + 1) * 2}s)`);
      }
    }

    if (!ready) {
      console.log('\n⚠️  Application may still be starting. Check logs manually.');
    }

    console.log('\n7️⃣ Verifying deployment...\n');
    await executeCommand(conn, `
echo "Container status:"
docker ps | grep tkwoos4soccckws84088wc04

echo ""
echo "Recent logs:"
docker logs tkwoos4soccckws84088wc04-184252873467 --tail 20 2>&1
`);

    console.log('\n\n' + '='.repeat(80));
    console.log('✅✅✅ REBUILD FROM GITHUB COMPLETE! ✅✅✅');
    console.log('='.repeat(80));
    console.log('\n🎯 CRITICAL NEXT STEPS:');
    console.log('');
    console.log('1. Open INCOGNITO window (this is CRITICAL!)');
    console.log('2. Go to: https://healthscribe.pro');
    console.log('3. Login: omars14@gmail.com / Nomar123');
    console.log('4. Navigate to Transcriptionist Workspace');
    console.log('5. Open console (F12)');
    console.log('6. Upload a file');
    console.log('');
    console.log('✅ You should see:');
    console.log('   "Uploading file via API route (bypasses RLS)..."');
    console.log('');
    console.log('❌ If you still see old code:');
    console.log('   Try a completely different browser');
    console.log('');

    conn.end();

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

main();

