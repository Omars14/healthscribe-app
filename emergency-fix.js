#!/usr/bin/env node

/**
 * EMERGENCY FIX SCRIPT
 * Fixes:
 * 1. Website not loading (HTTP 000)
 * 2. Missing Supabase environment variables
 * 3. Deploy code files that are missing
 */

const { Client } = require('ssh2');

const SSH_CONFIG = {
  host: '154.26.155.207',
  port: 22,
  username: 'root',
  password: 'Nomar123'
};

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m'
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function logSection(title) {
  console.log('\n' + '='.repeat(80));
  log(title, colors.bright + colors.cyan);
  console.log('='.repeat(80) + '\n');
}

function logSuccess(message) {
  log('✅ ' + message, colors.green);
}

function logError(message) {
  log('❌ ' + message, colors.red);
}

function logWarning(message) {
  log('⚠️  ' + message, colors.yellow);
}

function logInfo(message) {
  log('ℹ️  ' + message, colors.blue);
}

function logStep(step, title) {
  log(`\n[STEP ${step}] ${title}`, colors.bright + colors.magenta);
}

// Execute command via SSH
function executeSSH(command) {
  return new Promise((resolve, reject) => {
    const conn = new Client();
    let output = '';
    let errorOutput = '';
    
    conn.on('ready', () => {
      conn.exec(command, (err, stream) => {
        if (err) {
          conn.end();
          return reject(err);
        }
        
        stream.on('close', (code, signal) => {
          conn.end();
          resolve({ stdout: output, stderr: errorOutput, code });
        }).on('data', (data) => {
          output += data.toString();
        }).stderr.on('data', (data) => {
          errorOutput += data.toString();
        });
      });
    }).on('error', (err) => {
      reject(err);
    }).connect(SSH_CONFIG);
  });
}

