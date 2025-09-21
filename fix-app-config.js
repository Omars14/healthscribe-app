#!/usr/bin/env node

/**
 * Fix Application Configuration
 * 
 * This script will update the application configuration to use the local PostgreSQL
 * instead of trying to connect to the self-hosted Supabase
 */

const fs = require('fs');
const path = require('path');

// Function to update environment configuration
function updateEnvironmentConfig() {
  console.log('🔧 Updating application configuration...');
  
  const envContent = `# Database Configuration
DATABASE_URL=postgresql://healthscribe_user:password123@localhost:5432/healthscribe
POSTGRES_PASSWORD=password123
POSTGRES_DB=healthscribe
POSTGRES_USER=healthscribe_user

# Application URLs
NEXT_PUBLIC_URL=http://www.healthscribe.pro
NEXT_PUBLIC_API_URL=http://www.healthscribe.pro
NODE_ENV=production

# Use simple auth instead of Supabase
NEXT_PUBLIC_USE_SIMPLE_AUTH=true

# Keep cloud Supabase for reference (but app should use local DB)
NEXT_PUBLIC_SUPABASE_URL=https://yaznemrwbingjwqutbvb.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inlhem5lbXJ3YmluZ2p3cXV0YnZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU0NjA0MzAsImV4cCI6MjA3MTAzNjQzMH0.uluQzD4-m91tUq0gOrUNOfR9rlN0Ry4tAPlxp-PWrIo
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inlhem5lbXJ3YmluZ2p3cXV0YnZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTQ2MDQzMCwiZXhwIjoyMDcxMDM2NDMwfQ.9Ib029SJ7rGbBI4JMoEKacX4LMOZbzOedDZ9JGtuXAs
`;

  try {
    // Write the updated .env.local file
    fs.writeFileSync('.env.local', envContent);
    console.log('✅ Updated .env.local file');
    
    // Also create a .env file for backup
    fs.writeFileSync('.env', envContent);
    console.log('✅ Created .env file as backup');
    
    return true;
  } catch (error) {
    console.error('❌ Failed to update environment configuration:', error.message);
    return false;
  }
}

// Function to check if the application is using simple auth
function checkApplicationConfig() {
  console.log('\n🔍 Checking application configuration...');
  
  try {
    // Check if there are any Supabase client files that might be overriding the config
    const supabaseFiles = [
      'src/lib/supabase.ts',
      'src/lib/supabase-client.ts',
      'src/lib/supabase-server.ts',
      'src/lib/supabase-api.ts'
    ];
    
    for (const file of supabaseFiles) {
      if (fs.existsSync(file)) {
        console.log(`📄 Found: ${file}`);
        const content = fs.readFileSync(file, 'utf8');
        
        // Check if it's using the self-hosted URL
        if (content.includes('supabase.healthscribe.pro')) {
          console.log(`⚠️  ${file} contains self-hosted Supabase URL`);
        }
        
        // Check if it's using simple auth
        if (content.includes('NEXT_PUBLIC_USE_SIMPLE_AUTH')) {
          console.log(`✅ ${file} supports simple auth`);
        }
      }
    }
    
    return true;
  } catch (error) {
    console.error('❌ Failed to check application configuration:', error.message);
    return false;
  }
}

// Main function
function main() {
  console.log('🚀 Fix Application Configuration');
  console.log('================================');
  
  const configUpdated = updateEnvironmentConfig();
  if (!configUpdated) {
    console.log('\n❌ Configuration update failed');
    process.exit(1);
  }
  
  const configChecked = checkApplicationConfig();
  if (!configChecked) {
    console.log('\n⚠️  Configuration check failed');
  }
  
  console.log('\n🎉 Application configuration updated successfully!');
  console.log('\n📝 Next Steps:');
  console.log('1. Restart your application: pm2 restart all (or systemctl restart your-app)');
  console.log('2. Test login functionality');
  console.log('3. The app should now use local PostgreSQL instead of self-hosted Supabase');
  console.log('\n💡 If login still doesn\'t work, check if your app is configured to use simple auth');
}

// Run the fix
main();




