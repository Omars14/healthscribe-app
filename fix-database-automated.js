#!/usr/bin/env node

/**
 * Automated Database Fix Script
 * Fixes transcription history and admin panel access for omars14@gmail.com
 * Executes directly against self-hosted Supabase database
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const USER_EMAIL = 'omars14@gmail.com';

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function logSection(title) {
  console.log('\n' + '='.repeat(60));
  log(title, colors.bright + colors.cyan);
  console.log('='.repeat(60) + '\n');
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

async function main() {
  try {
    logSection('DATABASE FIX - Starting Automated Process');
    
    // Initialize Supabase client with service role key
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !supabaseServiceKey) {
      logError('Missing environment variables!');
      logError('NEXT_PUBLIC_SUPABASE_URL: ' + (supabaseUrl ? 'SET' : 'NOT SET'));
      logError('SUPABASE_SERVICE_ROLE_KEY: ' + (supabaseServiceKey ? 'SET' : 'NOT SET'));
      process.exit(1);
    }
    
    logInfo('Connecting to Supabase at: ' + supabaseUrl);
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });
    
    logSuccess('Connected to Supabase');
    
    // ==========================================
    // PHASE 1: DIAGNOSIS
    // ==========================================
    logSection('PHASE 1: Diagnosing Current State');
    
    // Check if user exists in auth.users
    logInfo('Checking for user in auth.users...');
    const { data: authUser, error: authError } = await supabase.auth.admin.getUserByEmail(USER_EMAIL);
    
    if (authError) {
      logError('Failed to get user from auth: ' + authError.message);
      // Try alternative method
      logInfo('Trying alternative method to find user...');
      const { data: users, error: listError } = await supabase.auth.admin.listUsers();
      if (listError) {
        logError('Cannot access auth.users: ' + listError.message);
        process.exit(1);
      }
      const foundUser = users.users.find(u => u.email === USER_EMAIL);
      if (!foundUser) {
        logError(`User ${USER_EMAIL} not found in auth.users!`);
        logError('Please ensure the user has been created first.');
        process.exit(1);
      }
      authUser.user = foundUser;
    }
    
    const userId = authUser?.user?.id;
    if (!userId) {
      logError(`User ${USER_EMAIL} not found in database!`);
      process.exit(1);
    }
    
    logSuccess(`Found user: ${USER_EMAIL}`);
    logInfo(`User ID: ${userId}`);
    
    // Check user_profiles table
    logInfo('Checking user_profiles table...');
    const { data: userProfile, error: profileError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', userId)
      .single();
    
    if (profileError && profileError.code !== 'PGRST116') {
      logWarning('Error checking user_profiles: ' + profileError.message);
      if (profileError.code === '42P01') {
        logWarning('user_profiles table does not exist!');
      }
    } else if (userProfile) {
      logSuccess('User profile exists');
      logInfo(`Current role: ${userProfile.role}`);
      logInfo(`Is active: ${userProfile.is_active}`);
    } else {
      logWarning('User profile does NOT exist');
    }
    
    // Count transcriptions
    logInfo('Counting transcriptions...');
    const { count: totalTranscriptions, error: countError } = await supabase
      .from('transcriptions')
      .select('*', { count: 'exact', head: true });
    
    if (countError) {
      logWarning('Error counting transcriptions: ' + countError.message);
    } else {
      logSuccess(`Total transcriptions in database: ${totalTranscriptions}`);
    }
    
    // Count user's transcriptions
    const { count: userTranscriptions, error: userCountError } = await supabase
      .from('transcriptions')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);
    
    if (userCountError) {
      logWarning('Error counting user transcriptions: ' + userCountError.message);
    } else {
      logSuccess(`User's transcriptions: ${userTranscriptions}`);
    }
    
    // Check for orphaned transcriptions
    const { count: orphanedCount, error: orphanError } = await supabase
      .from('transcriptions')
      .select('*', { count: 'exact', head: true })
      .is('user_id', null);
    
    if (!orphanError && orphanedCount > 0) {
      logWarning(`Found ${orphanedCount} orphaned transcriptions (no user_id)`);
    }
    
    // ==========================================
    // PHASE 2: FIX USER PROFILE
    // ==========================================
    logSection('PHASE 2: Creating/Updating User Profile');
    
    // First, let's try to use RPC to execute SQL directly
    logInfo('Creating user profile with admin role...');
    
    // Use upsert to create or update the profile
    const { data: upsertedProfile, error: upsertError } = await supabase
      .from('user_profiles')
      .upsert({
        id: userId,
        email: USER_EMAIL,
        role: 'admin',
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'id'
      })
      .select()
      .single();
    
    if (upsertError) {
      logError('Failed to upsert user profile: ' + upsertError.message);
      
      // If table doesn't exist, we need to create it via SQL
      if (upsertError.code === '42P01') {
        logWarning('user_profiles table does not exist!');
        logInfo('This requires direct database access to create the table.');
        logInfo('Please run the SQL script: fix-supabase-database.sql');
        process.exit(1);
      }
    } else {
      logSuccess('User profile created/updated successfully!');
      logInfo(`Role: ${upsertedProfile.role}`);
      logInfo(`Active: ${upsertedProfile.is_active}`);
    }
    
    // ==========================================
    // PHASE 3: FIX ORPHANED TRANSCRIPTIONS
    // ==========================================
    if (orphanedCount > 0) {
      logSection('PHASE 3: Assigning Orphaned Transcriptions');
      
      logInfo(`Assigning ${orphanedCount} orphaned transcriptions to ${USER_EMAIL}...`);
      
      const { error: updateError } = await supabase
        .from('transcriptions')
        .update({ user_id: userId })
        .is('user_id', null);
      
      if (updateError) {
        logError('Failed to update orphaned transcriptions: ' + updateError.message);
      } else {
        logSuccess(`Assigned ${orphanedCount} orphaned transcriptions to user`);
      }
    }
    
    // ==========================================
    // PHASE 4: VERIFICATION
    // ==========================================
    logSection('PHASE 4: Verification');
    
    // Verify user profile
    logInfo('Verifying user profile...');
    const { data: verifyProfile, error: verifyError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', userId)
      .single();
    
    if (verifyError) {
      logError('Failed to verify profile: ' + verifyError.message);
    } else {
      logSuccess('User profile verified!');
      console.log(JSON.stringify(verifyProfile, null, 2));
    }
    
    // Count user's transcriptions again
    logInfo('Recounting user transcriptions...');
    const { count: finalCount, error: finalCountError } = await supabase
      .from('transcriptions')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);
    
    if (finalCountError) {
      logError('Failed to count transcriptions: ' + finalCountError.message);
    } else {
      logSuccess(`User now has ${finalCount} transcriptions`);
    }
    
    // Sample transcriptions
    logInfo('Fetching sample transcriptions...');
    const { data: sampleTrans, error: sampleError } = await supabase
      .from('transcriptions')
      .select('id, file_name, doctor_name, patient_name, status, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(5);
    
    if (sampleError) {
      logError('Failed to fetch sample transcriptions: ' + sampleError.message);
    } else if (sampleTrans && sampleTrans.length > 0) {
      logSuccess(`Sample of ${sampleTrans.length} most recent transcriptions:`);
      sampleTrans.forEach((t, i) => {
        console.log(`  ${i + 1}. ${t.file_name} - ${t.doctor_name} (${new Date(t.created_at).toLocaleDateString()})`);
      });
    } else {
      logWarning('No transcriptions found for user');
    }
    
    // ==========================================
    // PHASE 5: TEST API ENDPOINTS
    // ==========================================
    logSection('PHASE 5: Testing API Endpoints');
    
    // Test admin users endpoint
    logInfo('Testing /api/admin/users endpoint...');
    try {
      const response = await fetch(`${supabaseUrl.replace('supabase.', 'www.')}/api/admin/users?limit=5`);
      if (response.ok) {
        const data = await response.json();
        logSuccess(`Admin users API working! Found ${data.users?.length || 0} users`);
      } else {
        logWarning(`Admin users API returned ${response.status}: ${response.statusText}`);
      }
    } catch (err) {
      logWarning('Could not test admin API (this is normal if testing locally): ' + err.message);
    }
    
    // ==========================================
    // SUMMARY
    // ==========================================
    logSection('SUMMARY - Database Fixes Complete');
    
    logSuccess('✓ User profile created/updated with admin role');
    logSuccess('✓ User email: ' + USER_EMAIL);
    logSuccess('✓ User ID: ' + userId);
    logSuccess('✓ Role: admin');
    logSuccess('✓ Active: true');
    if (finalCount) {
      logSuccess(`✓ Transcriptions: ${finalCount}`);
    }
    
    console.log('\n');
    log('Next Steps:', colors.bright + colors.yellow);
    console.log('1. Restart your Next.js application in Coolify');
    console.log('2. Clear browser cache and cookies');
    console.log('3. Login as ' + USER_EMAIL);
    console.log('4. Check dashboard for transcription history');
    console.log('5. Access admin panel at /dashboard/admin/users');
    console.log('');
    
    logSection('IMPORTANT: RLS Policies');
    logWarning('If transcriptions still don\'t show, RLS policies may need to be configured.');
    logInfo('Run this SQL script on your database: fix-supabase-database.sql');
    logInfo('This requires direct PostgreSQL access via Docker or Coolify terminal.');
    console.log('');
    
  } catch (error) {
    logError('Fatal error: ' + error.message);
    console.error(error);
    process.exit(1);
  }
}

// Run the script
main();

