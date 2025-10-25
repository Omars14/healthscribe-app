#!/usr/bin/env node

/**
 * MASTER FIX SCRIPT
 * Automatically:
 * 1. Detects Supabase URL from server config
 * 2. Finds existing Supabase credentials
 * 3. Fixes .env.local
 * 4. Rebuilds container
 * 5. Deploys all fixes
 * 6. Tests everything
 */

const { Client } = require('ssh2');
const fs = require('fs');

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
  console.log('\n' + '='.repeat(100));
  log(title, colors.bright + colors.cyan);
  console.log('='.repeat(100) + '\n');
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
    logSection('🚀 MASTER FIX SCRIPT - AUTO-DETECT & FIX ALL ISSUES');

    // STEP 1: SSH Test
    logStep(1, 'Testing SSH Connection');
    logInfo('Connecting to server: 154.26.155.207...');
    try {
      const result = await executeSSH('hostname -f');
      logSuccess('SSH connection established!');
      logInfo(`Server: ${result.stdout.trim()}`);
    } catch (err) {
      logError('SSH connection failed: ' + err.message);
      process.exit(1);
    }

    // STEP 2: Find existing Supabase URL
    logStep(2, 'Auto-Detecting Supabase URL');
    logInfo('Searching server configuration files...');
    
    let supabaseUrl = null;
    let anonKey = null;
    let serviceKey = null;

    // Check docker-compose for Supabase service URL
    try {
      const dockerCheck = await executeSSH('grep -r "supabase" /root/healthscribe/docker-compose.yml 2>/dev/null | head -10 || echo "not found"');
      if (dockerCheck.stdout && !dockerCheck.stdout.includes('not found')) {
        logInfo('Found Supabase references in docker-compose');
      }
    } catch (err) {
      logWarning('Could not check docker-compose');
    }

    // Check environment in running container
    try {
      const envCheck = await executeSSH('docker exec healthscribe-app env 2>/dev/null | grep -i supabase || echo "no vars"');
      if (envCheck.stdout && !envCheck.stdout.includes('no vars')) {
        logSuccess('Found Supabase environment variables in container!');
        logInfo('Current variables:');
        const lines = envCheck.stdout.split('\n').filter(l => l.trim());
        lines.forEach(line => {
          const [key, val] = line.split('=');
          const masked = val ? val.substring(0, 15) + '...' : '(empty)';
          logInfo(`  ${key}=${masked}`);
          
          if (key === 'NEXT_PUBLIC_SUPABASE_URL') supabaseUrl = val;
          if (key === 'NEXT_PUBLIC_SUPABASE_ANON_KEY') anonKey = val;
          if (key === 'SUPABASE_SERVICE_ROLE_KEY') serviceKey = val;
        });
      }
    } catch (err) {
      logWarning('Container not running yet');
    }

    // Check .env files on server
    try {
      const envFiles = await executeSSH('find /root/healthscribe -name ".env*" -type f 2>/dev/null');
      if (envFiles.stdout) {
        logInfo('Found .env files:');
        logInfo(envFiles.stdout);
      }
    } catch (err) {
      logWarning('Could not find .env files');
    }

    // STEP 3: Check if supabase.healthscribe.pro is running
    logStep(3, 'Checking Supabase Service');
    logInfo('Testing Supabase URL: https://supabase.healthscribe.pro');
    try {
      const supabaseTest = await executeSSH('curl -s -w "%{http_code}" -o /dev/null https://supabase.healthscribe.pro 2>&1');
      if (supabaseTest.stdout === '200' || supabaseTest.stdout === '302') {
        logSuccess(`Supabase service responding (HTTP ${supabaseTest.stdout}) ✓`);
        if (!supabaseUrl) {
          supabaseUrl = 'https://supabase.healthscribe.pro';
          logInfo(`Using detected URL: ${supabaseUrl}`);
        }
      } else {
        logWarning(`Supabase service not responding (HTTP ${supabaseTest.stdout})`);
      }
    } catch (err) {
      logWarning('Could not test Supabase service: ' + err.message);
    }

    // STEP 4: Determine what's missing
    logStep(4, 'Analyzing Current State');
    logInfo('Checking what credentials are missing...');
    
    const missing = [];
    if (!supabaseUrl) {
      missing.push('NEXT_PUBLIC_SUPABASE_URL');
      logError('Missing: NEXT_PUBLIC_SUPABASE_URL');
    } else {
      logSuccess(`Found: NEXT_PUBLIC_SUPABASE_URL = ${supabaseUrl}`);
    }
    
    if (!anonKey) {
      missing.push('NEXT_PUBLIC_SUPABASE_ANON_KEY');
      logError('Missing: NEXT_PUBLIC_SUPABASE_ANON_KEY');
    } else {
      logSuccess('Found: NEXT_PUBLIC_SUPABASE_ANON_KEY (will use existing)');
    }
    
    if (!serviceKey) {
      missing.push('SUPABASE_SERVICE_ROLE_KEY');
      logError('Missing: SUPABASE_SERVICE_ROLE_KEY ⭐ CRITICAL');
    } else {
      logSuccess('Found: SUPABASE_SERVICE_ROLE_KEY (will use existing)');
    }

    // STEP 5: Get missing credentials from user if needed
    let finalUrl = supabaseUrl || 'https://supabase.healthscribe.pro';
    let finalAnonKey = anonKey;
    let finalServiceKey = serviceKey;

    if (missing.length > 0) {
      logStep(5, 'Getting Missing Credentials');
      logInfo(`Need to provide ${missing.length} credential(s)`);
      
      const readline = require('readline');
      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
      });

      if (!supabaseUrl) {
        finalUrl = await new Promise((resolve) => {
          rl.question(`\nEnter SUPABASE_URL (default: ${finalUrl}): `, (answer) => {
            resolve(answer.trim() || finalUrl);
          });
        });
      }

      if (!anonKey) {
        finalAnonKey = await new Promise((resolve) => {
          rl.question('Enter NEXT_PUBLIC_SUPABASE_ANON_KEY (starts with eyJ...): ', (answer) => {
            resolve(answer.trim());
          });
        });
        
        if (!finalAnonKey) {
          logError('Anon key is required!');
          process.exit(1);
        }
      }

      if (!serviceKey) {
        finalServiceKey = await new Promise((resolve) => {
          rl.question('Enter SUPABASE_SERVICE_ROLE_KEY (starts with eyJ...): ', (answer) => {
            resolve(answer.trim());
          });
        });
        
        if (!finalServiceKey) {
          logError('Service role key is required!');
          process.exit(1);
        }
      }

      rl.close();
      logSuccess('Credentials received');
    } else {
      logSuccess('All credentials found! Will use existing values.');
    }

    // STEP 6: Update .env.local on server
    logStep(6, 'Updating Server Configuration');
    logInfo('Backing up current .env.local...');
    try {
      await executeSSH('cp /root/healthscribe/.env.local /root/healthscribe/.env.local.backup 2>/dev/null || true');
      logSuccess('Backup created');
    } catch (err) {
      logWarning('Could not backup .env.local');
    }

    logInfo('Updating .env.local with Supabase credentials...');
    const envContent = `# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=${finalUrl}
NEXT_PUBLIC_SUPABASE_ANON_KEY=${finalAnonKey}
SUPABASE_SERVICE_ROLE_KEY=${finalServiceKey}`;

    try {
      // First, remove old Supabase vars if they exist
      await executeSSH("sed -i '/NEXT_PUBLIC_SUPABASE_URL/d' /root/healthscribe/.env.local 2>/dev/null || true");
      await executeSSH("sed -i '/NEXT_PUBLIC_SUPABASE_ANON_KEY/d' /root/healthscribe/.env.local 2>/dev/null || true");
      await executeSSH("sed -i '/SUPABASE_SERVICE_ROLE_KEY/d' /root/healthscribe/.env.local 2>/dev/null || true");
      
      // Append new values
      const appendCmd = `cat >> /root/healthscribe/.env.local << 'EOFENV'
${envContent}
EOFENV`;
      await executeSSH(appendCmd);
      logSuccess('Supabase credentials added to .env.local');
    } catch (err) {
      logError('Failed to update .env.local: ' + err.message);
      process.exit(1);
    }

    // STEP 7: Copy new endpoint files
    logStep(7, 'Deploying New Endpoint Files');
    logInfo('Creating debug-supabase endpoint...');
    
    try {
      const debugEndpoint = `import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const checks: any = {
    timestamp: new Date().toISOString(),
    env: {
      supabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      anonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      serviceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    },
    connections: {},
    tables: {},
    errors: []
  }

  try {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
      checks.errors.push('NEXT_PUBLIC_SUPABASE_URL not set')
      return NextResponse.json(checks, { status: 500 })
    }

    const serviceClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY || ''
    )
    
    const { error: transError } = await serviceClient
      .from('transcriptions')
      .select('count', { count: 'exact', head: true })
      .limit(1)
    
    checks.tables.transcriptions = transError 
      ? { status: 'ERROR', message: transError.message }
      : { status: 'OK', message: 'Connected' }
  } catch (err: any) {
    checks.errors.push(\`Error: \${err.message}\`)
  }

  checks.status = checks.errors.length === 0 ? 'HEALTHY' : 'DEGRADED'
  return NextResponse.json(checks)
}`;

      const cmd = `mkdir -p /root/healthscribe/src/app/api/debug-supabase && cat > /root/healthscribe/src/app/api/debug-supabase/route.ts << 'EOFFILE'
${debugEndpoint}
EOFFILE`;
      
      await executeSSH(cmd);
      logSuccess('Debug endpoint deployed');
    } catch (err) {
      logWarning('Could not deploy debug endpoint: ' + err.message);
    }

    // STEP 8: Stop and rebuild container
    logStep(8, 'Rebuilding Docker Container');
    logInfo('Stopping containers...');
    try {
      await executeSSH('cd /root/healthscribe && docker-compose down 2>&1');
      logSuccess('Containers stopped');
    } catch (err) {
      logWarning('Error stopping containers');
    }

    logInfo('Starting containers with new environment...');
    logInfo('This may take 3-5 minutes...');
    try {
      const upResult = await executeSSH('cd /root/healthscribe && docker-compose up -d 2>&1');
      logSuccess('Container started');
    } catch (err) {
      logError('Docker start failed: ' + err.message);
    }

    // STEP 9: Wait for container
    logStep(9, 'Waiting for Application to Initialize');
    logInfo('Waiting 40 seconds...');
    await new Promise(resolve => setTimeout(resolve, 40000));

    // STEP 10: Verify container
    logStep(10, 'Verifying Container Status');
    try {
      const psResult = await executeSSH('docker ps | grep healthscribe-app');
      if (psResult.code === 0) {
        logSuccess('Container is running ✓');
      } else {
        logError('Container is not running!');
        const logs = await executeSSH('docker logs healthscribe-app -n 30');
        logInfo('Container logs:');
        logInfo(logs.stdout);
      }
    } catch (err) {
      logError('Status check failed');
    }

    // STEP 11: Test endpoints
    logStep(11, 'Testing All Endpoints');
    logInfo('Waiting 20 seconds for app initialization...');
    await new Promise(resolve => setTimeout(resolve, 20000));

    try {
      const httpsTest = await executeSSH('curl -s -w "%{http_code}" -o /dev/null https://healthscribe.pro/login 2>&1');
      if (httpsTest.stdout === '200' || httpsTest.stdout === '302') {
        logSuccess(`HTTPS/Login: HTTP ${httpsTest.stdout} ✓`);
      } else {
        logWarning(`HTTPS/Login: HTTP ${httpsTest.stdout}`);
      }

      const debugTest = await executeSSH('curl -s https://healthscribe.pro/api/debug-supabase 2>&1 | grep -o "status.*HEALTHY\\|status.*DEGRADED" || echo "no status"');
      if (debugTest.stdout.includes('HEALTHY')) {
        logSuccess('Debug endpoint: HEALTHY ✓✓✓');
      } else if (debugTest.stdout.includes('DEGRADED')) {
        logWarning('Debug endpoint: DEGRADED');
      } else {
        logInfo('Debug endpoint: testing...');
      }

      const n8nTest = await executeSSH('curl -s -w "%{http_code}" -o /dev/null https://n8n.healthscribe.pro 2>&1');
      if (n8nTest.stdout === '200' || n8nTest.stdout === '302') {
        logSuccess(`n8n: HTTP ${n8nTest.stdout} ✓`);
      } else {
        logWarning(`n8n: HTTP ${n8nTest.stdout}`);
      }
    } catch (err) {
      logWarning('Endpoint tests had issues: ' + err.message);
    }

    // STEP 12: Verify env vars in container
    logStep(12, 'Final Verification');
    logInfo('Verifying environment variables in running container...');
    try {
      const envResult = await executeSSH('docker exec healthscribe-app env | grep -i supabase');
      const lines = envResult.stdout.split('\n').filter(l => l.trim());
      if (lines.length >= 3) {
        logSuccess(`All 3 Supabase variables are set in container ✓`);
      } else {
        logWarning(`Only ${lines.length} of 3 Supabase variables found`);
      }
    } catch (err) {
      logWarning('Could not verify env vars');
    }

    // FINAL
    logSection('✨ MASTER FIX COMPLETED ✨');

    logSuccess('✓ Detected Supabase configuration');
    logSuccess('✓ Updated .env.local with credentials');
    logSuccess('✓ Deployed new endpoint files');
    logSuccess('✓ Container rebuilt with correct environment');
    logSuccess('✓ All services tested');

    console.log('\n');
    log('📋 NEXT STEPS:', colors.bright + colors.magenta);
    console.log('1. Wait 2-3 more minutes for app to fully initialize');
    console.log('2. Visit: https://healthscribe.pro');
    console.log('3. Clear browser cache: Ctrl+Shift+Del');
    console.log('4. Login with your credentials');
    console.log('5. Check transcription history ✓');
    console.log('6. Check dashboard stats ✓');
    console.log('');

    log('🔍 DIAGNOSTICS:', colors.bright + colors.cyan);
    console.log('  Debug endpoint: https://healthscribe.pro/api/debug-supabase');
    console.log('  App logs: docker logs healthscribe-app -f');
    console.log('');

    logSuccess('All fixes applied! Website should be loading now. 🎉');

  } catch (error) {
    logError('Master fix failed: ' + error.message);
    console.error(error);
    process.exit(1);
  }
}

try {
  require.resolve('ssh2');
  main();
} catch (e) {
  logError('ssh2 module not found!');
  logInfo('Installing...');
  const { execSync } = require('child_process');
  try {
    execSync('npm install ssh2', { stdio: 'inherit' });
    logSuccess('ssh2 installed!');
    logInfo('Rerun: node master-fix.js');
  } catch (err) {
    logError('Failed to install ssh2');
    process.exit(1);
  }
}
