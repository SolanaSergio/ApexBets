/**
 * Webhook Deduplication System
 * Prevents duplicate webhook processing using in-memory and persistent storage
 */

import { createClient } from '../supabase/server'

interface ProcessedWebhook {
  hash: string
  requestId: string
  timestamp: Date
  eventType: string
  processed: boolean
}

/**
 * Webhook Deduplicator
 * Manages webhook deduplication using both memory cache and database storage
 */
export class WebhookDeduplicator {
  private static memoryCache = new Map<string, ProcessedWebhook>()
  private static readonly MEMORY_TTL = 5 * 60 * 1000 // 5 minutes
  private static readonly DB_TTL = 24 * 60 * 60 * 1000 // 24 hours

  /**
   * Checks if a webhook has already been processed
   * @param hash - The webhook hash
   * @param requestId - The request ID
   * @returns Promise<boolean> indicating if webhook is duplicate
   */
  static async isDuplicate(hash: string, requestId: string): Promise<boolean> {
    // Check memory cache first (fastest)
    const memoryEntry = this.memoryCache.get(hash)
    if (memoryEntry && memoryEntry.processed) {
      console.log(`[${requestId}] Duplicate webhook detected in memory cache: ${hash}`)
      return true
    }

    // Check database for longer-term deduplication
    try {
      const supabase = await createClient()
      if (!supabase) {
        console.warn(`[${requestId}] Supabase client not available for deduplication check`)
        return false
      }

      const { data, error } = await supabase
        .from('webhook_processing_log')
        .select('hash, processed, created_at')
        .eq('hash', hash)
        .eq('processed', true)
        .gte('created_at', new Date(Date.now() - this.DB_TTL).toISOString())
        .single()

      if (error && error.code !== 'PGRST116') {
        // PGRST116 = no rows returned
        console.error(`[${requestId}] Error checking webhook deduplication:`, error)
        return false
      }

      if (data) {
        console.log(`[${requestId}] Duplicate webhook detected in database: ${hash}`)
        // Add to memory cache for faster future lookups
        this.memoryCache.set(hash, {
          hash,
          requestId,
          timestamp: new Date(data.created_at),
          eventType: 'unknown',
          processed: true,
        })
        return true
      }

      return false
    } catch (error) {
      console.error(`[${requestId}] Error in deduplication check:`, error)
      return false
    }
  }

  /**
   * Marks a webhook as being processed
   * @param hash - The webhook hash
   * @param requestId - The request ID
   * @param eventType - The webhook event type
   */
  static async markProcessing(hash: string, requestId: string, eventType: string): Promise<void> {
    // Add to memory cache
    this.memoryCache.set(hash, {
      hash,
      requestId,
      timestamp: new Date(),
      eventType,
      processed: false,
    })

    // Add to database
    try {
      const supabase = await createClient()
      if (!supabase) {
        console.warn(`[${requestId}] Supabase client not available for processing log`)
        return
      }

      await supabase.from('webhook_processing_log').insert({
        hash,
        request_id: requestId,
        event_type: eventType,
        processed: false,
        created_at: new Date().toISOString(),
      })
    } catch (error) {
      console.error(`[${requestId}] Error marking webhook as processing:`, error)
    }
  }

  /**
   * Marks a webhook as successfully processed
   * @param hash - The webhook hash
   * @param requestId - The request ID
   * @param processingTimeMs - Time taken to process in milliseconds
   */
  static async markProcessed(
    hash: string,
    requestId: string,
    processingTimeMs?: number
  ): Promise<void> {
    // Update memory cache
    const memoryEntry = this.memoryCache.get(hash)
    if (memoryEntry) {
      memoryEntry.processed = true
    }

    // Update database
    try {
      const supabase = await createClient()
      if (!supabase) {
        console.warn(`[${requestId}] Supabase client not available for processing log update`)
        return
      }

      await supabase
        .from('webhook_processing_log')
        .update({
          processed: true,
          processing_time_ms: processingTimeMs,
          completed_at: new Date().toISOString(),
        })
        .eq('hash', hash)
        .eq('request_id', requestId)
    } catch (error) {
      console.error(`[${requestId}] Error marking webhook as processed:`, error)
    }
  }

  /**
   * Marks a webhook as failed processing
   * @param hash - The webhook hash
   * @param requestId - The request ID
   * @param error - The error that occurred
   */
  static async markFailed(hash: string, requestId: string, error: string): Promise<void> {
    // Update database
    try {
      const supabase = await createClient()
      if (!supabase) {
        console.warn(`[${requestId}] Supabase client not available for processing log update`)
        return
      }

      await supabase
        .from('webhook_processing_log')
        .update({
          processed: false,
          error_message: error,
          completed_at: new Date().toISOString(),
        })
        .eq('hash', hash)
        .eq('request_id', requestId)
    } catch (dbError) {
      console.error(`[${requestId}] Error marking webhook as failed:`, dbError)
    }
  }

  /**
   * Cleans up old entries from memory cache
   */
  static cleanupMemoryCache(): void {
    const now = Date.now()
    const expiredEntries: string[] = []

    for (const [hash, entry] of this.memoryCache.entries()) {
      if (now - entry.timestamp.getTime() > this.MEMORY_TTL) {
        expiredEntries.push(hash)
      }
    }

    expiredEntries.forEach(hash => {
      this.memoryCache.delete(hash)
    })

    if (expiredEntries.length > 0) {
      console.log(`Cleaned up ${expiredEntries.length} expired webhook cache entries`)
    }
  }

  /**
   * Gets processing statistics
   * @returns Object with deduplication statistics
   */
  static getStats(): {
    memoryCacheSize: number
    oldestEntry: Date | null
    newestEntry: Date | null
  } {
    const entries = Array.from(this.memoryCache.values())

    return {
      memoryCacheSize: entries.length,
      oldestEntry:
        entries.length > 0 ? new Date(Math.min(...entries.map(e => e.timestamp.getTime()))) : null,
      newestEntry:
        entries.length > 0 ? new Date(Math.max(...entries.map(e => e.timestamp.getTime()))) : null,
    }
  }
}

// Cleanup memory cache every 5 minutes
setInterval(
  () => {
    WebhookDeduplicator.cleanupMemoryCache()
  },
  5 * 60 * 1000
)
