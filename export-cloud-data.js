#!/usr/bin/env node

// Export all data from cloud Supabase to JSON files
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Cloud Supabase credentials
const supabaseUrl = 'https://yaznemrwbingjwqutbvb.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inlhem5lbXJ3YmluZ2p3cXV0YnZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTQ2MDQzMCwiZXhwIjoyMDcxMDM2NDMwfQ.9Ib029SJ7rGbBI4JMoEKacX4LMOZbzOedDZ9JGtuXas';

const supabase = createClient(supabaseUrl, supabaseKey);

async function exportTable(tableName, options = {}) {
  console.log(`📤 Exporting ${tableName}...`);

  try {
    let query = supabase.from(tableName).select('*');

    if (options.orderBy) {
      query = query.order(options.orderBy);
    }

    const { data, error } = await query;

    if (error) {
      console.error(`❌ Error exporting ${tableName}:`, error);
      return null;
    }

    console.log(`✅ Exported ${data.length} records from ${tableName}`);

    // Save to file
    const filename = `${tableName}.json`;
    fs.writeFileSync(filename, JSON.stringify(data, null, 2));
    console.log(`💾 Saved to ${filename}`);

    return data;
  } catch (err) {
    console.error(`❌ Error exporting ${tableName}:`, err);
    return null;
  }
}

async function exportAllData() {
  console.log('🚀 Starting data export from cloud Supabase...\n');

  const tables = [
    'auth.users',
    'public.user_profiles',
    'public.transcriptions',
    'public.transcription_edits',
    'public.document_templates',
    'public.transcription_metrics',
    'public.transcriptions_with_format'
  ];

  const exportedData = {};

  for (const table of tables) {
    try {
      const data = await exportTable(table.replace('auth.', '').replace('public.', ''));
      if (data) {
        exportedData[table] = data;
      }
    } catch (err) {
      console.error(`❌ Failed to export ${table}:`, err);
    }
  }

  // Save summary
  const summary = {
    exportDate: new Date().toISOString(),
    tables: Object.keys(exportedData),
    recordCounts: Object.fromEntries(
      Object.entries(exportedData).map(([table, data]) => [table, data.length])
    ),
    totalRecords: Object.values(exportedData).reduce((sum, data) => sum + data.length, 0)
  };

  fs.writeFileSync('export-summary.json', JSON.stringify(summary, null, 2));
  console.log('\n📊 Export Summary:');
  console.log(`   Total tables: ${summary.tables.length}`);
  console.log(`   Total records: ${summary.totalRecords}`);
  console.log('   Tables:', summary.tables.join(', '));

  console.log('\n✅ Export complete! Files saved:');
  fs.readdirSync('.').filter(f => f.endsWith('.json')).forEach(file => {
    console.log(`   - ${file}`);
  });

  return exportedData;
}

// Run the export
exportAllData().catch(console.error);



