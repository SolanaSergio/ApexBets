#!/usr/bin/env node

/**
 * Check Team Logos in Database
 * Analyzes which teams have logos and which don't
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

async function checkTeamLogos() {
  console.log('🔍 Checking Team Logos in Database...\n');

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase environment variables');
    return;
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    // Get all teams
    console.log('📊 Fetching all teams...');
    const { data: teams, error: teamsError } = await supabase
      .from('teams')
      .select('*')
      .order('sport')
      .order('name');

    if (teamsError) {
      console.error('❌ Error fetching teams:', teamsError);
      return;
    }

    if (!teams || teams.length === 0) {
      console.log('⚠️  No teams found in database');
      return;
    }

    console.log(`✅ Found ${teams.length} teams\n`);

    // Group by sport
    const bySport = {};
    teams.forEach(team => {
      if (!bySport[team.sport]) {
        bySport[team.sport] = [];
      }
      bySport[team.sport].push(team);
    });

    // Analyze each sport
    console.log('📊 Logo Coverage by Sport:\n');
    for (const [sport, sportTeams] of Object.entries(bySport)) {
      const withLogos = sportTeams.filter(t => t.logo_url && t.logo_url.trim() !== '').length;
      const total = sportTeams.length;
      const percentage = ((withLogos / total) * 100).toFixed(1);
      
      console.log(`${sport.toUpperCase()}:`);
      console.log(`  Total teams: ${total}`);
      console.log(`  With logos: ${withLogos} (${percentage}%)`);
      console.log(`  Without logos: ${total - withLogos}`);
      
      // Show sample teams
      console.log(`  Sample teams:`);
      sportTeams.slice(0, 5).forEach(team => {
        const hasLogo = team.logo_url && team.logo_url.trim() !== '';
        console.log(`    ${hasLogo ? '✅' : '❌'} ${team.name} ${hasLogo ? `(${team.logo_url.substring(0, 50)}...)` : '(no logo)'}`);
      });
      console.log();
    }

    // Overall stats
    const totalTeams = teams.length;
    const teamsWithLogos = teams.filter(t => t.logo_url && t.logo_url.trim() !== '').length;
    const percentage = ((teamsWithLogos / totalTeams) * 100).toFixed(1);
    
    console.log('📊 Overall Logo Coverage:');
    console.log(`  Total teams: ${totalTeams}`);
    console.log(`  Teams with logos: ${teamsWithLogos} (${percentage}%)`);
    console.log(`  Teams without logos: ${totalTeams - teamsWithLogos}`);

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

checkTeamLogos();

