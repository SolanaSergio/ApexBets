#!/usr/bin/env node

/**
 * Reset Circuit Breakers Script
 * Resets all circuit breakers and error states for APIs
 */

const { createClient } = require('@supabase/supabase-js')

// Load environment variables
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function resetCircuitBreakers() {
  console.log('🔄 Resetting circuit breakers and error states...')
  
  try {
    // Clear any error logs or failure counts from the database
    const { error: clearError } = await supabase
      .from('api_error_logs')
      .delete()
      .neq('id', '') // Delete all error logs
    
    if (clearError) {
      console.warn('⚠️  Could not clear error logs:', clearError.message)
    } else {
      console.log('✅ Cleared API error logs')
    }

    // Clear cache entries that might be stale
    const { error: clearCacheError } = await supabase
      .from('cache_entries')
      .delete()
      .lt('expires_at', new Date().toISOString())
    
    if (clearCacheError) {
      console.warn('⚠️  Could not clear expired cache:', clearCacheError.message)
    } else {
      console.log('✅ Cleared expired cache entries')
    }

    // Reset any rate limit tracking
    const { error: resetRateLimitError } = await supabase
      .from('rate_limit_tracking')
      .delete()
      .neq('id', '')
    
    if (resetRateLimitError) {
      console.warn('⚠️  Could not reset rate limit tracking:', resetRateLimitError.message)
    } else {
      console.log('✅ Reset rate limit tracking')
    }

    console.log('🎉 Circuit breakers reset successfully!')
    console.log('📝 Note: In-memory circuit breakers will reset on next server restart')
    
  } catch (error) {
    console.error('❌ Error resetting circuit breakers:', error.message)
    process.exit(1)
  }
}

// Run the reset
resetCircuitBreakers()
