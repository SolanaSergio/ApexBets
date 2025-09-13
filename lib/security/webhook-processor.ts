/**
 * Enhanced Webhook Processor
 * Handles webhook processing with validation, deduplication, and batch support
 */

import { createClient } from '@/lib/supabase/server'
import { dataSyncService } from '@/lib/services/data-sync-service'
import { WebhookValidator, type WebhookPayload, type BatchWebhookPayload } from './webhook-validator'
import { WebhookDeduplicator } from './webhook-deduplicator'

export interface ProcessingResult {
  success: boolean
  message: string
  requestId: string
  processingTimeMs: number
  errors?: string[]
  processed?: number
  skipped?: number
}

export interface WebhookProcessingContext {
  requestId: string
  clientIP: string
  userAgent?: string
  timestamp: Date
}

/**
 * Enhanced Webhook Processor
 * Provides comprehensive webhook processing with validation and error handling
 */
export class WebhookProcessor {
  /**
   * Processes a webhook payload with full validation and deduplication
   * @param payload - The validated webhook payload
   * @param context - Processing context information
   * @returns Promise<ProcessingResult>
   */
  static async processWebhook(
    payload: WebhookPayload, 
    context: WebhookProcessingContext
  ): Promise<ProcessingResult> {
    const startTime = Date.now()
    const { requestId } = context

    try {
      // Handle batch webhooks
      if (payload.type === 'batch') {
        return await this.processBatchWebhook(payload, context)
      }

      // Generate hash for deduplication
      const hash = WebhookValidator.generateHash(payload)

      // Check for duplicates
      const isDuplicate = await WebhookDeduplicator.isDuplicate(hash, requestId)
      if (isDuplicate) {
        return {
          success: true,
          message: 'Webhook already processed (duplicate)',
          requestId,
          processingTimeMs: Date.now() - startTime,
          skipped: 1
        }
      }

      // Mark as processing
      await WebhookDeduplicator.markProcessing(hash, requestId, payload.type)

      // Get Supabase client
      const supabase = await createClient()
      if (!supabase) {
        throw new Error('Database connection not available')
      }

      // Process based on webhook type
      let result: ProcessingResult
      switch (payload.type) {
        case 'game_update':
          result = await this.handleGameUpdate(supabase, payload, context)
          break
        case 'score_update':
          result = await this.handleScoreUpdate(supabase, payload, context)
          break
        case 'odds_update':
          result = await this.handleOddsUpdate(supabase, payload, context)
          break
        case 'team_update':
          result = await this.handleTeamUpdate(supabase, payload, context)
          break
        case 'player_update':
          result = await this.handlePlayerUpdate(supabase, payload, context)
          break
        case 'full_sync':
          result = await this.handleFullSync(payload, context)
          break
        default:
          throw new Error(`Unsupported webhook type: ${(payload as any).type}`)
      }

      // Mark as processed
      const processingTime = Date.now() - startTime
      await WebhookDeduplicator.markProcessed(hash, requestId, processingTime)

      return {
        ...result,
        processingTimeMs: processingTime
      }

    } catch (error) {
      const processingTime = Date.now() - startTime
      const errorMessage = error instanceof Error ? error.message : 'Unknown processing error'
      
      console.error(`[${requestId}] Webhook processing error:`, error)

      // Mark as failed if we have a hash
      try {
        const hash = WebhookValidator.generateHash(payload)
        await WebhookDeduplicator.markFailed(hash, requestId, errorMessage)
      } catch (hashError) {
        console.error(`[${requestId}] Error generating hash for failed webhook:`, hashError)
      }

      return {
        success: false,
        message: 'Webhook processing failed',
        requestId,
        processingTimeMs: processingTime,
        errors: [errorMessage]
      }
    }
  }

