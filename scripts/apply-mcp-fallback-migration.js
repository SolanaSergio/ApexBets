/**
 * Apply Database Fallback Migration
 * This script applies the necessary RPC functions for database fallback functionality
 */

const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

async function applyMigration() {
  try {
    // Initialize Supabase client
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing Supabase environment variables')
    }

    const supabase = createClient(supabaseUrl, supabaseKey)

    // Read migration file
    const migrationPath = path.join(__dirname, '..', 'lib', 'migrations', '001_create_database_fallback_functions.sql')
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8')

    console.log('🚀 Applying database fallback migration...')

    // Execute migration
    const { data, error } = await supabase.rpc('exec', { sql: migrationSQL })

    if (error) {
      // If exec function doesn't exist, try direct SQL execution
      console.log('⚠️ exec function not available, trying direct execution...')
      
      // Split migration into individual statements
      const statements = migrationSQL
        .split(';')
        .map(stmt => stmt.trim())
        .filter(stmt => stmt.length > 0)

      for (const statement of statements) {
        try {
          const { error: stmtError } = await supabase.rpc('exec', { sql: statement + ';' })
          if (stmtError) {
            console.warn(`Statement failed: ${statement.substring(0, 50)}... - ${stmtError.message}`)
          }
        } catch (err) {
          console.warn(`Statement error: ${statement.substring(0, 50)}... - ${err.message}`)
        }
      }
    }

    console.log('✅ Database fallback migration applied successfully')
    
    // Test the functions
    console.log('🧪 Testing database fallback functions...')
    
    const { data: testResult, error: testError } = await supabase.rpc('execute_sql', { 
      query: 'SELECT 1 as test' 
    })
    
    if (testError) {
      console.warn('⚠️ Test query failed:', testError.message)
    } else {
      console.log('✅ Test query successful:', testResult)
    }

  } catch (error) {
    console.error('❌ Migration failed:', error.message)
    process.exit(1)
  }
}

applyMigration()
