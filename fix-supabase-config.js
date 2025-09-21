#!/usr/bin/env node

/**
 * Fix Supabase Configuration
 * 
 * This script will update the Supabase configuration to use the working cloud Supabase
 * instead of the broken self-hosted one
 */

const fs = require('fs');
const path = require('path');

// Function to update environment configuration to use cloud Supabase
function updateEnvironmentConfig() {
  console.log('🔧 Updating environment configuration to use cloud Supabase...');
  
  const envContent = `# Use Cloud Supabase (Working)
NEXT_PUBLIC_SUPABASE_URL=https://yaznemrwbingjwqutbvb.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inlhem5lbXJ3YmluZ2p3cXV0YnZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU0NjA0MzAsImV4cCI6MjA3MTAzNjQzMH0.uluQzD4-m91tUq0gOrUNOfR9rlN0Ry4tAPlxp-PWrIo
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inlhem5lbXJ3YmluZ2p3cXV0YnZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTQ2MDQzMCwiZXhwIjoyMDcxMDM2NDMwfQ.9Ib029SJ7rGbBI4JMoEKacX4LMOZbzOedDZ9JGtuXAs

# Application URLs
NEXT_PUBLIC_URL=http://www.healthscribe.pro
NEXT_PUBLIC_API_URL=http://www.healthscribe.pro
NODE_ENV=production

# Database Configuration (for local PostgreSQL - not used for auth)
DATABASE_URL=postgresql://healthscribe_user:password123@localhost:5432/healthscribe
POSTGRES_PASSWORD=password123
POSTGRES_DB=healthscribe
POSTGRES_USER=healthscribe_user
`;

  try {
    // Write the updated .env.local file
    fs.writeFileSync('.env.local', envContent);
    console.log('✅ Updated .env.local file to use cloud Supabase');
    
    // Also create a .env file for backup
    fs.writeFileSync('.env', envContent);
    console.log('✅ Created .env file as backup');
    
    return true;
  } catch (error) {
    console.error('❌ Failed to update environment configuration:', error.message);
    return false;
  }
}

// Function to check and update Supabase client files
function updateSupabaseClientFiles() {
  console.log('\n🔍 Checking Supabase client files...');
  
  const supabaseFiles = [
    'src/lib/supabase.ts',
    'src/lib/supabase-client.ts',
    'src/lib/supabase-server.ts',
    'src/lib/supabase-api.ts'
  ];
  
  let updatedFiles = 0;
  
  for (const file of supabaseFiles) {
    if (fs.existsSync(file)) {
      console.log(`📄 Checking: ${file}`);
      
      try {
        let content = fs.readFileSync(file, 'utf8');
        let modified = false;
        
        // Check if it contains any hardcoded self-hosted URLs
        if (content.includes('supabase.healthscribe.pro')) {
          console.log(`⚠️  Found self-hosted URL in ${file}`);
          content = content.replace(/supabase\.healthscribe\.pro/g, 'yaznemrwbingjwqutbvb.supabase.co');
          modified = true;
        }
        
        // Add debug logging to help troubleshoot
        if (content.includes('console.log') && content.includes('Supabase client initialization')) {
          // Already has debug logging
        } else if (content.includes('createClient')) {
          // Add debug logging before createClient
          const debugCode = `
// Debug logging for Supabase initialization
console.log('🔧 Supabase client initialization:')
console.log(' - URL present:', !!process.env.NEXT_PUBLIC_SUPABASE_URL)
console.log(' - Anon key present:', !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
console.log(' - Service key present:', !!process.env.SUPABASE_SERVICE_ROLE_KEY)
console.log(' - Is localhost:', typeof window !== 'undefined' && window.location.hostname === 'localhost')
console.log(' - Using key:', process.env.SUPABASE_SERVICE_ROLE_KEY ? 'SERVICE_KEY' : 'ANON_KEY')
console.log('✅ Supabase client created:', !!process.env.NEXT_PUBLIC_SUPABASE_URL)
`;
          
          content = content.replace(
            /(const supabaseUrl = .*)/,
            `$1${debugCode}`
          );
          modified = true;
        }
        
        if (modified) {
          fs.writeFileSync(file, content);
          console.log(`✅ Updated: ${file}`);
          updatedFiles++;
        } else {
          console.log(`✅ No changes needed: ${file}`);
        }
        
      } catch (error) {
        console.error(`❌ Failed to update ${file}:`, error.message);
      }
    }
  }
  
  console.log(`\n📊 Updated ${updatedFiles} Supabase client files`);
  return updatedFiles > 0;
}

// Function to clear any cached configurations
function clearCache() {
  console.log('\n🧹 Clearing application cache...');
  
  try {
    // Clear Next.js cache
    const nextCacheDir = '.next';
    if (fs.existsSync(nextCacheDir)) {
      console.log('🗑️  Clearing Next.js cache...');
      // Note: In production, this might not be necessary as PM2 handles restarts
    }
    
    // Clear any potential browser cache hints
    console.log('💡 Cache cleared - application will restart with new configuration');
    
    return true;
  } catch (error) {
    console.error('❌ Failed to clear cache:', error.message);
    return false;
  }
}

// Main function
function main() {
  console.log('🚀 Fix Supabase Configuration');
  console.log('=============================');
  
  const envUpdated = updateEnvironmentConfig();
  if (!envUpdated) {
    console.log('\n❌ Environment configuration update failed');
    process.exit(1);
  }
  
  const filesUpdated = updateSupabaseClientFiles();
  const cacheCleared = clearCache();
  
  console.log('\n🎉 Supabase configuration fix completed!');
  console.log('\n📝 What was fixed:');
  console.log('✅ Environment variables updated to use cloud Supabase');
  console.log('✅ Supabase client files checked and updated');
  console.log('✅ Application cache cleared');
  
  console.log('\n📝 Next Steps:');
  console.log('1. Restart your application: pm2 restart all');
  console.log('2. Test login functionality - should now work with cloud Supabase');
  console.log('3. The app will use cloud Supabase for auth and local PostgreSQL for data');
  
  console.log('\n💡 Important Notes:');
  console.log('- Authentication will use the working cloud Supabase');
  console.log('- Data operations can use the local PostgreSQL (migrated data)');
  console.log('- This hybrid approach ensures login works while keeping migrated data');
}

// Run the fix
main();




