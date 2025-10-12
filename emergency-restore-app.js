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

    console.log('🚨 EMERGENCY APP RESTORE\n');
    console.log('=' .repeat(80) + '\n');

    // Step 1: Find existing images
    console.log('1️⃣ Finding existing Docker images...\n');
    await executeCommand(conn, `
docker images | grep -E "healthscribe|dashboard"
`);

    // Step 2: Find Coolify service
    console.log('\n2️⃣ Finding Coolify application service...\n');
    await executeCommand(conn, `
find /data/coolify/applications -name "docker-compose.yml" -o -name "Dockerfile" | head -5
`);

    // Step 3: Start container from existing image or Coolify
    console.log('\n3️⃣ Starting container...\n');
    await executeCommand(conn, `
# Try to find and use existing image
IMAGE=$(docker images --format "{{.Repository}}:{{.Tag}}" | grep -E "healthscribe|dashboard" | head -1)

if [ ! -z "$IMAGE" ]; then
    echo "Found image: $IMAGE"
    docker run -d \\
      --name healthscribe-app \\
      --network coolify \\
      -p 3000:3000 \\
      --restart unless-stopped \\
      $IMAGE
    echo "✅ Container started from existing image"
else
    echo "No existing image found, looking for Coolify service..."
    
    # Find Coolify service directory
    SERVICE_DIR=$(find /data/coolify/applications -type d -name "*dashboard*" -o -name "*healthscribe*" | head -1)
    
    if [ ! -z "$SERVICE_DIR" ]; then
        echo "Found service dir: $SERVICE_DIR"
        cd "$SERVICE_DIR"
        
        # Try docker-compose
        if [ -f "docker-compose.yml" ]; then
            docker-compose up -d
            echo "✅ Started via docker-compose"
        else
            echo "No docker-compose.yml found"
        fi
    else
        echo "Could not find Coolify service"
    fi
fi

sleep 5
`);

    // Step 4: Check status
    console.log('\n4️⃣ Checking application status...\n');
    await executeCommand(conn, `
docker ps -f name=healthscribe --format "table {{.Names}}\\t{{.Status}}\\t{{.Ports}}"
docker ps -f name=dashboard --format "table {{.Names}}\\t{{.Status}}\\t{{.Ports}}"
`);

    // Step 5: Test
    console.log('\n5️⃣ Testing application...\n');
    await executeCommand(conn, `
sleep 5
curl -s -I https://healthscribe.pro | grep HTTP
`);

    console.log('\n' + '='.repeat(80));
    console.log('STATUS CHECK');
    console.log('='.repeat(80) + '\n');

    conn.end();

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

main();

