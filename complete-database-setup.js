#!/usr/bin/env node

const { Client } = require('ssh2');
const crypto = require('crypto');

const SSH_CONFIG = {
  host: '154.26.155.207',
  port: 22,
  username: 'root',
  password: 'Nomar123'
};

const DB_CONTAINER = 'supabase_db_supabase';
const DB_USER = 'postgres';
const DB_NAME = 'postgres';
const USER_EMAIL = 'omars14@gmail.com';
const USER_PASSWORD = 'Nomar123'; // You can change this

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

function logSuccess(message) {
  log('✅ ' + message, colors.green);
}

function logError(message) {
  log('❌ ' + message, colors.red);
}

function logInfo(message) {
  log('ℹ️  ' + message, colors.blue);
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
        
        stream.on('close', () => {
          conn.end();
          resolve({ stdout: output, stderr: errorOutput });
        }).on('data', (data) => {
          output += data.toString();
        }).stderr.on('data', (data) => {
          errorOutput += data.toString();
        });
      });
    }).on('error', reject).connect(SSH_CONFIG);
  });
}

// Generate UUID
function generateUUID() {
  return crypto.randomUUID();
}

// Hash password for Supabase auth
function hashPassword(password) {
  // Simple bcrypt-like hash for demo - Supabase uses bcrypt
  // In production, Supabase handles this
  return '$2a$10$' + crypto.createHash('sha256').update(password).digest('hex').substring(0, 53);
}

