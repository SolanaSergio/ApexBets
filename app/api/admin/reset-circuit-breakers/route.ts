import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { databaseCacheService } from '@/lib/services/database-cache-service'

export async function POST(_request: NextRequest) {
  try {
    const supabase = await createClient()
    
    if (!supabase) {
      return NextResponse.json({ 
        success: false,
        error: "Database connection failed" 
      }, { status: 500 })
    }

    console.log('🔄 Resetting circuit breakers and error states...')
    
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

    // Clear database cache
    await databaseCacheService.delete('*');
    console.log('✅ Cleared database cache');

    return NextResponse.json({
      success: true,
      message: "Circuit breakers reset successfully",
      timestamp: new Date().toISOString(),
      note: "In-memory circuit breakers will reset on next server restart"
    })

  } catch (error) {
    console.error('❌ Error resetting circuit breakers:', error)
    return NextResponse.json({
      success: false,
      error: "Failed to reset circuit breakers",
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
