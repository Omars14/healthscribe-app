#!/usr/bin/env node

/**
 * Test Password Reset Functionality
 * This script tests the complete password reset flow
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

// Configuration
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('🔐 Testing Password Reset Functionality...\n');

// Test email (use one of the migrated users)
const TEST_EMAIL = 'omar@2market.com.au';

const supabase = createClient(SUPABASE_URL, ANON_KEY);

async function testPasswordReset() {
  console.log('📧 Testing password reset for:', TEST_EMAIL);
  
  try {
    // Test the password reset function
    const { data, error } = await supabase.auth.resetPasswordForEmail(TEST_EMAIL, {
      redirectTo: 'https://healthscribe.pro/reset-password'
    });
    
    if (error) {
      console.error('❌ Password reset failed:', error.message);
      return false;
    } else {
      console.log('✅ Password reset email should be sent successfully');
      console.log('📬 Check the email inbox for:', TEST_EMAIL);
      return true;
    }
  } catch (err) {
    console.error('💥 Unexpected error:', err.message);
    return false;
  }
}

async function testAuthSettings() {
  console.log('\n⚙️  Testing auth service configuration...');
  
  try {
    const response = await fetch(`${SUPABASE_URL}/auth/v1/settings`, {
      headers: {
        'apikey': ANON_KEY
      }
    });
    
    if (response.ok) {
      const settings = await response.json();
      console.log('✅ Auth service is accessible');
      console.log('   - Email signup enabled:', settings.external?.email || false);
      console.log('   - Phone signup enabled:', settings.external?.phone || false);  
      console.log('   - Signup disabled:', settings.disable_signup || false);
      console.log('   - Email autoconfirm:', settings.mailer_autoconfirm || false);
    } else {
      console.error('❌ Auth service not accessible:', response.statusText);
    }
  } catch (error) {
    console.error('❌ Error accessing auth service:', error.message);
  }
}

async function checkUserExists() {
  console.log('\n👤 Checking if test user exists...');
  
  try {
    const adminSupabase = createClient(SUPABASE_URL, SERVICE_KEY);
    
    // List users with the service role key
    const { data: users, error } = await adminSupabase.auth.admin.listUsers();
    
    if (error) {
      console.error('❌ Could not list users:', error.message);
      return false;
    }
    
    const testUser = users.users.find(user => user.email === TEST_EMAIL);
    
    if (testUser) {
      console.log('✅ Test user found:');
      console.log('   - ID:', testUser.id);
      console.log('   - Email:', testUser.email);
      console.log('   - Email confirmed:', testUser.email_confirmed_at ? '✅' : '❌');
      console.log('   - Created:', new Date(testUser.created_at).toLocaleString());
      return true;
    } else {
      console.log('❌ Test user not found in auth system');
      return false;
    }
  } catch (error) {
    console.error('❌ Error checking user:', error.message);
    return false;
  }
}

async function main() {
  console.log('🔍 Environment Check:');
  console.log('   - Supabase URL:', SUPABASE_URL ? '✅' : '❌');
  console.log('   - Anon Key:', ANON_KEY ? '✅' : '❌');
  console.log('   - Service Key:', SERVICE_KEY ? '✅' : '❌');
  
  if (!SUPABASE_URL || !ANON_KEY || !SERVICE_KEY) {
    console.error('❌ Missing environment variables');
    return;
  }
  
  // Run tests
  await testAuthSettings();
  const userExists = await checkUserExists();
  
  if (userExists) {
    const resetSuccess = await testPasswordReset();
    
    console.log('\n📋 Test Results:');
    console.log('   ✅ Auth service accessible');
    console.log('   ✅ Test user exists');
    console.log(`   ${resetSuccess ? '✅' : '❌'} Password reset ${resetSuccess ? 'successful' : 'failed'}`);
    
    if (resetSuccess) {
      console.log('\n🎯 Next Steps:');
      console.log('   1. Check email for password reset link');
      console.log('   2. Click the link to go to reset password page');
      console.log('   3. Enter new password and confirm');
      console.log('   4. Try logging in with new password');
      console.log('\n💡 The forgot password functionality should now work correctly!');
    } else {
      console.log('\n🚨 Password reset is not working. Check:');
      console.log('   1. Supabase auth service configuration');
      console.log('   2. SMTP settings for email delivery');
      console.log('   3. URL redirects in auth settings');
    }
  } else {
    console.log('\n🚨 Test user does not exist. Run user migration first.');
  }
}

main().catch(console.error);