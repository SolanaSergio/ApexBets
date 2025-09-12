/**
 * Enhanced Webhook Examples
 * Demonstrates the usage of the enhanced webhook processing system
 */

import { WebhookValidator } from '@/lib/security/webhook-validator'
import { hmacWebhookAuthenticator } from '@/lib/security/hmac-webhook-authenticator'

// Example webhook payloads
const examples = {
  // Single game update
  gameUpdate: {
    type: 'game_update',
    sport: 'basketball',
    league: 'NBA',
    timestamp: new Date().toISOString(),
    data: {
      game_id: 'nba-game-20241215-lal-bos',
      status: 'live',
      home_score: 98,
      away_score: 92,
      venue: 'TD Garden',
      period: '4th Quarter',
      time_remaining: '2:45',
      attendance: 19580
    }
  },

  // Score update with detailed information
  scoreUpdate: {
    type: 'score_update',
    sport: 'basketball',
    league: 'NBA',
    timestamp: new Date().toISOString(),
    data: {
      game_id: 'nba-game-20241215-lal-bos',
      home_score: 100,
      away_score: 92,
      quarter: '4th Quarter',
      time_remaining: '1:23',
      last_play: 'Jayson Tatum makes 3-point shot (25 PTS)'
    }
  },

  // Odds update from multiple bookmakers
  oddsUpdate: {
    type: 'odds_update',
    sport: 'basketball',
    league: 'NBA',
    timestamp: new Date().toISOString(),
    data: {
      game_id: 'nba-game-20241215-lal-bos',
      odds_type: 'moneyline',
      home_odds: -180,
      away_odds: 150,
      bookmaker: 'DraftKings',
      source: 'live_odds_feed'
    }
  },

  // Team update with standings
  teamUpdate: {
    type: 'team_update',
    sport: 'basketball',
    league: 'NBA',
    timestamp: new Date().toISOString(),
    data: {
      team_id: 'nba-team-bos',
      name: 'Boston Celtics',
      abbreviation: 'BOS',
      logo_url: 'https://cdn.nba.com/logos/nba/1610612738/primary/L/logo.svg',
      standings: {
        sport: 'basketball',
        league: 'NBA',
        season: '2024-25',
        wins: 28,
        losses: 12,
        win_percentage: 0.700,
        games_back: 0,
        conference: 'Eastern',
        division: 'Atlantic'
      }
    }
  },

  // Player update
  playerUpdate: {
    type: 'player_update',
    sport: 'basketball',
    league: 'NBA',
    timestamp: new Date().toISOString(),
    data: {
      player_id: 'nba-player-jayson-tatum',
      name: 'Jayson Tatum',
      team_id: 'nba-team-bos',
      position: 'Forward',
      jersey_number: 0,
      stats: {
        points: 28.5,
        rebounds: 8.2,
        assists: 5.1,
        field_goal_percentage: 0.472
      }
    }
  },

  // Full sync request
  fullSync: {
    type: 'full_sync',
    sport: 'basketball',
    league: 'NBA',
    timestamp: new Date().toISOString(),
    data: {
      sync_type: 'games',
      date_range: {
        start: '2024-12-15',
        end: '2024-12-15'
      }
    }
  },

  // Batch webhook with multiple events
  batchUpdate: {
    type: 'batch',
    batch_id: 'batch-20241215-001',
    timestamp: new Date().toISOString(),
    events: [
      {
        type: 'game_update',
        sport: 'basketball',
        league: 'NBA',
        data: {
          game_id: 'nba-game-20241215-lal-bos',
          status: 'finished',
          home_score: 108,
          away_score: 102
        }
      },
      {
        type: 'odds_update',
        sport: 'basketball',
        league: 'NBA',
        data: {
          game_id: 'nba-game-20241215-lal-bos',
          odds_type: 'spread',
          home_odds: -110,
          away_odds: -110,
          spread: -3.5,
          bookmaker: 'FanDuel'
        }
      },
      {
        type: 'team_update',
        sport: 'basketball',
        league: 'NBA',
        data: {
          team_id: 'nba-team-bos',
          name: 'Boston Celtics',
          standings: {
            sport: 'basketball',
            league: 'NBA',
            season: '2024-25',
            wins: 29,
            losses: 12,
            win_percentage: 0.707
          }
        }
      }
    ]
  }
}

/**
 * Demonstrates webhook validation
 */
function demonstrateValidation() {
  console.log('=== Webhook Validation Examples ===\n')

  Object.entries(examples).forEach(([name, payload]) => {
    console.log(`Validating ${name}:`)
    
    const result = WebhookValidator.validate(payload)
    
    if (result.isValid) {
      console.log('✅ Valid payload')
      console.log(`   Hash: ${WebhookValidator.generateHash(result.data!)}`)
    } else {
      console.log('❌ Invalid payload')
      console.log(`   Errors: ${result.errors.join(', ')}`)
    }
    
    console.log()
  })
}