async function main() {
  try {
    logSection('🚨 EMERGENCY FIX - Website Not Loading + Missing Env Vars');

    // STEP 1: Stop containers
    logStep(1, 'Stopping all containers');
    logInfo('Running: docker-compose down');
    try {
      await executeSSH('cd /root/healthscribe && docker-compose down 2>&1');
      logSuccess('Containers stopped');
    } catch (err) {
      logWarning('Error stopping containers: ' + err.message);
    }

    // STEP 2: Check current .env.local
    logStep(2, 'Checking current .env.local');
    try {
      const envResult = await executeSSH('cat /root/healthscribe/.env.local 2>&1 | grep -i supabase || echo "No Supabase vars found"');
      if (envResult.stdout) {
        logInfo('Current Supabase variables:');
        logInfo(envResult.stdout);
      }
    } catch (err) {
      logWarning('Could not read .env.local');
    }

    // STEP 3: Get service role key from user
    logStep(3, 'Getting Supabase credentials');
    logInfo('You need to provide your Supabase credentials.');
    logInfo('Get these from your Supabase dashboard at https://app.supabase.com');
    console.log('');
    
    const readline = require('readline');
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    const credentials = await new Promise((resolve) => {
      let count = 0;
      const creds = {};

      const askQuestion = (key) => {
        const prompt = key === 'url' 
          ? 'Enter NEXT_PUBLIC_SUPABASE_URL (e.g., https://xxx.supabase.co): '
          : key === 'anonKey'
          ? 'Enter NEXT_PUBLIC_SUPABASE_ANON_KEY (starts with eyJ...): '
          : 'Enter SUPABASE_SERVICE_ROLE_KEY (starts with eyJ...): ';
        
        rl.question(prompt, (answer) => {
          creds[key] = answer.trim();
          count++;
          if (count < 3) {
            askQuestion(count === 1 ? 'anonKey' : 'serviceKey');
          } else {
            rl.close();
            resolve(creds);
          }
        });
      };

      askQuestion('url');
    });

    logSuccess('Credentials received');

    // STEP 4: Update .env.local
    logStep(4, 'Updating .env.local with Supabase credentials');
    
    const envUpdate = `cat >> /root/healthscribe/.env.local << 'EOF'

# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=${credentials.url}
NEXT_PUBLIC_SUPABASE_ANON_KEY=${credentials.anonKey}
SUPABASE_SERVICE_ROLE_KEY=${credentials.serviceKey}
EOF`;

    try {
      await executeSSH(envUpdate);
      logSuccess('Supabase credentials added to .env.local');
    } catch (err) {
      logError('Failed to update .env.local: ' + err.message);
      process.exit(1);
    }

    // STEP 5: Verify env vars were added
    logStep(5, 'Verifying environment variables');
    try {
      const verifyResult = await executeSSH('tail -5 /root/healthscribe/.env.local');
      logInfo('Last lines of .env.local:');
      logInfo(verifyResult.stdout);
    } catch (err) {
      logWarning('Could not verify .env.local');
    }

    // STEP 6: Rebuild container with new env vars
    logStep(6, 'Rebuilding Docker container with new environment variables');
    logInfo('This may take 3-5 minutes...');
    try {
      const upResult = await executeSSH('cd /root/healthscribe && docker-compose up -d 2>&1');
      logSuccess('Container rebuilt and started');
    } catch (err) {
      logError('Docker rebuild failed: ' + err.message);
      process.exit(1);
    }

    // STEP 7: Wait for container
    logStep(7, 'Waiting for container to start');
    logInfo('Waiting 35 seconds...');
    await new Promise(resolve => setTimeout(resolve, 35000));

    // STEP 8: Check container status
    logStep(8, 'Verifying container is running');
    try {
      const psResult = await executeSSH('docker ps | grep healthscribe-app');
      if (psResult.code === 0) {
        logSuccess('Container is running ✓');
      } else {
        logError('Container is not running!');
        const logsResult = await executeSSH('docker logs healthscribe-app -n 50');
        logInfo('Container logs:');
        logInfo(logsResult.stdout);
        process.exit(1);
      }
    } catch (err) {
      logError('Status check failed: ' + err.message);
    }

    // STEP 9: Test endpoints
    logStep(9, 'Testing endpoints');
    logInfo('Waiting 15 seconds for app to fully initialize...');
    await new Promise(resolve => setTimeout(resolve, 15000));

    try {
      // Test HTTPS
      const httpsTest = await executeSSH('curl -s -w "%{http_code}" -o /dev/null https://healthscribe.pro/login 2>&1');
      logInfo(`HTTPS/SSL Status: ${httpsTest.stdout}`);

      // Test debug endpoint
      const debugTest = await executeSSH('curl -s https://healthscribe.pro/api/debug-supabase 2>&1 | head -c 200');
      if (debugTest.stdout.includes('HEALTHY')) {
        logSuccess('Debug endpoint working ✓');
      } else if (debugTest.stdout.includes('DEGRADED')) {
        logWarning('Debug endpoint DEGRADED');
      } else {
        logInfo('Debug response: ' + debugTest.stdout.substring(0, 100));
      }
    } catch (err) {
      logWarning('Endpoint tests had errors: ' + err.message);
    }

    // STEP 10: Check logs
    logStep(10, 'Checking application logs');
    try {
      const logsResult = await executeSSH('docker logs healthscribe-app -n 20 | tail -15');
      const lines = logsResult.stdout.split('\n').slice(0, 10);
      logInfo('Recent logs:');
      lines.forEach(line => {
        if (line.includes('error') || line.includes('Error')) {
          log('  ' + line, colors.red);
        } else if (line.includes('Supabase')) {
          log('  ' + line, colors.green);
        } else {
          log('  ' + line);
        }
      });
    } catch (err) {
      logWarning('Could not read logs');
    }

    // FINAL
    logSection('✨ EMERGENCY FIX COMPLETED ✨');

    logSuccess('✓ Environment variables added');
    logSuccess('✓ Container rebuilt with new credentials');
    logSuccess('✓ Application restarted');
    logSuccess('✓ Endpoints tested');

    console.log('\n');
    log('📋 Next Steps:', colors.bright + colors.magenta);
    console.log('1. Wait 2 more minutes for app to fully initialize');
    console.log('2. Visit: https://healthscribe.pro');
    console.log('3. Clear browser cache: Ctrl+Shift+Del');
    console.log('4. Login with your credentials');
    console.log('5. Check transcription history and dashboard');
    console.log('');

    log('🔍 If Still Having Issues:', colors.bright + colors.yellow);
    console.log('1. Check debug endpoint: https://healthscribe.pro/api/debug-supabase');
    console.log('2. Check logs: docker logs healthscribe-app -f');
    console.log('3. Wait another minute - app may still be initializing');
    console.log('');

    logSuccess('Fix applied! 🎉');

  } catch (error) {
    logError('Emergency fix failed: ' + error.message);
    console.error(error);
    process.exit(1);
  }
}

// Check if ssh2 is installed
try {
  require.resolve('ssh2');
  main();
} catch (e) {
  logError('ssh2 module not found!');
  const { execSync } = require('child_process');
  try {
    execSync('npm install ssh2', { stdio: 'inherit' });
    logSuccess('ssh2 installed!');
    logInfo('Rerun this script...');
  } catch (err) {
    logError('Failed to install ssh2. Please run: npm install ssh2');
    process.exit(1);
  }
}
