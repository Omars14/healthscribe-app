#!/usr/bin/env node

// Import JSON data to self-hosted PostgreSQL
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

// Self-hosted Supabase credentials (will be updated after setup)
const supabaseUrl = 'https://healthscribe.pro';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxvY2FsaG9zdCIsInJvbGUiOiJzZXJ2aWNlX3JvbGUiLCJpYXQiOjE2NDA5OTUyMDAsImV4cCI6MTk1NjM1NTIwMH0.EGIM96RAZx35lJzdJsyH-Qwv8Hdp7fsn3W0YpN81IU';

const supabase = createClient(supabaseUrl, supabaseKey);

async function importTable(tableName, jsonFile) {
  console.log(`📥 Importing ${tableName} from ${jsonFile}...`);

  try {
    // Read JSON file
    const data = JSON.parse(fs.readFileSync(jsonFile, 'utf8'));

    if (!Array.isArray(data) || data.length === 0) {
      console.log(`⚠️  No data found in ${jsonFile}, skipping...`);
      return;
    }

    console.log(`   Found ${data.length} records to import`);

    // Import in batches to avoid memory issues
    const batchSize = 100;
    let imported = 0;

    for (let i = 0; i < data.length; i += batchSize) {
      const batch = data.slice(i, i + batchSize);

      const { error } = await supabase
        .from(tableName)
        .insert(batch);

      if (error) {
        console.error(`❌ Error importing batch ${Math.floor(i/batchSize) + 1}:`, error);
        // Continue with next batch instead of failing completely
        continue;
      }

      imported += batch.length;
      console.log(`   ✅ Imported ${imported}/${data.length} records`);
    }

    console.log(`✅ Successfully imported ${imported} records to ${tableName}`);
    return imported;

  } catch (err) {
    console.error(`❌ Error importing ${tableName}:`, err);
    return 0;
  }
}

async function importAllData() {
  console.log('🚀 Starting data import to self-hosted PostgreSQL...\n');

  const imports = [
    { table: 'user_profiles', file: 'user_profiles.json' },
    { table: 'document_templates', file: 'document_templates.json' },
    { table: 'transcriptions', file: 'transcriptions.json' },
    { table: 'transcription_edits', file: 'transcription_edits.json' },
    { table: 'transcription_metrics', file: 'transcription_metrics.json' }
  ];

  let totalImported = 0;

  for (const { table, file } of imports) {
    if (fs.existsSync(file)) {
      const imported = await importTable(table, file);
      totalImported += imported || 0;
    } else {
      console.log(`⚠️  ${file} not found, skipping ${table}...`);
    }
  }

  console.log(`\n📊 Import Summary:`);
  console.log(`   Total records imported: ${totalImported}`);

  if (totalImported > 0) {
    console.log('✅ Data migration complete!');
  } else {
    console.log('⚠️  No data was imported. Check file paths and database connection.');
  }

  return totalImported;
}

// Handle auth errors gracefully
supabase.auth.onAuthStateChange((event, session) => {
  if (event === 'SIGNED_OUT' || !session) {
    console.log('⚠️  Auth session lost during import');
  }
});

// Run the import
importAllData()
  .then(() => {
    console.log('\n🎉 Import process finished!');
    process.exit(0);
  })
  .catch(err => {
    console.error('❌ Import failed:', err);
    process.exit(1);
  });



