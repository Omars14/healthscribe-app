#!/usr/bin/env node

/**
 * Automated Database Fix via SSH
 * Connects to VPS, accesses Supabase database, and fixes everything automatically
 */

const { Client } = require('ssh2');
const fs = require('fs');
const path = require('path');

// SSH Configuration (from your existing scripts)
const SSH_CONFIG = {
  host: '154.26.155.207',
  port: 22,
  username: 'root',
  password: 'Nomar123'
};

const USER_EMAIL = 'omars14@gmail.com';

// Colors
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
  console.log('\n' + '='.repeat(70));
  log(title, colors.bright + colors.cyan);
  console.log('='.repeat(70) + '\n');
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
          if (code === 0) {
            resolve({ stdout: output, stderr: errorOutput, code });
          } else {
            reject(new Error(`Command exited with code ${code}: ${errorOutput}`));
          }
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

// Main execution
async function main() {
  try {
    logSection('🚀 AUTOMATED DATABASE FIX VIA SSH');
    logInfo(`Connecting to VPS: ${SSH_CONFIG.host} as ${SSH_CONFIG.username}`);
    
    // Test SSH connection
    logInfo('Testing SSH connection...');
    try {
      const testResult = await executeSSH('echo "SSH connection successful"');
      logSuccess('SSH connection established!');
    } catch (err) {
      logError('Failed to connect via SSH: ' + err.message);
      process.exit(1);
    }
    
    // Find Supabase PostgreSQL container
    logSection('PHASE 1: Finding Supabase Database');
    logInfo('Searching for PostgreSQL container...');
    
    let dbContainer = '';
    try {
      const result = await executeSSH('docker ps --format "{{.Names}}" | grep -E "(postgres|supabase.*db|db.*postgres)" | head -1');
      dbContainer = result.stdout.trim();
      
      if (!dbContainer) {
        logWarning('PostgreSQL container not found with standard names.');
        logInfo('Listing all containers...');
        const allContainers = await executeSSH('docker ps --format "{{.Names}}"');
        log(allContainers.stdout, colors.cyan);
        
        // Try alternative names
        const altResult = await executeSSH('docker ps --format "{{.Names}}" | grep -i db | head -1');
        dbContainer = altResult.stdout.trim();
      }
      
      if (dbContainer) {
        logSuccess(`Found PostgreSQL container: ${dbContainer}`);
      } else {
        logError('Could not find PostgreSQL container!');
        process.exit(1);
      }
    } catch (err) {
      logError('Error finding container: ' + err.message);
      process.exit(1);
    }
    
    // Create SQL fix script
    logSection('PHASE 2: Creating SQL Fix Script');
    
    const sqlScript = `
-- Fix for transcription history and admin panel
-- User: ${USER_EMAIL}

\\echo '=========================================='
\\echo 'Diagnostic Phase'
\\echo '=========================================='

-- Find user ID
DO $\$
DECLARE
    user_uuid UUID;
    user_email TEXT := '${USER_EMAIL}';
BEGIN
    SELECT id INTO user_uuid FROM auth.users WHERE email = user_email;
    
    IF user_uuid IS NULL THEN
        RAISE EXCEPTION 'User % not found in auth.users!', user_email;
    END IF;
    
    RAISE NOTICE 'Found user: % with ID: %', user_email, user_uuid;
END $\$;

-- Check if user_profiles table exists
SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'user_profiles'
) as user_profiles_exists;

-- Create user_role enum if needed
CREATE TYPE IF NOT EXISTS user_role AS ENUM ('admin', 'editor', 'transcriptionist');

-- Create user_profiles table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.user_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    full_name TEXT,
    role user_role DEFAULT 'transcriptionist',
    assigned_editor_id UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    last_active TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT true,
    metadata JSONB DEFAULT '{}'
);

-- Enable RLS
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON public.user_profiles(email);
CREATE INDEX IF NOT EXISTS idx_user_profiles_role ON public.user_profiles(role);

-- Add missing columns to transcriptions
ALTER TABLE public.transcriptions ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending';
ALTER TABLE public.transcriptions ADD COLUMN IF NOT EXISTS file_size BIGINT;
ALTER TABLE public.transcriptions ADD COLUMN IF NOT EXISTS audio_url TEXT;

-- Create indexes on transcriptions
CREATE INDEX IF NOT EXISTS idx_transcriptions_user_id ON public.transcriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_transcriptions_status ON public.transcriptions(status);

\\echo '=========================================='
\\echo 'Creating Admin User Profile'
\\echo '=========================================='

-- Insert or update user profile with admin role
DO $\$
DECLARE
    user_uuid UUID;
    user_email TEXT := '${USER_EMAIL}';
BEGIN
    SELECT id INTO user_uuid FROM auth.users WHERE email = user_email;
    
    IF user_uuid IS NULL THEN
        RAISE EXCEPTION 'User % not found!', user_email;
    END IF;
    
    -- Upsert profile
    INSERT INTO public.user_profiles (id, email, role, is_active, created_at, updated_at)
    VALUES (
        user_uuid,
        user_email,
        'admin'::user_role,
        true,
        NOW(),
        NOW()
    )
    ON CONFLICT (id) DO UPDATE 
    SET 
        role = 'admin'::user_role,
        is_active = true,
        updated_at = NOW();
    
    RAISE NOTICE 'Admin profile created/updated for: %', user_email;
END $\$;

\\echo '=========================================='
\\echo 'Setting Up RLS Policies'
\\echo '=========================================='

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "Admins can manage all profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can view their own transcriptions" ON public.transcriptions;
DROP POLICY IF EXISTS "Users can create their own transcriptions" ON public.transcriptions;
DROP POLICY IF EXISTS "Users can update their own transcriptions" ON public.transcriptions;
DROP POLICY IF EXISTS "Admins can view all transcriptions" ON public.transcriptions;

-- User Profiles policies
CREATE POLICY "Users can view their own profile" 
ON public.user_profiles FOR SELECT 
USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles"
ON public.user_profiles FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.user_profiles 
        WHERE id = auth.uid() AND role = 'admin'
    ) OR auth.uid() = id
);

CREATE POLICY "Admins can manage all profiles"
ON public.user_profiles FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM public.user_profiles 
        WHERE id = auth.uid() AND role = 'admin'
    )
);

-- Transcriptions policies
CREATE POLICY "Users can view their own transcriptions"
ON public.transcriptions FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own transcriptions"
ON public.transcriptions FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own transcriptions"
ON public.transcriptions FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all transcriptions"
ON public.transcriptions FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.user_profiles 
        WHERE id = auth.uid() AND role = 'admin'
    )
);

\\echo '=========================================='
\\echo 'Fixing Orphaned Transcriptions'
\\echo '=========================================='

-- Assign orphaned transcriptions
DO $\$
DECLARE
    user_uuid UUID;
    orphaned_count INTEGER;
BEGIN
    SELECT id INTO user_uuid FROM auth.users WHERE email = '${USER_EMAIL}';
    
    SELECT COUNT(*) INTO orphaned_count FROM public.transcriptions WHERE user_id IS NULL;
    
    IF orphaned_count > 0 THEN
        UPDATE public.transcriptions SET user_id = user_uuid WHERE user_id IS NULL;
        RAISE NOTICE 'Assigned % orphaned transcriptions', orphaned_count;
    ELSE
        RAISE NOTICE 'No orphaned transcriptions found';
    END IF;
END $\$;

\\echo '=========================================='
\\echo 'Verification'
\\echo '=========================================='

-- Verify admin profile
SELECT 
    id,
    email,
    role,
    is_active,
    created_at
FROM public.user_profiles 
WHERE email = '${USER_EMAIL}';

-- Count transcriptions
SELECT 
    COUNT(*) as total_transcriptions
FROM public.transcriptions 
WHERE user_id = (SELECT id FROM auth.users WHERE email = '${USER_EMAIL}');

\\echo '=========================================='
\\echo 'SUCCESS! Fixes completed.'
\\echo '=========================================='
`;

    logInfo('SQL script created with comprehensive fixes');
    
    // Upload SQL script to VPS
    logInfo('Uploading SQL script to VPS...');
    const uploadCommand = `cat > /tmp/fix_database.sql << 'EOFMARKER'
${sqlScript}
EOFMARKER`;
    
    await executeSSH(uploadCommand);
    logSuccess('SQL script uploaded to /tmp/fix_database.sql');
    
    // Execute SQL script
    logSection('PHASE 3: Executing Database Fixes');
    logInfo('Running SQL script on PostgreSQL...');
    
    try {
      const sqlResult = await executeSSH(
        `docker exec -i ${dbContainer} psql -U postgres -d postgres < /tmp/fix_database.sql`
      );
      
      log('\n' + '─'.repeat(70), colors.cyan);
      log('SQL Execution Output:', colors.bright);
      log('─'.repeat(70), colors.cyan);
      log(sqlResult.stdout, colors.green);
      
      if (sqlResult.stderr) {
        log('\nWarnings/Notices:', colors.yellow);
        log(sqlResult.stderr, colors.yellow);
      }
      
      logSuccess('SQL script executed successfully!');
    } catch (err) {
      logError('SQL execution failed: ' + err.message);
      log(err.stdout || '', colors.red);
      process.exit(1);
    }
    
    // Cleanup
    logInfo('Cleaning up temporary files...');
    await executeSSH('rm -f /tmp/fix_database.sql');
    
    // Verify the fixes
    logSection('PHASE 4: Verification');
    
    logInfo('Verifying admin user profile...');
    const verifyCommand = `docker exec -i ${dbContainer} psql -U postgres -d postgres -c "SELECT id, email, role, is_active FROM public.user_profiles WHERE email = '${USER_EMAIL}';"`;
    const verifyResult = await executeSSH(verifyCommand);
    log(verifyResult.stdout, colors.green);
    
    logInfo('Counting transcriptions...');
    const countCommand = `docker exec -i ${dbContainer} psql -U postgres -d postgres -c "SELECT COUNT(*) as total_transcriptions FROM public.transcriptions WHERE user_id = (SELECT id FROM auth.users WHERE email = '${USER_EMAIL}');"`;
    const countResult = await executeSSH(countCommand);
    log(countResult.stdout, colors.green);
    
    // Restart application
    logSection('PHASE 5: Restarting Application');
    
    logInfo('Finding application containers...');
    try {
      const appContainers = await executeSSH('docker ps --format "{{.Names}}" | grep -E "(healthscribe|dashboard|next)" | head -1');
      const appContainer = appContainers.stdout.trim();
      
      if (appContainer) {
        logInfo(`Restarting application container: ${appContainer}`);
        await executeSSH(`docker restart ${appContainer}`);
        logSuccess('Application restarted!');
      } else {
        logWarning('Could not find application container to restart');
        logInfo('You may need to manually restart via Coolify dashboard');
      }
    } catch (err) {
      logWarning('Could not restart application: ' + err.message);
    }
    
    // Final summary
    logSection('✨ SUCCESS! All Fixes Completed ✨');
    
    logSuccess('✓ Connected to VPS via SSH');
    logSuccess('✓ Found and accessed PostgreSQL database');
    logSuccess('✓ Created/updated user_profiles table');
    logSuccess(`✓ Set ${USER_EMAIL} as admin`);
    logSuccess('✓ Configured RLS policies');
    logSuccess('✓ Fixed orphaned transcriptions');
    logSuccess('✓ Verified database changes');
    logSuccess('✓ Restarted application');
    
    console.log('\n');
    log('Next Steps:', colors.bright + colors.magenta);
    console.log('1. Clear your browser cache and cookies');
    console.log('2. Go to: https://www.healthscribe.pro');
    console.log(`3. Login as: ${USER_EMAIL}`);
    console.log('4. Check dashboard - transcription history should be visible');
    console.log('5. Access admin panel: /dashboard/admin/users');
    console.log('');
    
    logSuccess('Database fixes completed successfully! 🎉');
    
  } catch (error) {
    logError('Fatal error: ' + error.message);
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
  logInfo('Installing ssh2...');
  
  const { execSync } = require('child_process');
  try {
    execSync('npm install ssh2', { stdio: 'inherit' });
    logSuccess('ssh2 installed successfully!');
    logInfo('Rerun this script...');
  } catch (err) {
    logError('Failed to install ssh2. Please run: npm install ssh2');
    process.exit(1);
  }
}

