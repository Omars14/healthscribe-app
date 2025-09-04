import { supabase } from './supabase'

export async function initializeDatabase() {
  try {
    console.log('Checking database schema...')
    
    // Check if the transcriptions table has all required columns
    const { data: columns, error: columnsError } = await supabase
      .from('transcriptions')
      .select('*')
      .limit(0)
    
    if (columnsError && columnsError.message.includes("Could not find the 'status' column")) {
      console.log('Missing columns detected. Updating schema...')
      
      // Add missing columns using raw SQL through Supabase
      const updates = [
        `ALTER TABLE transcriptions ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'pending'`,
        `ALTER TABLE transcriptions ADD COLUMN IF NOT EXISTS file_size BIGINT`,
        `ALTER TABLE transcriptions ADD COLUMN IF NOT EXISTS error TEXT`,
        `ALTER TABLE transcriptions ADD COLUMN IF NOT EXISTS metadata JSONB`,
        `ALTER TABLE transcriptions ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()`
      ]
      
      // Note: You'll need to run these SQL commands directly in Supabase SQL Editor
      console.log('Please run the following SQL commands in your Supabase SQL Editor:')
      updates.forEach(sql => console.log(sql))
      
      return {
        success: false,
        message: 'Database schema needs to be updated. Please check the console for SQL commands.'
      }
    }
    
    console.log('Database schema is up to date')
    return {
      success: true,
      message: 'Database schema is ready'
    }
    
  } catch (error) {
    console.error('Database initialization error:', error)
    return {
      success: false,
      message: 'Failed to initialize database',
      error
    }
  }
}

// Check database on module load
if (typeof window !== 'undefined') {
  initializeDatabase().then(result => {
    if (!result.success) {
      console.warn('Database initialization warning:', result.message)
    }
  })
}
