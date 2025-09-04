const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function createUserProfilesTable() {
  console.log('Creating user_profiles table...\n');
  
  // First, check if table exists
  const { data: existing, error: checkError } = await supabase
    .from('user_profiles')
    .select('id')
    .limit(1);
  
  if (!checkError || !checkError.message.includes('not found')) {
    console.log('✅ Table user_profiles already exists');
    return;
  }
  
  console.log('Table does not exist, creating it now...');
  
  // Since we can't execute raw SQL directly, we'll need to do this via Supabase dashboard
  // But we can create a workaround by using the Supabase API
  
  console.log(`
⚠️  The user_profiles table needs to be created manually in Supabase.

Please go to your Supabase dashboard:
1. Navigate to: https://supabase.com/dashboard/project/yaznemrwbingjwqutbvb/sql/new
2. Copy and paste the following SQL:

-- Create the user_profiles table
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  role TEXT DEFAULT 'transcriptionist',
  assigned_editor_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Enable RLS
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- Create basic policies
CREATE POLICY "Users can view own profile" ON public.user_profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.user_profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.user_profiles
  FOR UPDATE USING (auth.uid() = id);

-- Insert profile for current users
INSERT INTO public.user_profiles (id, email, role)
SELECT id, email, 'transcriptionist'
FROM auth.users
WHERE id NOT IN (SELECT id FROM public.user_profiles)
ON CONFLICT (id) DO NOTHING;

3. Click "Run" to execute the SQL

Alternatively, you can use the Supabase CLI:
supabase db push --db-url "postgresql://postgres:your-password@db.yaznemrwbingjwqutbvb.supabase.co:5432/postgres"
  `);
}

createUserProfilesTable();
