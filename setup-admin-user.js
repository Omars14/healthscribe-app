const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

// Initialize Supabase client with service role key for admin access
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables!');
  console.error('Make sure you have:');
  console.error('  - NEXT_PUBLIC_SUPABASE_URL');
  console.error('  - SUPABASE_SERVICE_ROLE_KEY');
  console.error('in your .env.local file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false
  }
});

async function setupAdminUser() {
  const adminEmail = 'omars14@gmail.com'; // Your email
  
  console.log('🔧 Setting up admin user...\n');
  console.log(`Email: ${adminEmail}`);
  
  try {
    // First, check if user exists in auth.users
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
    
    if (authError) {
      console.error('❌ Error fetching users:', authError.message);
      return;
    }
    
    const user = authUsers.users.find(u => u.email === adminEmail);
    
    if (!user) {
      console.error(`❌ User with email ${adminEmail} not found in auth.users`);
      console.log('\n📝 Please make sure you have signed up with this email first.');
      return;
    }
    
    console.log(`✅ Found user: ${user.id}`);
    
    // Check if user_profiles entry exists
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', user.id)
      .single();
    
    if (profileError && profileError.code !== 'PGRST116') {
      console.error('❌ Error checking user profile:', profileError.message);
      return;
    }
    
    if (!profile) {
      // Create user profile
      console.log('📝 Creating user profile...');
      const { error: insertError } = await supabase
        .from('user_profiles')
        .insert({
          id: user.id,
          email: user.email,
          full_name: user.user_metadata?.name || 'Admin User',
          role: 'admin',
          is_active: true
        });
      
      if (insertError) {
        console.error('❌ Error creating user profile:', insertError.message);
        return;
      }
      
      console.log('✅ User profile created with admin role!');
    } else {
      // Update existing profile
      console.log('📝 Updating existing user profile...');
      console.log(`Current role: ${profile.role}`);
      
      const { error: updateError } = await supabase
        .from('user_profiles')
        .update({ 
          role: 'admin',
          is_active: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);
      
      if (updateError) {
        console.error('❌ Error updating user profile:', updateError.message);
        return;
      }
      
      console.log('✅ User profile updated to admin role!');
    }
    
    // Verify the update
    const { data: updatedProfile, error: verifyError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', user.id)
      .single();
    
    if (verifyError) {
      console.error('❌ Error verifying update:', verifyError.message);
      return;
    }
    
    console.log('\n✨ Success! Admin user setup complete:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`Email: ${updatedProfile.email}`);
    console.log(`Role: ${updatedProfile.role}`);
    console.log(`Active: ${updatedProfile.is_active}`);
    console.log(`User ID: ${updatedProfile.id}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('\n🚀 You can now access the admin panel at:');
    console.log('   /dashboard/admin/users');
    console.log('\n⚠️  Note: You may need to log out and log back in for changes to take effect.');
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

// Run the setup
setupAdminUser();
