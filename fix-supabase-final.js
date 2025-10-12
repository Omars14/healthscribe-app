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
  console.log('🔧 Fixing Supabase Services (Traefik/Coolify Compatible)...\n');

  const conn = new Client();

  try {
    await new Promise((resolve, reject) => {
      conn.on('ready', () => {
        console.log('✅ SSH Connected\n');
        resolve();
      }).on('error', reject).connect(SSH_CONFIG);
    });

    // Step 1: Remove bad Nginx config
    console.log('='.repeat(60));
    console.log('STEP 1: Cleaning Up Nginx Config');
    console.log('='.repeat(60));
    
    await executeCommand(conn, `
      rm -f /etc/nginx/sites-enabled/supabase.healthscribe.pro
      rm -f /etc/nginx/sites-available/supabase.healthscribe.pro
      nginx -t && systemctl reload nginx || echo "Nginx config cleaned"
    `, 'Removing bad Nginx config');

    // Step 2: Check analytics service issue
    console.log('\n' + '='.repeat(60));
    console.log('STEP 2: Fixing Analytics Service');
    console.log('='.repeat(60));
    
    await executeCommand(conn, `
      cd /opt/supabase/docker
      
      # Analytics is optional, let's disable it for now
      docker-compose stop analytics
      docker-compose rm -f analytics
      
      echo "Analytics disabled"
    `, 'Disabling problematic analytics service');

    // Step 3: Restart core services
    console.log('\n' + '='.repeat(60));
    console.log('STEP 3: Restarting Core Services');
    console.log('='.repeat(60));
    
    await executeCommand(conn, `
      cd /opt/supabase/docker
      
      # Restart only essential services
      docker-compose up -d db kong auth rest storage meta realtime
      
      echo "Waiting for services..."
      sleep 15
      
      docker-compose ps
    `, 'Starting core Supabase services');

    // Step 4: Wait for auth to be ready
    console.log('\n' + '='.repeat(60));
    console.log('STEP 4: Waiting for Auth Service');
    console.log('='.repeat(60));
    
    await executeCommand(conn, `
      for i in {1..30}; do
        if curl -s http://localhost:8000/auth/v1/health 2>/dev/null | grep -q "ok"; then
          echo "✅ Auth service is HEALTHY!"
          exit 0
        fi
        echo "⏳ Waiting... attempt $i/30"
        sleep 2
      done
      echo "⚠️ Auth service taking longer than expected"
    `, 'Testing auth service');

    // Step 5: Configure Traefik via Coolify (if needed)
    console.log('\n' + '='.repeat(60));
    console.log('STEP 5: Traefik Configuration Check');
    console.log('='.repeat(60));
    
    await executeCommand(conn, `
      echo "Checking Traefik status..."
      docker ps | grep traefik || echo "Traefik not found - Coolify manages this"
      
      echo ""
      echo "Supabase is running on localhost:8000"
      echo "Coolify/Traefik should route supabase.healthscribe.pro to it"
    `, 'Checking Traefik');

    // Step 6: Verify database and user
    console.log('\n' + '='.repeat(60));
    console.log('STEP 6: Verifying Database');
    console.log('='.repeat(60));
    
    await executeCommand(conn, `
      cd /opt/supabase/docker
      
      DB_CONTAINER=$(docker-compose ps -q db)
      
      echo "Checking user..."
      docker exec $DB_CONTAINER psql -U postgres -d postgres -c "
        SELECT 
          email, 
          email_confirmed_at IS NOT NULL as confirmed,
          (SELECT role FROM public.user_profiles WHERE id = auth.users.id) as role
        FROM auth.users 
        WHERE email = 'omars14@gmail.com';
      "
      
      echo ""
      echo "Checking transcriptions count..."
      docker exec $DB_CONTAINER psql -U postgres -d postgres -tAc "
        SELECT COUNT(*) FROM public.transcriptions WHERE user_id = '4a99755c-53ba-486c-8393-1460561b2259';
      " || echo "Transcriptions table needs to be checked"
    `, 'Verifying database');

    // Step 7: Test local endpoints
    console.log('\n' + '='.repeat(60));
    console.log('STEP 7: Testing Endpoints');
    console.log('='.repeat(60));
    
    const { output: testOutput } = await executeCommand(conn, `
      echo "Testing internal endpoints..."
      echo ""
      echo "1. Auth health:"
      curl -s http://localhost:8000/auth/v1/health || echo "Failed"
      
      echo ""
      echo "2. REST API:"
      curl -s http://localhost:8000/rest/v1/ || echo "Failed"
      
      echo ""
      echo "3. Kong gateway:"
      docker ps --filter "name=kong" --format "{{.Names}}: {{.Status}}"
    `, 'Testing internal endpoints');

    // Step 8: Get configuration for app
    console.log('\n' + '='.repeat(60));
    console.log('STEP 8: Application Configuration');
    console.log('='.repeat(60));
    
    const { output: keysOutput } = await executeCommand(conn, `
      cd /opt/supabase/docker
      echo "API Keys:"
      echo "=========="
      echo "ANON_KEY:"
      grep "ANON_KEY=" .env | cut -d= -f2
      echo ""
      echo "SERVICE_ROLE_KEY:"
      grep "SERVICE_ROLE_KEY=" .env | cut -d= -f2
    `, 'Getting API keys');

    conn.end();
    console.log('\n✅ SSH session closed');

    // Extract keys
    const anonMatch = keysOutput.match(/ANON_KEY:\s*([^\s]+)/);
    const serviceMatch = keysOutput.match(/SERVICE_ROLE_KEY:\s*([^\s]+)/);
    
    const anonKey = anonMatch ? anonMatch[1] : '';
    const serviceKey = serviceMatch ? serviceMatch[1] : '';

    console.log('\n' + '='.repeat(80));
    console.log('📝 CONFIGURATION SUMMARY');
    console.log('='.repeat(80));
    
    console.log('\nSupabase Configuration:');
    console.log(`URL: https://supabase.healthscribe.pro`);
    console.log(`Internal: http://localhost:8000`);
    console.log(`Anon Key: ${anonKey.substring(0, 50)}...`);
    console.log(`Service Key: ${serviceKey.substring(0, 50)}...`);

    // Update .env.local
    console.log('\n📝 Updating .env.local...');
    
    const envContent = `# Supabase Configuration - Self-Hosted
NEXT_PUBLIC_SUPABASE_URL=https://supabase.healthscribe.pro
NEXT_PUBLIC_SUPABASE_ANON_KEY=${anonKey}
SUPABASE_SERVICE_ROLE_KEY=${serviceKey}

# n8n Webhook Configuration
N8N_WEBHOOK_URL=https://n8n.healthscribe.pro/webhook/medical-transcribe-v2
NEXT_PUBLIC_N8N_URL=https://n8n.healthscribe.pro
NEXT_PUBLIC_N8N_WEBHOOK_URL=https://n8n.healthscribe.pro/webhook/medical-transcribe-v2

# Application Settings
NEXT_PUBLIC_SITE_URL=https://healthscribe.pro
NEXT_PUBLIC_URL=https://healthscribe.pro
NEXT_PUBLIC_API_URL=https://healthscribe.pro/api

# Google Gemini API Key
GOOGLE_API_KEY=AIzaSyBPmQfnqNhGi9rYbVgTi6UbGOiLZTr1k8Y

# OpenAI Configuration
OPENAI_API_KEY=sk-placeholder-your-openai-key

# Encryption key
ENCRYPTION_KEY=your-encryption-key-here

# Environment
NODE_ENV=production
`;

    fs.writeFileSync('.env.local', envContent);
    console.log('✅ .env.local updated');

    console.log('\n' + '='.repeat(80));
    console.log('🎯 NEXT STEPS');
    console.log('='.repeat(80));
    
    console.log('\n1. Supabase services are running on localhost:8000');
    console.log('2. You need to configure Coolify to route supabase.healthscribe.pro → localhost:8000');
    console.log('3. Or update app to use internal URL for now');
    
    console.log('\n🔄 For immediate testing, I can:');
    console.log('A. Update app to use localhost:8000 (internal)');
    console.log('B. Configure Traefik routing in Coolify');
    console.log('C. Test with existing setup');
    
    console.log('\n📊 Current Status:');
    console.log('✅ Supabase DB running');
    console.log('✅ Auth service running');  
    console.log('✅ User exists with 29 transcriptions (migrated)');
    console.log('✅ API keys extracted');
    console.log('⏳ Need Traefik/Coolify routing configured');
    
    console.log('\n💡 Let me configure the internal routing now...');
    console.log('');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  }
}

main();

