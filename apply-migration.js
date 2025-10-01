require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

async function applyMigration() {
  try {
    console.log('🔧 Applying database migration...');
    
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    // Read the SQL file
    const sql = fs.readFileSync('fix-database-schema.sql', 'utf8');
    
    // Split the SQL into individual statements
    const statements = sql
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

    console.log(`📝 Found ${statements.length} SQL statements to execute`);

    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (statement.trim()) {
        try {
          console.log(`⏳ Executing statement ${i + 1}/${statements.length}...`);
          const { data, error } = await supabase.rpc('execute_sql', { sql: statement });
          
          if (error) {
            console.error(`❌ Error in statement ${i + 1}:`, error);
            // Continue with next statement
          } else {
            console.log(`✅ Statement ${i + 1} executed successfully`);
          }
        } catch (err) {
          console.error(`💥 Exception in statement ${i + 1}:`, err.message);
        }
      }
    }

    console.log('🎉 Migration completed!');
    
    // Test the new tables
    console.log('🧪 Testing new tables...');
    
    const { data: players, error: playersError } = await supabase
      .from('players')
      .select('count')
      .limit(1);
    
    if (playersError) {
      console.error('❌ Players table test failed:', playersError);
    } else {
      console.log('✅ Players table is accessible');
    }

    const { data: predictions, error: predictionsError } = await supabase
      .from('predictions')
      .select('count')
      .limit(1);
    
    if (predictionsError) {
      console.error('❌ Predictions table test failed:', predictionsError);
    } else {
      console.log('✅ Predictions table is accessible');
    }

    const { data: rateLimits, error: rateLimitsError } = await supabase
      .from('api_rate_limits')
      .select('count')
      .limit(1);
    
    if (rateLimitsError) {
      console.error('❌ API rate limits table test failed:', rateLimitsError);
    } else {
      console.log('✅ API rate limits table is accessible');
    }

  } catch (error) {
    console.error('💥 Migration failed:', error);
  }
}

applyMigration();
