#!/usr/bin/env node

/**
 * Database Schema Checker
 * Checks what columns actually exist in the database tables
 */

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config()

async function checkDatabaseSchema() {
  console.log('🔍 Checking Database Schema...\n')

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase environment variables')
    return
  }

  const supabase = createClient(supabaseUrl, supabaseKey)

  try {
    // Get a sample game to see what columns exist
    console.log('📊 Checking games table...')
    const { data: games, error: gamesError } = await supabase.from('games').select('*').limit(1)

    if (gamesError) {
      console.error('❌ Error fetching games:', gamesError)
      return
    }

    if (games && games.length > 0) {
      console.log('✅ Games table columns:')
      const game = games[0]
      Object.keys(game).forEach(column => {
        console.log(`   - ${column}: ${typeof game[column]} (${game[column]})`)
      })
    } else {
      console.log('⚠️  No games found in database')
    }

    // Check teams table
    console.log('\n📊 Checking teams table...')
    const { data: teams, error: teamsError } = await supabase.from('teams').select('*').limit(1)

    if (teamsError) {
      console.error('❌ Error fetching teams:', teamsError)
    } else if (teams && teams.length > 0) {
      console.log('✅ Teams table columns:')
      const team = teams[0]
      Object.keys(team).forEach(column => {
        console.log(`   - ${column}: ${typeof team[column]} (${team[column]})`)
      })
    } else {
      console.log('⚠️  No teams found in database')
    }

    // Check if specific columns exist by trying to select them
    console.log('\n🔍 Testing specific columns...')
    const testColumns = [
      'game_time',
      'time_remaining',
      'quarter',
      'period',
      'possession',
      'last_play',
      'attendance',
      'broadcast',
    ]

    for (const column of testColumns) {
      try {
        const { error } = await supabase.from('games').select(column).limit(1)

        if (error) {
          console.log(`❌ Column '${column}' does not exist: ${error.message}`)
        } else {
          console.log(`✅ Column '${column}' exists`)
        }
      } catch (err) {
        console.log(`❌ Column '${column}' error: ${err.message}`)
      }
    }
  } catch (error) {
    console.error('❌ Database connection error:', error)
  }
}

checkDatabaseSchema()
