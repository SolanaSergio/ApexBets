/**
 * Webhook Payload Validation System
 * Provides comprehensive validation for all webhook event types
 */

import { z } from 'zod'

// Base webhook schema
const BaseWebhookSchema = z.object({
  type: z.string(),
  timestamp: z.string().optional(),
  sport: z.string(),
  league: z.string(),
  source: z.string().optional().default('webhook'),
})

// Game update webhook schema
const GameUpdateSchema = BaseWebhookSchema.extend({
  type: z.literal('game_update'),
  data: z.object({
    game_id: z.string(),
    status: z.enum(['scheduled', 'live', 'finished', 'postponed', 'cancelled']),
    home_score: z.number().nullable().optional(),
    away_score: z.number().nullable().optional(),
    venue: z.string().nullable().optional(),
    game_date: z.string().optional(),
    period: z.string().nullable().optional(),
    time_remaining: z.string().nullable().optional(),
    attendance: z.number().nullable().optional(),
    weather: z.string().nullable().optional(),
  }),
})

// Score update webhook schema
const ScoreUpdateSchema = BaseWebhookSchema.extend({
  type: z.literal('score_update'),
  data: z.object({
    game_id: z.string(),
    home_score: z.number(),
    away_score: z.number(),
    quarter: z.string().nullable().optional(),
    period: z.string().nullable().optional(),
    time_remaining: z.string().nullable().optional(),
    last_play: z.string().nullable().optional(),
  }),
})

// Odds update webhook schema
const OddsUpdateSchema = BaseWebhookSchema.extend({
  type: z.literal('odds_update'),
  data: z.object({
    game_id: z.string(),
    odds_type: z.enum(['moneyline', 'spread', 'total', 'prop']),
    home_odds: z.number().nullable().optional(),
    away_odds: z.number().nullable().optional(),
    spread: z.number().nullable().optional(),
    total: z.number().nullable().optional(),
    bookmaker: z.string().optional(),
    source: z.string().optional(),
  }),
})

// Team update webhook schema
const TeamUpdateSchema = BaseWebhookSchema.extend({
  type: z.literal('team_update'),
  data: z.object({
    team_id: z.string(),
    name: z.string().optional(),
    abbreviation: z.string().optional(),
    logo_url: z.string().url().nullable().optional(),
    record: z
      .object({
        wins: z.number(),
        losses: z.number(),
        ties: z.number().optional(),
      })
      .optional(),
    standings: z
      .object({
        sport: z.string(),
        league: z.string(),
        season: z.string(),
        wins: z.number(),
        losses: z.number(),
        ties: z.number().optional(),
        win_percentage: z.number(),
        games_back: z.number().optional(),
        conference: z.string().optional(),
        division: z.string().optional(),
      })
      .optional(),
  }),
})

// Player update webhook schema
const PlayerUpdateSchema = BaseWebhookSchema.extend({
  type: z.literal('player_update'),
  data: z.object({
    player_id: z.string(),
    name: z.string().optional(),
    team_id: z.string().optional(),
    position: z.string().optional(),
    jersey_number: z.number().optional(),
    stats: z.record(z.union([z.string(), z.number()])).optional(),
  }),
})

// Full sync webhook schema
const FullSyncSchema = BaseWebhookSchema.extend({
  type: z.literal('full_sync'),
  data: z
    .object({
      sync_type: z.enum(['games', 'teams', 'players', 'odds', 'all']).optional().default('all'),
      date_range: z
        .object({
          start: z.string(),
          end: z.string(),
        })
        .optional(),
    })
    .optional(),
})

// Batch webhook schema
const BatchWebhookSchema = z.object({
  type: z.literal('batch'),
  events: z.array(
    z.union([
      GameUpdateSchema,
      ScoreUpdateSchema,
      OddsUpdateSchema,
      TeamUpdateSchema,
      PlayerUpdateSchema,
      FullSyncSchema,
    ])
  ),
  batch_id: z.string().optional(),
  timestamp: z.string().optional(),
})

// Union of all webhook schemas
export const WebhookSchema = z.union([
  GameUpdateSchema,
  ScoreUpdateSchema,
  OddsUpdateSchema,
  TeamUpdateSchema,
  PlayerUpdateSchema,
  FullSyncSchema,
  BatchWebhookSchema,
])

export type WebhookPayload = z.infer<typeof WebhookSchema>
export type GameUpdatePayload = z.infer<typeof GameUpdateSchema>
export type ScoreUpdatePayload = z.infer<typeof ScoreUpdateSchema>
export type OddsUpdatePayload = z.infer<typeof OddsUpdateSchema>
export type TeamUpdatePayload = z.infer<typeof TeamUpdateSchema>
export type PlayerUpdatePayload = z.infer<typeof PlayerUpdateSchema>
export type FullSyncPayload = z.infer<typeof FullSyncSchema>
export type BatchWebhookPayload = z.infer<typeof BatchWebhookSchema>

export interface ValidationResult {
  isValid: boolean
  errors: string[]
  data?: WebhookPayload
}

/**
 * Webhook Payload Validator
 * Validates webhook payloads against defined schemas
 */
export class WebhookValidator {
  /**
   * Validates a webhook payload
   * @param payload - The webhook payload to validate
   * @returns ValidationResult with validation status and errors
   */
  static validate(payload: unknown): ValidationResult {
    try {
      const validatedData = WebhookSchema.parse(payload)
      return {
        isValid: true,
        errors: [],
        data: validatedData,
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errors = error.errors.map(err => {
          const path = err.path.join('.')
          return `${path}: ${err.message}`
        })

        return {
          isValid: false,
          errors,
        }
      }

      return {
        isValid: false,
        errors: ['Unknown validation error'],
      }
    }
  }

  /**
   * Validates payload size
   * @param payload - The raw payload string
   * @param maxSize - Maximum allowed size in bytes (default: 1MB)
   * @returns boolean indicating if size is valid
   */
  static validateSize(payload: string, maxSize: number = 1024 * 1024): boolean {
    const sizeInBytes = Buffer.byteLength(payload, 'utf8')
    return sizeInBytes <= maxSize
  }

  /**
   * Generates a hash for deduplication
   * @param payload - The webhook payload
   * @returns string hash for deduplication
   */
  static generateHash(payload: WebhookPayload): string {
    const crypto = require('crypto')
    const normalizedPayload = JSON.stringify(payload, Object.keys(payload).sort())
    return crypto.createHash('sha256').update(normalizedPayload).digest('hex')
  }

  /**
   * Validates webhook event type
   * @param eventType - The event type to validate
   * @returns boolean indicating if event type is supported
   */
  static isValidEventType(eventType: string): boolean {
    const validTypes = [
      'game_update',
      'score_update',
      'odds_update',
      'team_update',
      'player_update',
      'full_sync',
      'batch',
    ]
    return validTypes.includes(eventType)
  }
}
