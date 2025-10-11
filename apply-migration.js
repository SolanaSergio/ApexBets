require('dotenv').config()
const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')

async function applyMigration() {
  try {
    const filePath = process.argv[2]
    if (!filePath) {
      console.error('❌ Please provide a path to the migration file.')
      return
    }

    if (!fs.existsSync(filePath)) {
      console.error(`❌ Migration file not found at: ${filePath}`)
      return
    }

    console.log(`🔧 Applying database migration from: ${filePath}`)

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    )

    // Read the SQL file
    const sql = fs.readFileSync(filePath, 'utf8')

    // Split the SQL into individual statements
    const statements = sql
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'))

    console.log(`📝 Found ${statements.length} SQL statements to execute`)

    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i]
      if (statement.trim()) {
        try {
          console.log(`⏳ Executing statement ${i + 1}/${statements.length}...`)
          const { data, error } = await supabase.rpc('execute_sql', { sql: statement })

          if (error) {
            console.error(`❌ Error in statement ${i + 1}:`, error)
            // Continue with next statement
          } else {
            console.log(`✅ Statement ${i + 1} executed successfully`)
          }
        } catch (err) {
          console.error(`💥 Exception in statement ${i + 1}:`, err.message)
        }
      }
    }

    console.log('🎉 Migration completed!')
  } catch (error) {
    console.error('💥 Migration failed:', error)
  }
}

applyMigration()
