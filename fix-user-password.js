#!/usr/bin/env node

const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);

const SSH_HOST = '154.26.155.207';
const SSH_USER = 'root';
const SSH_PASS = 'Nomar123';

async function main() {
  console.log('🔐 Fixing user password...\n');

  try {
    const fixCmd = `
      sshpass -p '${SSH_PASS}' ssh -o StrictHostKeyChecking=no ${SSH_USER}@${SSH_HOST} << 'ENDSSH'
        DB_CONTAINER=\$(docker ps --filter "name=supabase_db_supabase" --format "{{.Names}}" | head -1)
        
        if [ -z "\$DB_CONTAINER" ]; then
          echo "❌ Database container not found"
          exit 1
        fi
        
        echo "✅ Using database: \$DB_CONTAINER"
        echo ""
        
        echo "📋 Current user state:"
        docker exec \$DB_CONTAINER psql -U postgres -d postgres -c "
          SELECT 
            id,
            email,
            encrypted_password IS NOT NULL as has_password,
            email_confirmed_at IS NOT NULL as email_confirmed,
            created_at
          FROM auth.users 
          WHERE email = 'omars14@gmail.com';
        "
        
        echo ""
        echo "🔄 Resetting password to: Nomar123"
        
        # Generate password hash using Postgres crypt
        # Supabase uses bcrypt for password hashing
        docker exec \$DB_CONTAINER psql -U postgres -d postgres << 'EOSQL'
          -- Update password using bcrypt (Supabase's default)
          -- Password: Nomar123
          -- This is a pre-generated bcrypt hash for "Nomar123"
          UPDATE auth.users 
          SET 
            encrypted_password = crypt('Nomar123', gen_salt('bf')),
            email_confirmed_at = COALESCE(email_confirmed_at, NOW()),
            confirmed_at = COALESCE(confirmed_at, NOW()),
            updated_at = NOW()
          WHERE email = 'omars14@gmail.com';
EOSQL
        
        echo ""
        echo "✅ Password updated"
        
        echo ""
        echo "📋 Verifying update:"
        docker exec \$DB_CONTAINER psql -U postgres -d postgres -c "
          SELECT 
            id,
            email,
            encrypted_password IS NOT NULL as has_password,
            email_confirmed_at IS NOT NULL as email_confirmed,
            confirmed_at IS NOT NULL as confirmed
          FROM auth.users 
          WHERE email = 'omars14@gmail.com';
        "
        
        echo ""
        echo "📋 User profile:"
        docker exec \$DB_CONTAINER psql -U postgres -d postgres -c "
          SELECT id, email, role, created_at 
          FROM public.user_profiles 
          WHERE email = 'omars14@gmail.com';
        "
ENDSSH
    `;

    const { stdout } = await execAsync(fixCmd);
    console.log(stdout);

    console.log('\n' + '='.repeat(80));
    console.log('✅ PASSWORD RESET COMPLETE');
    console.log('='.repeat(80));
    console.log('\n📝 LOGIN CREDENTIALS:');
    console.log('Email: omars14@gmail.com');
    console.log('Password: Nomar123');
    console.log('\n🌐 NOW TRY LOGGING IN:');
    console.log('1. Go to: https://healthscribe.pro/login');
    console.log('2. Use the credentials above');
    console.log('3. Should redirect to dashboard');
    console.log('4. Check transcription count');
    console.log('');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  }
}

main();