  /**
   * Processes batch webhook payloads
   */
  private static async processBatchWebhook(
    payload: BatchWebhookPayload,
    context: WebhookProcessingContext
  ): Promise<ProcessingResult> {
    const { requestId } = context
    const startTime = Date.now()
    
    console.log(`[${requestId}] Processing batch webhook with ${payload.events.length} events`)

    let processed = 0
    let skipped = 0
    const errors: string[] = []

    // Process each event in the batch
    for (let i = 0; i < payload.events.length; i++) {
      const event = payload.events[i]
      const eventContext = {
        ...context,
        requestId: `${requestId}_batch_${i}`
      }

      try {
        const result = await this.processWebhook(event, eventContext)
        if (result.success) {
          if (result.skipped) {
            skipped += result.skipped
          } else {
            processed++
          }
        } else {
          errors.push(`Event ${i}: ${result.message}`)
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error'
        errors.push(`Event ${i}: ${errorMessage}`)
      }
    }

    return {
      success: errors.length === 0,
      message: `Batch processing completed: ${processed} processed, ${skipped} skipped, ${errors.length} errors`,
      requestId,
      processingTimeMs: Date.now() - startTime,
      processed,
      skipped,
      errors: errors.length > 0 ? errors : []
    }
  }

  /**
   * Handles game update webhooks
   */
  private static async handleGameUpdate(
    supabase: any,
    payload: any,
    context: WebhookProcessingContext
  ): Promise<ProcessingResult> {
    const { requestId } = context
    const { data } = payload

    try {
      // Validate required fields
      if (!data.game_id) {
        throw new Error('Missing required field: game_id')
      }

      // Build update object with only provided fields
      const updateData: any = {
        updated_at: new Date().toISOString()
      }

      if (data.status !== undefined) updateData.status = data.status
      if (data.home_score !== undefined) updateData.home_score = data.home_score
      if (data.away_score !== undefined) updateData.away_score = data.away_score
      if (data.venue !== undefined) updateData.venue = data.venue
      if (data.game_date !== undefined) updateData.game_date = data.game_date
      if (data.period !== undefined) updateData.period = data.period
      if (data.time_remaining !== undefined) updateData.time_remaining = data.time_remaining
      if (data.attendance !== undefined) updateData.attendance = data.attendance
      if (data.weather !== undefined) updateData.weather = data.weather

      // Update game
      const { error, count } = await supabase
        .from('games')
        .update(updateData)
        .eq('id', data.game_id)

      if (error) {
        throw new Error(`Database error: ${error.message}`)
      }

      if (count === 0) {
        console.warn(`[${requestId}] Game ${data.game_id} not found, creating new record`)
        
        // Try to create new game record
        const { error: insertError } = await supabase
          .from('games')
          .insert({
            id: data.game_id,
            sport: payload.sport,
            league: payload.league,
            ...updateData
          })

        if (insertError) {
          throw new Error(`Failed to create game: ${insertError.message}`)
        }
      }

      console.log(`[${requestId}] Game ${data.game_id} updated successfully`)
      
      return {
        success: true,
        message: `Game ${data.game_id} updated successfully`,
        requestId,
        processingTimeMs: 0 // Will be set by caller
      }

    } catch (error) {
      throw new Error(`Game update failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Handles score update webhooks
   */
  private static async handleScoreUpdate(
    supabase: any,
    payload: any,
    context: WebhookProcessingContext
  ): Promise<ProcessingResult> {
    const { requestId } = context
    const { data } = payload

    try {
      if (!data.game_id) {
        throw new Error('Missing required field: game_id')
      }

      const updateData: any = {
        updated_at: new Date().toISOString()
      }

      if (data.home_score !== undefined) updateData.home_score = data.home_score
      if (data.away_score !== undefined) updateData.away_score = data.away_score
      if (data.quarter !== undefined) updateData.quarter = data.quarter
      if (data.period !== undefined) updateData.period = data.period
      if (data.time_remaining !== undefined) updateData.time_remaining = data.time_remaining

      const { error } = await supabase
        .from('games')
        .update(updateData)
        .eq('id', data.game_id)

      if (error) {
        throw new Error(`Database error: ${error.message}`)
      }

      console.log(`[${requestId}] Score updated for game ${data.game_id}`)
      
      return {
        success: true,
        message: `Score updated for game ${data.game_id}`,
        requestId,
        processingTimeMs: 0
      }

    } catch (error) {
      throw new Error(`Score update failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Handles odds update webhooks
   */
  private static async handleOddsUpdate(
    supabase: any,
    payload: any,
    context: WebhookProcessingContext
  ): Promise<ProcessingResult> {
    const { requestId } = context
    const { data } = payload

    try {
      if (!data.game_id || !data.odds_type) {
        throw new Error('Missing required fields: game_id, odds_type')
      }

      const oddsData = {
        id: `${data.game_id}_${data.odds_type}_${Date.now()}`,
        game_id: data.game_id,
        sport: payload.sport,
        odds_type: data.odds_type,
        home_odds: data.home_odds,
        away_odds: data.away_odds,
        spread: data.spread,
        total: data.total,
        bookmaker: data.bookmaker || payload.source || 'webhook',
        source: data.source || payload.source || 'webhook',
        timestamp: new Date().toISOString()
      }

      const { error } = await supabase
        .from('odds')
        .upsert(oddsData, {
          onConflict: 'id'
        })

      if (error) {
        throw new Error(`Database error: ${error.message}`)
      }

      console.log(`[${requestId}] Odds updated for game ${data.game_id}`)
      
      return {
        success: true,
        message: `Odds updated for game ${data.game_id}`,
        requestId,
        processingTimeMs: 0
      }

    } catch (error) {
      throw new Error(`Odds update failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Handles team update webhooks
   */
  private static async handleTeamUpdate(
    supabase: any,
    payload: any,
    context: WebhookProcessingContext
  ): Promise<ProcessingResult> {
    const { requestId } = context
    const { data } = payload

    try {
      if (!data.team_id) {
        throw new Error('Missing required field: team_id')
      }

      const updateData: any = {
        updated_at: new Date().toISOString()
      }

      if (data.name !== undefined) updateData.name = data.name
      if (data.abbreviation !== undefined) updateData.abbreviation = data.abbreviation
      if (data.logo_url !== undefined) updateData.logo_url = data.logo_url

      // Update team
      const { error } = await supabase
        .from('teams')
        .update(updateData)
        .eq('id', data.team_id)

      if (error) {
        throw new Error(`Database error: ${error.message}`)
      }

      // Update standings if provided
      if (data.standings) {
        const standingsData = {
          id: `${data.standings.sport}_${data.team_id}_${data.standings.season}`,
          sport: data.standings.sport,
          league: data.standings.league,
          team_id: data.team_id,
          team_name: data.name,
          season: data.standings.season,
          wins: data.standings.wins,
          losses: data.standings.losses,
          ties: data.standings.ties || 0,
          win_percentage: data.standings.win_percentage,
          games_back: data.standings.games_back,
          conference: data.standings.conference,
          division: data.standings.division,
          updated_at: new Date().toISOString()
        }

        const { error: standingsError } = await supabase
          .from('league_standings')
          .upsert(standingsData, {
            onConflict: 'id'
          })

        if (standingsError) {
          console.warn(`[${requestId}] Error updating standings: ${standingsError.message}`)
        }
      }

      console.log(`[${requestId}] Team ${data.team_id} updated successfully`)
      
      return {
        success: true,
        message: `Team ${data.team_id} updated successfully`,
        requestId,
        processingTimeMs: 0
      }

    } catch (error) {
      throw new Error(`Team update failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Handles player update webhooks
   */
  private static async handlePlayerUpdate(
    supabase: any,
    payload: any,
    context: WebhookProcessingContext
  ): Promise<ProcessingResult> {
    const { requestId } = context
    const { data } = payload

    try {
      if (!data.player_id) {
        throw new Error('Missing required field: player_id')
      }

      const updateData: any = {
        updated_at: new Date().toISOString()
      }

      if (data.name !== undefined) updateData.name = data.name
      if (data.team_id !== undefined) updateData.team_id = data.team_id
      if (data.position !== undefined) updateData.position = data.position
      if (data.jersey_number !== undefined) updateData.jersey_number = data.jersey_number

      const { error } = await supabase
        .from('players')
        .update(updateData)
        .eq('id', data.player_id)

      if (error) {
        throw new Error(`Database error: ${error.message}`)
      }

      console.log(`[${requestId}] Player ${data.player_id} updated successfully`)
      
      return {
        success: true,
        message: `Player ${data.player_id} updated successfully`,
        requestId,
        processingTimeMs: 0
      }

    } catch (error) {
      throw new Error(`Player update failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Handles full sync webhooks
   */
  private static async handleFullSync(
    payload: any,
    context: WebhookProcessingContext
  ): Promise<ProcessingResult> {
    const { requestId } = context

    try {
      console.log(`[${requestId}] Triggering full sync for ${payload.sport}/${payload.league}`)
      
      // Trigger data sync service
      await dataSyncService.performSync()
      
      return {
        success: true,
        message: `Full sync completed for ${payload.sport}/${payload.league}`,
        requestId,
        processingTimeMs: 0
      }

    } catch (error) {
      throw new Error(`Full sync failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }
}