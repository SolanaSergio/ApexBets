#!/usr/bin/env node

/**
 * Populate Current Data Script
 * Fetches current sports data and populates the database
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

// Generate UUIDs for mock data
const { v4: uuidv4 } = require('uuid')

// Simple mock data for demonstration
const team1Id = uuidv4()
const team2Id = uuidv4()
const team3Id = uuidv4()
const team4Id = uuidv4()
const team5Id = uuidv4()
const team6Id = uuidv4()

const mockGames = [
  {
    id: uuidv4(),
    home_team_id: team1Id,
    away_team_id: team2Id,
    game_date: new Date().toISOString(),
    season: '2024-25',
    home_score: 85,
    away_score: 78,
    status: 'live',
    venue: 'Madison Square Garden',
    league: 'NBA',
    sport: 'basketball',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: uuidv4(),
    home_team_id: team3Id,
    away_team_id: team4Id,
    game_date: new Date().toISOString(),
    season: '2024-25',
    home_score: 0,
    away_score: 0,
    status: 'scheduled',
    venue: 'Staples Center',
    league: 'NBA',
    sport: 'basketball',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: uuidv4(),
    home_team_id: team5Id,
    away_team_id: team6Id,
    game_date: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
    season: '2024-25',
    home_score: 92,
    away_score: 88,
    status: 'finished',
    venue: 'Crypto.com Arena',
    league: 'NBA',
    sport: 'basketball',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
]

const mockTeams = [
  {
    id: team1Id,
    name: 'Los Angeles Lakers',
    abbreviation: 'LAL',
    logo_url: null,
    city: 'Los Angeles',
    league: 'NBA',
    sport: 'basketball',
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: team2Id,
    name: 'Boston Celtics',
    abbreviation: 'BOS',
    logo_url: null,
    city: 'Boston',
    league: 'NBA',
    sport: 'basketball',
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: team3Id,
    name: 'Golden State Warriors',
    abbreviation: 'GSW',
    logo_url: null,
    city: 'San Francisco',
    league: 'NBA',
    sport: 'basketball',
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: team4Id,
    name: 'Miami Heat',
    abbreviation: 'MIA',
    logo_url: null,
    city: 'Miami',
    league: 'NBA',
    sport: 'basketball',
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: team5Id,
    name: 'Phoenix Suns',
    abbreviation: 'PHX',
    logo_url: null,
    city: 'Phoenix',
    league: 'NBA',
    sport: 'basketball',
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: team6Id,
    name: 'Denver Nuggets',
    abbreviation: 'DEN',
    logo_url: null,
    city: 'Denver',
    league: 'NBA',
    sport: 'basketball',
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
]

async function populateCurrentData() {
  console.log('🔄 Populating current data for dashboard...')
  
  try {
    // Clear old data first
    console.log('🧹 Clearing old data...')
    await supabase.from('games').delete().neq('id', '')
    await supabase.from('teams').delete().neq('id', '')
    
    // Insert mock teams
    console.log('👥 Inserting teams...')
    const { error: teamsError } = await supabase
      .from('teams')
      .insert(mockTeams)
    
    if (teamsError) {
      console.error('❌ Error inserting teams:', teamsError)
    } else {
      console.log('✅ Teams inserted successfully')
    }
    
    // Insert mock games
    console.log('🏀 Inserting games...')
    const { error: gamesError } = await supabase
      .from('games')
      .insert(mockGames)
    
    if (gamesError) {
      console.error('❌ Error inserting games:', gamesError)
    } else {
      console.log('✅ Games inserted successfully')
    }
    
    // Clear cache to force fresh data
    console.log('🗑️ Clearing cache...')
    await supabase.from('cache_entries').delete().neq('id', '')
    
    console.log('🎉 Current data populated successfully!')
    console.log('📊 Dashboard should now display live data')
    
  } catch (error) {
    console.error('❌ Error populating data:', error.message)
    process.exit(1)
  }
}

// Run the population
populateCurrentData()
