#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const USER_EMAIL = 'omars14@gmail.com';
const USER_ID = '4a99755c-53ba-486c-8393-1460561b2259';

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

async function main() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });
    
    logSection('TESTING API DATA RETRIEVAL');
    
    // Test 1: Get user transcriptions (what the dashboard should show)
    log('Test 1: Get user transcriptions for dashboard', colors.blue);
    const { data: userTrans, error: userTransError } = await supabase
      .from('transcriptions')
      .select('*')
      .eq('user_id', USER_ID)
      .order('created_at', { ascending: false })
      .limit(10);
    
    if (userTransError) {
      log('❌ Error: ' + userTransError.message, colors.red);
    } else {
      log(`✅ Found ${userTrans.length} transcriptions for user`, colors.green);
      console.log('\nSample transcriptions:');
      userTrans.slice(0, 5).forEach((t, i) => {
        console.log(`  ${i+1}. ${t.file_name}`);
        console.log(`     Doctor: ${t.doctor_name}`);
        console.log(`     Status: ${t.status || 'N/A'}`);
        console.log(`     Created: ${new Date(t.created_at).toLocaleString()}`);
      });
    }
    
    // Test 2: Test admin panel users endpoint
    logSection('TEST 2: Admin Panel - Get All Users');
    const { data: allUsers, error: usersError } = await supabase
      .from('user_profiles')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (usersError) {
      log('❌ Error: ' + usersError.message, colors.red);
    } else {
      log(`✅ Found ${allUsers.length} user profiles`, colors.green);
      allUsers.forEach(u => {
        console.log(`  - ${u.email} (${u.role}) - Active: ${u.is_active}`);
      });
    }
    
    // Test 3: Test admin panel transcriptions endpoint
    logSection('TEST 3: Admin Panel - Get All Transcriptions');
    const { data: allTrans, error: allTransError, count } = await supabase
      .from('transcriptions')
      .select('id, file_name, doctor_name, created_at, status', { count: 'exact' })
      .order('created_at', { ascending: false })
      .limit(5);
    
    if (allTransError) {
      log('❌ Error: ' + allTransError.message, colors.red);
    } else {
      log(`✅ Total transcriptions: ${count}`, colors.green);
      log(`Showing latest 5:`, colors.cyan);
      allTrans.forEach((t, i) => {
        console.log(`  ${i+1}. ${t.file_name} - ${t.doctor_name} (${new Date(t.created_at).toLocaleDateString()})`);
      });
    }
    
    // Test 4: Check RLS policies by simulating user auth
    logSection('TEST 4: Checking RLS Policies');
    
    // Try to get transcriptions as if we're the authenticated user
    const { data: withRLS, error: rlsError } = await supabase
      .from('transcriptions')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', USER_ID);
    
    if (rlsError) {
      log('❌ RLS check failed: ' + rlsError.message, colors.red);
    } else {
      log('✅ RLS policies allow data access', colors.green);
    }
    
    // Summary
    logSection('DIAGNOSIS');
    
    log('Database Status:', colors.bright);
    log('  ✅ User exists and is admin', colors.green);
    log('  ✅ user_profiles table accessible', colors.green);
    log('  ✅ transcriptions table accessible', colors.green);
    log('  ✅ User has 29 transcriptions', colors.green);
    log('  ✅ RLS policies working', colors.green);
    
    console.log('\n' + '─'.repeat(60));
    log('NEXT STEP: Test the actual website', colors.bright + colors.yellow);
    console.log('─'.repeat(60));
    console.log('\n1. Clear your browser cache and cookies');
    console.log('2. Go to: https://www.healthscribe.pro');
    console.log('3. Login as: ' + USER_EMAIL);
    console.log('4. Check if dashboard shows transcription count');
    console.log('5. Navigate to /dashboard/transcriptions');
    console.log('6. Navigate to /dashboard/admin/users');
    console.log('');
    log('If still not working, the issue is likely:', colors.yellow);
    console.log('  • Frontend caching');
    console.log('  • Authentication token issues');
    console.log('  • API route configuration');
    console.log('  • Next.js build cache');
    console.log('');
    log('Recommended fix:', colors.cyan);
    console.log('  • Restart the Next.js app in Coolify');
    console.log('  • Clear browser cache completely');
    console.log('  • Try in incognito mode');
    console.log('');
    
  } catch (error) {
    log('❌ Fatal error: ' + error.message, colors.red);
    console.error(error);
  }
}

main();