/**
 * Demonstrates HMAC signature generation and validation
 */
function demonstrateHMACSignatures() {
  console.log('=== HMAC Signature Examples ===\n')
  
  const webhookSecret = 'your-webhook-secret-key'
  
  Object.entries(examples).forEach(([name, payload]) => {
    console.log(`HMAC for ${name}:`)
    
    // Generate signature
    const signature = hmacWebhookAuthenticator.generateSignature(payload, webhookSecret)
    console.log(`   Signature: ${signature}`)
    
    // Validate signature
    const isValid = hmacWebhookAuthenticator.validateSignature(payload, signature, webhookSecret)
    console.log(`   Valid: ${isValid ? '✅' : '❌'}`)
    
    // Test with wrong secret
    const isInvalid = hmacWebhookAuthenticator.validateSignature(payload, signature, 'wrong-secret')
    console.log(`   Wrong secret: ${isInvalid ? '❌ Should be false' : '✅ Correctly rejected'}`)
    
    console.log()
  })
}

/**
 * Demonstrates payload size validation
 */
function demonstratePayloadSizeValidation() {
  console.log('=== Payload Size Validation ===\n')
  
  Object.entries(examples).forEach(([name, payload]) => {
    const payloadString = JSON.stringify(payload)
    const sizeInBytes = Buffer.byteLength(payloadString, 'utf8')
    const isValidSize = WebhookValidator.validateSize(payloadString)
    
    console.log(`${name}:`)
    console.log(`   Size: ${sizeInBytes} bytes`)
    console.log(`   Valid: ${isValidSize ? '✅' : '❌'}`)
    console.log()
  })
}

/**
 * Demonstrates IP address validation
 */
function demonstrateIPValidation() {
  console.log('=== IP Address Validation ===\n')
  
  const allowedIPs = ['192.168.1.100', '10.0.0.1', '203.0.113.1']
  const testIPs = [
    '192.168.1.100', // Allowed
    '10.0.0.1',      // Allowed
    '203.0.113.1',   // Allowed
    '192.168.1.200', // Not allowed
    '172.16.0.1',    // Not allowed
    '127.0.0.1'      // Not allowed
  ]
  
  testIPs.forEach(ip => {
    const isAllowed = hmacWebhookAuthenticator.validateIPAddress(ip, allowedIPs)
    console.log(`${ip}: ${isAllowed ? '✅ Allowed' : '❌ Blocked'}`)
  })
  
  console.log()
  console.log('Empty allowlist (allows all):')
  testIPs.forEach(ip => {
    const isAllowed = hmacWebhookAuthenticator.validateIPAddress(ip, [])
    console.log(`${ip}: ${isAllowed ? '✅ Allowed' : '❌ Blocked'}`)
  })
}

/**
 * Demonstrates error handling scenarios
 */
function demonstrateErrorHandling() {
  console.log('=== Error Handling Examples ===\n')
  
  const invalidPayloads = [
    // Missing required fields
    {
      name: 'Missing type',
      payload: {
        sport: 'basketball',
        league: 'NBA',
        data: { game_id: 'test' }
      }
    },
    
    // Invalid event type
    {
      name: 'Invalid event type',
      payload: {
        type: 'invalid_event',
        sport: 'basketball',
        league: 'NBA',
        data: {}
      }
    },
    
    // Missing data field
    {
      name: 'Missing data',
      payload: {
        type: 'game_update',
        sport: 'basketball',
        league: 'NBA'
      }
    },
    
    // Invalid URL in logo_url
    {
      name: 'Invalid URL',
      payload: {
        type: 'team_update',
        sport: 'basketball',
        league: 'NBA',
        data: {
          team_id: 'test',
          logo_url: 'not-a-valid-url'
        }
      }
    }
  ]
  
  invalidPayloads.forEach(({ name, payload }) => {
    console.log(`Testing ${name}:`)
    
    const result = WebhookValidator.validate(payload)
    console.log(`   Valid: ${result.isValid ? '✅' : '❌'}`)
    
    if (!result.isValid) {
      console.log(`   Errors:`)
      result.errors.forEach(error => {
        console.log(`     - ${error}`)
      })
    }
    
    console.log()
  })
}

// Run all demonstrations
if (require.main === module) {
  console.log('Enhanced Webhook Processing Examples\n')
  console.log('=====================================\n')
  
  demonstrateValidation()
  demonstrateHMACSignatures()
  demonstratePayloadSizeValidation()
  demonstrateIPValidation()
  demonstrateErrorHandling()
  
  console.log('=== Summary ===')
  console.log('✅ All examples completed successfully')
  console.log('📚 Check the webhook documentation for integration details')
}

export {
  examples,
  demonstrateValidation,
  demonstrateHMACSignatures,
  demonstratePayloadSizeValidation,
  demonstrateIPValidation,
  demonstrateErrorHandling
}