#!/usr/bin/env node

const { Client } = require('ssh2');

const SSH_CONFIG = {
  host: '154.26.155.207',
  port: 22,
  username: 'root',
  password: 'Nomar123'
};

function executeCommand(conn, command, description) {
  return new Promise((resolve, reject) => {
    if (description) console.log(`\n🔧 ${description}...`);
    
    conn.exec(command, (err, stream) => {
      if (err) {
        reject(err);
        return;
      }

      let output = '';
      let errorOutput = '';

      stream.on('close', (code, signal) => {
        resolve({ output, errorOutput, code });
      }).on('data', (data) => {
        output += data.toString();
        process.stdout.write(data.toString());
      }).stderr.on('data', (data) => {
        errorOutput += data.toString();
      });
    });
  });
}

async function main() {
  console.log('🔍 Finding Your Transcription Data...\n');

  const conn = new Client();

  try {
    await new Promise((resolve, reject) => {
      conn.on('ready', () => {
        console.log('✅ SSH Connected\n');
        resolve();
      }).on('error', reject).connect(SSH_CONFIG);
    });

    // Check ALL database containers thoroughly
    console.log('='.repeat(70));
    console.log('Checking ALL Database Containers');
    console.log('='.repeat(70));
    
    await executeCommand(conn, `
      echo "Finding all PostgreSQL containers..."
      DB_CONTAINERS=\$(docker ps --filter "name=db" --format "{{.Names}}")
      
      for DB in \$DB_CONTAINERS; do
        echo ""
        echo "=========================================="
        echo "Database: \$DB"
        echo "=========================================="
        
        # Try to connect and check tables
        docker exec \$DB psql -U postgres -d postgres -c "
          SELECT 
            schemaname, 
            tablename, 
            pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
          FROM pg_tables 
          WHERE tablename LIKE '%transcript%' OR tablename LIKE '%user%'
          ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
        " 2>/dev/null || echo "Cannot access this database"
        
        # Check transcriptions count
        TRANS_COUNT=\$(docker exec \$DB psql -U postgres -d postgres -tAc "
          SELECT COUNT(*) FROM public.transcriptions;
        " 2>/dev/null)
        
        if [ -n "\$TRANS_COUNT" ] && [ "\$TRANS_COUNT" != "0" ]; then
          echo "✅ FOUND DATA: \$TRANS_COUNT transcriptions!"
          
          # Get user's transcriptions
          docker exec \$DB psql -U postgres -d postgres -c "
            SELECT 
              user_id,
              COUNT(*) as count,
              MIN(created_at) as first,
              MAX(created_at) as last
            FROM public.transcriptions
            GROUP BY user_id
            ORDER BY count DESC;
          " 2>/dev/null
        fi
      done
    `, 'Checking all databases');

    // Also check if data might be in a different schema or database name
    console.log('\n' + '='.repeat(70));
    console.log('Checking Alternative Databases');
    console.log('='.repeat(70));
    
    await executeCommand(conn, `
      echo "Checking all databases in supabase_db_supabase..."
      docker exec supabase_db_supabase psql -U postgres -c "\\l" 2>/dev/null
      
      echo ""
      echo "Checking if data is in 'postgres' vs 'supabase' database..."
      docker exec supabase_db_supabase psql -U postgres -l 2>/dev/null | grep -E "postgres|supabase|transcription"
    `, 'Checking database names');

    // Check if maybe the transcriptions are in the e088 instance with proper connection
    console.log('\n' + '='.repeat(70));
    console.log('Deep Check of E088 Instance');
    console.log('='.repeat(70));
    
    await executeCommand(conn, `
      echo "Connecting to e088 database with all possible database names..."
      
      for DBNAME in postgres supabase transcription_db medical_transcription; do
        echo ""
        echo "Trying database: \$DBNAME"
        RESULT=\$(docker exec supabase-db-e088wwks88k8k48sccg8gk0o psql -U postgres -d \$DBNAME -tAc "
          SELECT COUNT(*) FROM public.transcriptions;
        " 2>/dev/null)
        
        if [ -n "\$RESULT" ] && [ "\$RESULT" != "0" ]; then
          echo "✅ FOUND: \$RESULT transcriptions in \$DBNAME!"
          
          docker exec supabase-db-e088wwks88k8k48sccg8gk0o psql -U postgres -d \$DBNAME -c "
            SELECT user_id, COUNT(*) 
            FROM public.transcriptions 
            GROUP BY user_id;
          "
        fi
      done
    `, 'Deep checking e088');

    // Check the 2 week old instance too
    console.log('\n' + '='.repeat(70));
    console.log('Deep Check of 2-Week Instance');
    console.log('='.repeat(70));
    
    await executeCommand(conn, `
      echo "Checking supabase_db_supabase with all database names..."
      
      for DBNAME in postgres supabase transcription_db medical_transcription; do
        echo ""
        echo "Trying database: \$DBNAME"
        RESULT=\$(docker exec supabase_db_supabase psql -U postgres -d \$DBNAME -tAc "
          SELECT COUNT(*) FROM public.transcriptions;
        " 2>/dev/null)
        
        if [ -n "\$RESULT" ] && [ "\$RESULT" != "0" ]; then
          echo "✅ FOUND: \$RESULT transcriptions in \$DBNAME!"
          
          docker exec supabase_db_supabase psql -U postgres -d \$DBNAME -c "
            SELECT user_id, COUNT(*), MAX(created_at) as latest
            FROM public.transcriptions 
            GROUP BY user_id;
          "
        fi
      done
    `, 'Deep checking 2-week instance');

    // Check if we're connected to Supabase Cloud instead
    console.log('\n' + '='.repeat(70));
    console.log('Checking if Using Cloud Supabase');
    console.log('='.repeat(70));
    
    await executeCommand(conn, `
      echo "Checking application logs for Supabase connection..."
      APP_CONTAINER=\$(docker ps --filter "name=tkwoos4" --format "{{.Names}}" | head -1)
      
      if [ -n "\$APP_CONTAINER" ]; then
        echo "App container: \$APP_CONTAINER"
        echo "Recent logs mentioning Supabase:"
        docker logs \$APP_CONTAINER 2>&1 | grep -i supabase | tail -10
      fi
    `, 'Checking app logs');

    conn.end();
    console.log('\n✅ SSH session closed');

    console.log('\n' + '='.repeat(80));
    console.log('📊 NEXT STEPS');
    console.log('='.repeat(80));
    
    console.log('\nBased on the output above, I will:');
    console.log('1. Identify which database has your transcriptions');
    console.log('2. Configure the application to use that database');
    console.log('3. Fix RLS policies on the correct database');
    console.log('4. Restart the application');
    console.log('');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  }
}

main();

