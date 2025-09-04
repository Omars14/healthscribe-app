const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Test your Supabase connection
async function testSupabaseConnection() {
  console.log('🔍 Testing Supabase Connection...\n');

  // Get credentials from environment variables
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  // Check if credentials exist
  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Missing Supabase credentials!');
    console.log('\nPlease check your .env.local file has:');
    console.log('- NEXT_PUBLIC_SUPABASE_URL');
    console.log('- SUPABASE_SERVICE_ROLE_KEY');
    return;
  }

  console.log('✅ Credentials found:');
  console.log(`- URL: ${supabaseUrl}`);
  console.log(`- Service Key: ${supabaseServiceKey.substring(0, 20)}...`);
  console.log('\n');

  try {
    // Create Supabase client with service role key
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    // Test 1: List all tables
    console.log('📊 Test 1: Fetching database schema...');
    const { data: tables, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public');

    if (tablesError) {
      // Try alternative method
      console.log('Trying alternative method...');
      
      // Test with transcriptions table directly
      const { data: testData, error: testError } = await supabase
        .from('transcriptions')
        .select('id')
        .limit(1);

      if (testError) {
        console.error('❌ Failed to connect to database:', testError.message);
        console.log('\nPossible issues:');
        console.log('1. Service Role Key might be incorrect');
        console.log('2. Database might not be accessible');
        console.log('3. RLS policies might be blocking access');
        return;
      } else {
        console.log('✅ Successfully connected to transcriptions table!');
      }
    } else {
      console.log('✅ Found tables:', tables?.map(t => t.table_name).join(', '));
    }

    // Test 2: Check transcriptions table structure
    console.log('\n📋 Test 2: Checking transcriptions table...');
    const { data: transcriptions, error: transcriptionsError } = await supabase
      .from('transcriptions')
      .select('*')
      .limit(1);

    if (transcriptionsError) {
      console.error('❌ Error accessing transcriptions table:', transcriptionsError.message);
    } else {
      console.log('✅ Transcriptions table is accessible');
      if (transcriptions && transcriptions.length > 0) {
        console.log('Sample columns:', Object.keys(transcriptions[0]).join(', '));
      }
    }

    // Test 3: Check document_templates table
    console.log('\n📄 Test 3: Checking document_templates table...');
    const { data: templates, error: templatesError } = await supabase
      .from('document_templates')
      .select('*')
      .limit(1);

    if (templatesError) {
      console.error('❌ Error accessing document_templates table:', templatesError.message);
      console.log('Note: This table might not exist yet. Run supabase-medical-migration.sql to create it.');
    } else {
      console.log('✅ Document templates table is accessible');
      if (templates && templates.length > 0) {
        console.log('Sample columns:', Object.keys(templates[0]).join(', '));
      }
    }

    // Test 4: Check storage bucket
    console.log('\n📦 Test 4: Checking storage bucket...');
    const { data: buckets, error: bucketsError } = await supabase
      .storage
      .listBuckets();

    if (bucketsError) {
      console.error('❌ Error accessing storage:', bucketsError.message);
    } else {
      console.log('✅ Storage buckets found:', buckets.map(b => b.name).join(', '));
      
      // Check for audio-files bucket
      const audioFilesBucket = buckets.find(b => b.name === 'audio-files');
      if (audioFilesBucket) {
        console.log('✅ audio-files bucket exists!');
      } else {
        console.log('⚠️ audio-files bucket not found. Run setup-supabase.js to create it.');
      }
    }

    console.log('\n✨ Connection test complete!\n');
    console.log('📝 Summary for n8n configuration:');
    console.log('--------------------------------');
    console.log(`Supabase URL: ${supabaseUrl}`);
    console.log(`Service Role Key: ${supabaseServiceKey.substring(0, 20)}...`);
    console.log('\nUse these exact values in your n8n Supabase credentials.');
    console.log('\n⚠️ Important: Make sure you use the SERVICE ROLE key, not the ANON key!');

  } catch (error) {
    console.error('❌ Unexpected error:', error);
    console.log('\nPlease check:');
    console.log('1. Your internet connection');
    console.log('2. Supabase project is active');
    console.log('3. Credentials are correct');
  }
}

// Run the test
testSupabaseConnection();
