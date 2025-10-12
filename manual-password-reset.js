#!/usr/bin/env node

/**
 * Manual Password Reset for Users
 * This script manually resets passwords for users when SMTP is not configured
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

// Configuration
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('🔑 Manual Password Reset Tool\n');

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('❌ Missing environment variables');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

async function listAllUsers() {
  console.log('👥 Fetching all users...');
  
  try {
    const { data: users, error } = await supabase.auth.admin.listUsers();
    
    if (error) {
      console.error('❌ Error fetching users:', error.message);
      return [];
    }
    
    console.log(`✅ Found ${users.users.length} users:\n`);
    
    users.users.forEach((user, index) => {
      console.log(`${index + 1}. ${user.email}`);
      console.log(`   ID: ${user.id}`);
      console.log(`   Created: ${new Date(user.created_at).toLocaleString()}`);
      console.log(`   Email confirmed: ${user.email_confirmed_at ? '✅' : '❌'}`);
      console.log('');
    });
    
    return users.users;
  } catch (error) {
    console.error('❌ Error:', error.message);
    return [];
  }
}

async function setUserPassword(userId, email, newPassword) {
  console.log(`🔐 Setting password for ${email}...`);
  
  try {
    const { data, error } = await supabase.auth.admin.updateUserById(userId, {
      password: newPassword,
      email_confirm: true  // Ensure email is confirmed
    });
    
    if (error) {
      console.error(`❌ Failed to set password for ${email}:`, error.message);
      return false;
    } else {
      console.log(`✅ Password set successfully for ${email}`);
      return true;
    }
  } catch (error) {
    console.error(`❌ Error setting password for ${email}:`, error.message);
    return false;
  }
}

async function resetPasswordForUser(email, newPassword) {
  console.log(`\n🔍 Looking for user: ${email}`);
  
  try {
    // Find user by email
    const { data: users, error } = await supabase.auth.admin.listUsers();
    
    if (error) {
      console.error('❌ Error fetching users:', error.message);
      return false;
    }
    
    const user = users.users.find(u => u.email.toLowerCase() === email.toLowerCase());
    
    if (!user) {
      console.error(`❌ User not found: ${email}`);
      return false;
    }
    
    console.log(`✅ User found: ${user.email} (ID: ${user.id})`);
    
    // Set the new password
    return await setUserPassword(user.id, user.email, newPassword);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    return false;
  }
}

async function massPasswordReset() {
  console.log('🚨 MASS PASSWORD RESET - This will reset ALL user passwords to: "TempPass2024!"\n');
  console.log('⚠️  Users will need to be notified of this temporary password\n');
  
  // Ask for confirmation
  const readline = require('readline');
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  return new Promise((resolve) => {
    rl.question('Are you sure you want to proceed? (yes/no): ', async (answer) => {
      rl.close();
      
      if (answer.toLowerCase() !== 'yes') {
        console.log('❌ Mass password reset cancelled');
        resolve();
        return;
      }
      
      console.log('\n🔄 Starting mass password reset...\n');
      
      const users = await listAllUsers();
      const tempPassword = 'TempPass2024!';
      
      let successful = 0;
      let failed = 0;
      
      for (const user of users) {
        const success = await setUserPassword(user.id, user.email, tempPassword);
        if (success) {
          successful++;
        } else {
          failed++;
        }
      }
      
      console.log(`\n📊 Mass Password Reset Complete:`);
      console.log(`   ✅ Successful: ${successful}`);
      console.log(`   ❌ Failed: ${failed}`);
      console.log(`   🔑 Temporary Password: "${tempPassword}"`);
      
      console.log(`\n📧 IMPORTANT - Send this message to all users:`);
      console.log('   ========================================');
      console.log('   Subject: Password Reset - Action Required');
      console.log('   ');
      console.log('   Your password has been reset to: TempPass2024!');
      console.log('   ');
      console.log('   Please log in at https://healthscribe.pro/login');
      console.log('   and change your password immediately.');
      console.log('   ========================================');
      
      resolve();
    });
  });
}

// Command line interface
async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log('Usage:');
    console.log('  node manual-password-reset.js list                    # List all users');
    console.log('  node manual-password-reset.js reset <email> <password> # Reset specific user');
    console.log('  node manual-password-reset.js mass                    # Reset all users');
    console.log('');
    console.log('Examples:');
    console.log('  node manual-password-reset.js reset omar@2market.com.au NewPassword123!');
    console.log('  node manual-password-reset.js mass');
    return;
  }
  
  const command = args[0];
  
  if (command === 'list') {
    await listAllUsers();
    
  } else if (command === 'reset' && args.length === 3) {
    const email = args[1];
    const password = args[2];
    
    if (password.length < 8) {
      console.error('❌ Password must be at least 8 characters long');
      return;
    }
    
    const success = await resetPasswordForUser(email, password);
    if (success) {
      console.log(`\n🎉 SUCCESS! Password reset for ${email}`);
      console.log(`📧 Send them this message:`);
      console.log(`   "Your password has been reset to: ${password}"`);
      console.log(`   "Please log in at https://healthscribe.pro/login and change it immediately."`);
    }
    
  } else if (command === 'mass') {
    await massPasswordReset();
    
  } else {
    console.error('❌ Invalid command or arguments');
    console.log('Run without arguments to see usage instructions');
  }
}

main().catch(console.error);