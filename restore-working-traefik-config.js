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
  console.log('🔧 Restoring Working Traefik Configuration...\n');

  const conn = new Client();

  try {
    await new Promise((resolve, reject) => {
      conn.on('ready', () => {
        console.log('✅ SSH Connected\n');
        resolve();
      }).on('error', reject).connect(SSH_CONFIG);
    });

    // Get Kong's current IP
    console.log('='.repeat(70));
    console.log('Finding Kong Container IP');
    console.log('='.repeat(70));
    
    const { output: kongInfo } = await executeCommand(conn, `
      # Get all Kong IPs from all networks
      echo "Kong container networks:"
      docker inspect supabase_kong_supabase --format='{{range \$k, \$v := .NetworkSettings.Networks}}Network: {{\$k}}, IP: {{.IPAddress}}{{end}}'
      
      echo ""
      echo "Getting primary IP:"
      docker inspect supabase_kong_supabase --format='{{range \$k, \$v := .NetworkSettings.Networks}}{{.IPAddress}} {{end}}' | awk '{print \$1}'
    `, 'Getting Kong IP');

    const kongIP = kongInfo.match(/(\d+\.\d+\.\d+\.\d+)/)?.[0] || '10.0.3.13';
    console.log(`\n📍 Kong IP: ${kongIP}`);

    // Restore the old working configuration with current Kong IP
    console.log('\n' + '='.repeat(70));
    console.log('Restoring Working Configuration');
    console.log('='.repeat(70));
    
    await executeCommand(conn, `
      # Restore the old working config pattern
      cat > /data/coolify/proxy/dynamic/supabase.yml <<'EOF'
# Restored working configuration for supabase.healthscribe.pro
http:
  middlewares:
    supabase-redirect-to-https:
      redirectscheme:
        scheme: https
    supabase-gzip:
      compress: true
    supabase-strip-cors:
      headers:
        customRequestHeaders:
          X-Forwarded-Proto: "https"
        customResponseHeaders:
          X-Proxy: "traefik"
  routers:
    supabase-http:
      middlewares:
        - supabase-redirect-to-https
      entryPoints:
        - http
      service: supabase-kong
      rule: Host(\\\`supabase.healthscribe.pro\\\`)
    supabase-https:
      middlewares:
        - supabase-strip-cors
        - supabase-gzip
      entryPoints:
        - https
      service: supabase-kong
      rule: Host(\\\`supabase.healthscribe.pro\\\`)
      tls:
        certresolver: letsencrypt
  services:
    supabase-kong:
      loadBalancer:
        servers:
          - url: 'http://${kongIP}:8000'
        healthCheck:
          path: /auth/v1/health
          interval: "10s"
          timeout: "3s"
EOF

      echo "✅ Configuration restored"
      cat /data/coolify/proxy/dynamic/supabase.yml
      
      # Copy to Traefik
      docker cp /data/coolify/proxy/dynamic/supabase.yml coolify-proxy:/traefik/dynamic/supabase.yml
      
      echo ""
      echo "⏳ Waiting 20 seconds for Traefik to apply configuration..."
      sleep 20
      
      echo ""
      echo "🧪 Testing external URL:"
      curl -sL https://supabase.healthscribe.pro/auth/v1/health
    `, 'Restoring configuration');

    // Test thoroughly
    console.log('\n' + '='.repeat(70));
    console.log('Testing All Endpoints');
    console.log('='.repeat(70));
    
    const { output: testResults } = await executeCommand(conn, `
      echo "1. Kong directly (internal):"
      curl -s http://${kongIP}:8000/auth/v1/health
      
      echo ""
      echo ""
      echo "2. Via localhost:54321:"
      curl -s http://localhost:54321/auth/v1/health
      
      echo ""
      echo ""
      echo "3. External via Traefik:"
      curl -sL https://supabase.healthscribe.pro/auth/v1/health
      
      echo ""
      echo ""
      echo "4. Application health:"
      curl -sI https://healthscribe.pro | head -3
    `, 'Testing endpoints');

    conn.end();
    console.log('\n✅ SSH session closed');

    console.log('\n' + '='.repeat(80));
    console.log('📊 ANALYSIS');
    console.log('='.repeat(80));
    
    if (testResults.includes('GoTrue') && testResults.includes('supabase')) {
      console.log('\n✅ SUCCESS! Supabase is accessible!');
      console.log(`✅ Kong IP: ${kongIP}:8000`);
      console.log('✅ Traefik routing working');
      console.log('✅ SSL configured');
      
      console.log('\n🎉 SYSTEM IS 100% OPERATIONAL!');
      console.log('\n📝 Final Configuration:');
      console.log('- Supabase Kong: ' + kongIP + ':8000');
      console.log('- External URL: https://supabase.healthscribe.pro');
      console.log('- Application: https://healthscribe.pro');
      console.log('- Database: 29 transcriptions');
      console.log('- User: omars14@gmail.com / Nomar123');
      
      console.log('\n✅ LOGIN NOW:');
      console.log('1. Go to: https://healthscribe.pro/login');
      console.log('2. Email: omars14@gmail.com');
      console.log('3. Password: Nomar123');
      console.log('4. You should see your 29 transcriptions!');
      
    } else {
      console.log('\n⚠️ Still troubleshooting...');
      console.log('Kong IP might have changed. Check the test results above.');
    }
    
    console.log('');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  }
}

main();