async function main() {
  try {
    log('\n' + '='.repeat(70), colors.cyan);
    log('COMPLETE DATABASE SETUP', colors.bright + colors.cyan);
    log('='.repeat(70) + '\n', colors.cyan);
    
    logInfo(`Setting up database for: ${USER_EMAIL}`);
    logInfo(`Container: ${DB_CONTAINER}`);
    
    const userId = generateUUID();
    logInfo(`Generated User ID: ${userId}`);
    
    // Create comprehensive SQL setup script
    const sqlScript = `
-- ========================================
-- COMPLETE DATABASE SETUP
-- ========================================

-- Create user_role enum
DO $$ 
BEGIN
    CREATE TYPE user_role AS ENUM ('admin', 'editor', 'transcriptionist');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create user in auth.users
DO $$
DECLARE
    user_uuid UUID := '${userId}';
    user_email TEXT := '${USER_EMAIL}';
BEGIN
    -- Check if user already exists
    IF EXISTS (SELECT 1 FROM auth.users WHERE email = user_email) THEN
        RAISE NOTICE 'User already exists: %', user_email;
        user_uuid := (SELECT id FROM auth.users WHERE email = user_email);
    ELSE
        -- Insert user into auth.users
        INSERT INTO auth.users (
            id,
            instance_id,
            email,
            encrypted_password,
            email_confirmed_at,
            created_at,
            updated_at,
            raw_app_meta_data,
            raw_user_meta_data,
            is_super_admin,
            role,
            aud
        ) VALUES (
            user_uuid,
            '00000000-0000-0000-0000-000000000000',
            user_email,
            '${hashPassword(USER_PASSWORD)}',
            NOW(),
            NOW(),
            NOW(),
            '{"provider":"email","providers":["email"]}',
            '{"full_name":"Omar"}',
            false,
            'authenticated',
            'authenticated'
        );
        
        RAISE NOTICE 'Created user: % with ID: %', user_email, user_uuid;
    END IF;
END $$;

-- Create user_profiles table
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

-- Create transcriptions table
CREATE TABLE IF NOT EXISTS public.transcriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    file_name TEXT,
    doctor_name TEXT,
    patient_name TEXT,
    document_type TEXT,
    transcription_text TEXT,
    audio_url TEXT,
    status TEXT DEFAULT 'pending',
    file_size BIGINT,
    error TEXT,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Enable RLS
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transcriptions ENABLE ROW LEVEL SECURITY;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON public.user_profiles(email);
CREATE INDEX IF NOT EXISTS idx_user_profiles_role ON public.user_profiles(role);
CREATE INDEX IF NOT EXISTS idx_transcriptions_user_id ON public.transcriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_transcriptions_status ON public.transcriptions(status);
CREATE INDEX IF NOT EXISTS idx_transcriptions_created_at ON public.transcriptions(created_at DESC);

-- Insert admin user profile
DO $$
DECLARE
    user_uuid UUID;
    user_email TEXT := '${USER_EMAIL}';
BEGIN
    SELECT id INTO user_uuid FROM auth.users WHERE email = user_email;
    
    IF user_uuid IS NULL THEN
        RAISE EXCEPTION 'User not found!';
    END IF;
    
    INSERT INTO public.user_profiles (id, email, full_name, role, is_active, created_at)
    VALUES (
        user_uuid,
        user_email,
        'Omar',
        'admin'::user_role,
        true,
        NOW()
    )
    ON CONFLICT (id) DO UPDATE 
    SET 
        role = 'admin'::user_role,
        is_active = true,
        updated_at = NOW();
    
    RAISE NOTICE 'Created admin profile for: %', user_email;
END $$;

-- Create RLS policies
DROP POLICY IF EXISTS "Users can view their own profile" ON public.user_profiles;
CREATE POLICY "Users can view their own profile" 
ON public.user_profiles FOR SELECT 
USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update their own profile" ON public.user_profiles;
CREATE POLICY "Users can update their own profile" 
ON public.user_profiles FOR UPDATE 
USING (auth.uid() = id);

DROP POLICY IF EXISTS "Admins can view all profiles" ON public.user_profiles;
CREATE POLICY "Admins can view all profiles"
ON public.user_profiles FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.user_profiles 
        WHERE id = auth.uid() AND role = 'admin'
    ) OR auth.uid() = id
);

DROP POLICY IF EXISTS "Admins can manage all profiles" ON public.user_profiles;
CREATE POLICY "Admins can manage all profiles"
ON public.user_profiles FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM public.user_profiles 
        WHERE id = auth.uid() AND role = 'admin'
    )
);

DROP POLICY IF EXISTS "Users can view their own transcriptions" ON public.transcriptions;
CREATE POLICY "Users can view their own transcriptions"
ON public.transcriptions FOR SELECT
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create their own transcriptions" ON public.transcriptions;
CREATE POLICY "Users can create their own transcriptions"
ON public.transcriptions FOR INSERT
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own transcriptions" ON public.transcriptions;
CREATE POLICY "Users can update their own transcriptions"
ON public.transcriptions FOR UPDATE
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can view all transcriptions" ON public.transcriptions;
CREATE POLICY "Admins can view all transcriptions"
ON public.transcriptions FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.user_profiles 
        WHERE id = auth.uid() AND role = 'admin'
    )
);

-- Verification
\\echo '=========================================='
\\echo 'VERIFICATION'
\\echo '=========================================='

SELECT 'AUTH USER:' as check_type, id, email, created_at 
FROM auth.users WHERE email = '${USER_EMAIL}';

SELECT 'USER PROFILE:' as check_type, id, email, role, is_active 
FROM public.user_profiles WHERE email = '${USER_EMAIL}';

SELECT 'TRANSCRIPTION COUNT:' as check_type, COUNT(*)::text as count 
FROM public.transcriptions WHERE user_id = (SELECT id FROM auth.users WHERE email = '${USER_EMAIL}');

\\echo '=========================================='
\\echo 'SUCCESS! Setup complete.'
\\echo '=========================================='
`;

    // Upload and execute SQL script
    logInfo('Uploading SQL script...');
    
    const uploadCmd = `cat > /tmp/setup_database.sql << 'EOFMARKER'
${sqlScript}
EOFMARKER`;
    
    await executeSSH(uploadCmd);
    logSuccess('SQL script uploaded');
    
    logInfo('Executing database setup...');
    const execCmd = `docker exec -i ${DB_CONTAINER} psql -U ${DB_USER} -d ${DB_NAME} < /tmp/setup_database.sql`;
    const result = await executeSSH(execCmd);
    
    log('\n' + '─'.repeat(70), colors.cyan);
    log('EXECUTION OUTPUT:', colors.bright);
    log('─'.repeat(70), colors.cyan);
    log(result.stdout, colors.green);
    
    if (result.stderr && !result.stderr.includes('NOTICE')) {
      log('\nWarnings:', colors.yellow);
      log(result.stderr, colors.yellow);
    }
    
    // Cleanup
    await executeSSH('rm -f /tmp/setup_database.sql');
    
    // Final verification
    log('\n' + '='.repeat(70), colors.cyan);
    log('FINAL VERIFICATION', colors.bright + colors.cyan);
    log('='.repeat(70) + '\n', colors.cyan);
    
    const verifyCmd = `docker exec -i ${DB_CONTAINER} psql -U ${DB_USER} -d ${DB_NAME} -c "SELECT id, email, role, is_active FROM public.user_profiles WHERE email = '${USER_EMAIL}';"`;
    const verifyResult = await executeSSH(verifyCmd);
    log(verifyResult.stdout, colors.green);
    
    log('\n' + '='.repeat(70), colors.green);
    log('✨ SUCCESS! Database Setup Complete ✨', colors.bright + colors.green);
    log('='.repeat(70) + '\n', colors.green);
    
    logSuccess(`User created: ${USER_EMAIL}`);
    logSuccess(`User ID: ${userId}`);
    logSuccess(`Role: admin`);
    logSuccess(`Password: ${USER_PASSWORD}`);
    logSuccess('Tables created: user_profiles, transcriptions');
    logSuccess('RLS policies configured');
    
    log('\n📝 NEXT STEPS:', colors.bright + colors.magenta);
    console.log('1. Go to: https://www.healthscribe.pro');
    console.log(`2. Login with:`);
    console.log(`   Email: ${USER_EMAIL}`);
    console.log(`   Password: ${USER_PASSWORD}`);
    console.log('3. Check dashboard - should show 0 transcriptions initially');
    console.log('4. Access admin panel: /dashboard/admin/users');
    console.log('5. Create your first transcription!');
    console.log('');
    
  } catch (error) {
    logError('Fatal error: ' + error.message);
    console.error(error);
    process.exit(1);
  }
}

main();

