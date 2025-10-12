#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const USER_EMAIL = 'omars14@gmail.com';

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

function logSection(title) {
  console.log('\n' + '='.repeat(60));
  log(title, colors.bright + colors.cyan);
  console.log('='.repeat(60) + '\n');
}

async function main() {
  try {
    logSection('CHECKING EXISTING SUPABASE DATABASE');
    
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !supabaseServiceKey) {
      logError('Missing environment variables!');
      process.exit(1);
    }
    
    logInfo('Supabase URL: ' + supabaseUrl);
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });
    
    logSuccess('Connected to Supabase');
    
  // Check if user_profiles table exists
  logSection('CHECKING USER_PROFILES TABLE');
  
  let userProfile = null;
  
  const { data: profiles, error: profilesError, count: profileCount } = await supabase
    .from('user_profiles')
    .select('*', { count: 'exact' })
    .limit(5);
  
  if (profilesError) {
    if (profilesError.code === '42P01') {
      logWarning('user_profiles table does not exist!');
      logInfo('This table needs to be created');
    } else {
      logError('Error checking user_profiles: ' + profilesError.message);
      console.error(profilesError);
    }
  } else {
    logSuccess(`user_profiles table exists with ${profileCount} profiles`);
    if (profiles && profiles.length > 0) {
      console.log('\nSample profiles:');
      profiles.forEach(p => {
        console.log(`  - ${p.email} (${p.role}) - Active: ${p.is_active}`);
      });
    }
    
    // Check for specific user
    const { data: foundProfile, error: userError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('email', USER_EMAIL)
      .single();
    
    if (userError && userError.code !== 'PGRST116') {
      logWarning(`User ${USER_EMAIL} not found in user_profiles`);
    } else if (foundProfile) {
      userProfile = foundProfile;
      logSuccess(`Found user profile for ${USER_EMAIL}`);
      console.log(`  Role: ${userProfile.role}`);
      console.log(`  Active: ${userProfile.is_active}`);
      console.log(`  ID: ${userProfile.id}`);
    }
  }
    
    // Check transcriptions table
    logSection('CHECKING TRANSCRIPTIONS TABLE');
    
    const { data: transcriptions, error: transError, count: transCount } = await supabase
      .from('transcriptions')
      .select('*', { count: 'exact', head: true });
    
    if (transError) {
      if (transError.code === '42P01') {
        logWarning('transcriptions table does not exist!');
        logInfo('This table needs to be created');
      } else {
        logError('Error checking transcriptions: ' + transError.message);
        console.error(transError);
      }
    } else {
      logSuccess(`transcriptions table exists with ${transCount} total transcriptions`);
      
      // Check for user's transcriptions
      const { count: userTransCount } = await supabase
        .from('transcriptions')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userProfile?.id);
      
      if (userProfile) {
        logInfo(`Transcriptions for ${USER_EMAIL}: ${userTransCount || 0}`);
      }
      
      // Sample recent transcriptions
      const { data: recentTrans } = await supabase
        .from('transcriptions')
        .select('id, file_name, doctor_name, user_id, created_at')
        .order('created_at', { ascending: false })
        .limit(5);
      
      if (recentTrans && recentTrans.length > 0) {
        console.log('\nRecent transcriptions:');
        recentTrans.forEach(t => {
          console.log(`  - ${t.file_name} by ${t.doctor_name} (${new Date(t.created_at).toLocaleDateString()})`);
        });
      }
    }
    
    // Summary
    logSection('SUMMARY');
    
    const issues = [];
    
    if (profilesError && profilesError.code === '42P01') {
      issues.push('user_profiles table missing');
    } else if (!userProfile) {
      issues.push(`${USER_EMAIL} not in user_profiles`);
    } else if (userProfile.role !== 'admin') {
      issues.push(`${USER_EMAIL} is not admin (role: ${userProfile.role})`);
    }
    
    if (transError && transError.code === '42P01') {
      issues.push('transcriptions table missing');
    }
    
    if (issues.length > 0) {
      logWarning('Issues found:');
      issues.forEach(issue => {
        console.log(`  • ${issue}`);
      });
      console.log('\nWould you like me to fix these issues? (Y/n)');
    } else {
      logSuccess('No issues found! Database looks good.');
      logInfo('User is admin and tables exist.');
    }
    
  } catch (error) {
    logError('Fatal error: ' + error.message);
    console.error(error);
    process.exit(1);
  }
}

main();

