// @ts-nocheck
/// <reference path="./types.d.ts" />
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

interface VerificationResult {
  success: boolean
  stats: {
    teamsVerified: number
    teamsHealthy: number
    teamsStale: number
    teamsFixed: number
    playersVerified: number
    playersHealthy: number
    playersStale: number
    playersFixed: number
  }
  bySport: Record<string, { healthy: number; stale: number; fixed: number }>
  staleUrls: Array<{ name: string; sport: string; url: string; reason: string }>
  healthMetrics: {
    overallHealthPercent: number
    teamsWithLogos: number
    totalTeams: number
    playersWithPhotos: number
    totalPlayers: number
  }
}

async function verifyImageURL(url: string): Promise<{ healthy: boolean; reason?: string }> {
  try {
    const response = await fetch(url, {
      method: 'HEAD',
      signal: AbortSignal.timeout(10000), // 10 second timeout
    })

    if (!response.ok) {
      return { healthy: false, reason: `HTTP ${response.status}` }
    }

    return { healthy: true }
  } catch (error) {
    return {
      healthy: false,
      reason: error.name === 'TimeoutError' ? 'Timeout' : error.message,
    }
  }
}

async function generateTeamLogoURL(
  teamName: string,
  sport: string,
  league: string
): Promise<string | null> {
  try {
    const config = ESPN_SPORT_CONFIGS[sport.toLowerCase()]
    if (!config) return null

    const teamId = TEAM_ID_MAP[sport.toLowerCase()]?.[teamName]
    if (!teamId) return null

    const url = `https://a.espncdn.com${config.logo_path_template}`
      .replace('{sport}', config.espn_sport_key)
      .replace('{teamId}', teamId)

    // Verify URL exists
    const response = await fetch(url, { method: 'HEAD' })
    return response.ok ? url : null
  } catch {
    return null
  }
}

async function generatePlayerPhotoURL(playerId: string, sport: string): Promise<string | null> {
  try {
    const config = ESPN_SPORT_CONFIGS[sport.toLowerCase()]
    if (!config || !config.player_path_template) return null

    const url = `https://a.espncdn.com${config.player_path_template}`
      .replace('{sport}', config.espn_sport_key)
      .replace('{playerId}', playerId)

    // Verify URL exists
    const response = await fetch(url, { method: 'HEAD' })
    return response.ok ? url : null
  } catch {
    return null
  }
}

async function logAuditEvent(
  supabase: any,
  entityType: 'team' | 'player',
  entityId: string,
  entityName: string,
  sport: string,
  action: string,
  oldUrl: string | null,
  newUrl: string | null,
  status: string,
  errorMessage?: string
) {
  try {
    await supabase.from('image_audit_log').insert({
      entity_type: entityType,
      entity_id: entityId,
      entity_name: entityName,
      sport,
      action,
      old_url: oldUrl,
      new_url: newUrl,
      status,
      error_message: errorMessage,
    })
  } catch (error) {
    console.error('Failed to log audit event:', error)
  }
}

serve(async (req: Request) => {
  try {
    const url = new URL(req.url)
    const sport = url.searchParams.get('sport')

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const result: VerificationResult = {
      success: true,
      stats: {
        teamsVerified: 0,
        teamsHealthy: 0,
        teamsStale: 0,
        teamsFixed: 0,
        playersVerified: 0,
        playersHealthy: 0,
        playersStale: 0,
        playersFixed: 0,
      },
      bySport: {},
      staleUrls: [],
      healthMetrics: {
        overallHealthPercent: 0,
        teamsWithLogos: 0,
        totalTeams: 0,
        playersWithPhotos: 0,
        totalPlayers: 0,
      },
    }

    // Verify teams with logos
    let teamsQuery = supabase
      .from('teams')
      .select('id, name, sport, league, logo_url')
      .not('logo_url', 'is', null)

    if (sport) {
      teamsQuery = teamsQuery.eq('sport', sport)
    }

    const { data: teams, error: teamsError } = await teamsQuery
    if (teamsError) throw teamsError

    for (const team of teams || []) {
      result.stats.teamsVerified++

      const verification = await verifyImageURL(team.logo_url)

      if (verification.healthy) {
        result.stats.teamsHealthy++
        result.bySport[team.sport] = result.bySport[team.sport] || {
          healthy: 0,
          stale: 0,
          fixed: 0,
        }
        result.bySport[team.sport].healthy++
      } else {
        result.stats.teamsStale++
        result.stats.teamsFixed++
        result.bySport[team.sport] = result.bySport[team.sport] || {
          healthy: 0,
          stale: 0,
          fixed: 0,
        }
        result.bySport[team.sport].stale++
        result.bySport[team.sport].fixed++
        result.staleUrls.push({
          name: team.name,
          sport: team.sport,
          url: team.logo_url,
          reason: verification.reason || 'Unknown',
        })

        // Try to fix with fresh ESPN URL
        try {
          const freshUrl = await generateTeamLogoURL(team.name, team.sport, team.league)
          if (freshUrl) {
            const { error: updateError } = await supabase
              .from('teams')
              .update({
                logo_url: freshUrl,
                last_updated: new Date().toISOString(),
              })
              .eq('id', team.id)

            if (!updateError) {
              await logAuditEvent(
                supabase,
                'team',
                team.id,
                team.name,
                team.sport,
                'verified',
                team.logo_url,
                freshUrl,
                'success'
              )
            }
          }
        } catch (error) {
          await logAuditEvent(
            supabase,
            'team',
            team.id,
            team.name,
            team.sport,
            'verified',
            team.logo_url,
            null,
            'failed',
            error.message
          )
        }
      }
    }

    // Verify players with headshots
    let playersQuery = supabase
      .from('players')
      .select('id, name, sport, headshot_url')
      .not('headshot_url', 'is', null)

    if (sport) {
      playersQuery = playersQuery.eq('sport', sport)
    }

    const { data: players, error: playersError } = await playersQuery
    if (playersError) throw playersError

    for (const player of players || []) {
      result.stats.playersVerified++

      const verification = await verifyImageURL(player.headshot_url)

      if (verification.healthy) {
        result.stats.playersHealthy++
        result.bySport[player.sport] = result.bySport[player.sport] || {
          healthy: 0,
          stale: 0,
          fixed: 0,
        }
        result.bySport[player.sport].healthy++
      } else {
        result.stats.playersStale++
        result.stats.playersFixed++
        result.bySport[player.sport] = result.bySport[player.sport] || {
          healthy: 0,
          stale: 0,
          fixed: 0,
        }
        result.bySport[player.sport].stale++
        result.bySport[player.sport].fixed++
        result.staleUrls.push({
          name: player.name,
          sport: player.sport,
          url: player.headshot_url,
          reason: verification.reason || 'Unknown',
        })

        // Try to fix with fresh ESPN URL
        try {
          const playerId = player.id.split('-')[0] || player.name.replace(/\s+/g, '-').toLowerCase()
          const freshUrl = await generatePlayerPhotoURL(playerId, player.sport)
          if (freshUrl) {
            const { error: updateError } = await supabase
              .from('players')
              .update({
                headshot_url: freshUrl,
                last_updated: new Date().toISOString(),
              })
              .eq('id', player.id)

            if (!updateError) {
              await logAuditEvent(
                supabase,
                'player',
                player.id,
                player.name,
                player.sport,
                'verified',
                player.headshot_url,
                freshUrl,
                'success'
              )
            }
          }
        } catch (error) {
          await logAuditEvent(
            supabase,
            'player',
            player.id,
            player.name,
            player.sport,
            'verified',
            player.headshot_url,
            null,
            'failed',
            error.message
          )
        }
      }
    }

    // Calculate health metrics
    const totalVerified = result.stats.teamsVerified + result.stats.playersVerified
    const totalHealthy = result.stats.teamsHealthy + result.stats.playersHealthy
    result.healthMetrics.overallHealthPercent =
      totalVerified > 0 ? Math.round((totalHealthy / totalVerified) * 100) : 0

    // Get total counts for coverage metrics
    const { count: totalTeams } = await supabase
      .from('teams')
      .select('*', { count: 'exact', head: true })

    const { count: teamsWithLogos } = await supabase
      .from('teams')
      .select('*', { count: 'exact', head: true })
      .not('logo_url', 'is', null)

    const { count: totalPlayers } = await supabase
      .from('players')
      .select('*', { count: 'exact', head: true })

    const { count: playersWithPhotos } = await supabase
      .from('players')
      .select('*', { count: 'exact', head: true })
      .not('headshot_url', 'is', null)

    result.healthMetrics.totalTeams = totalTeams || 0
    result.healthMetrics.teamsWithLogos = teamsWithLogos || 0
    result.healthMetrics.totalPlayers = totalPlayers || 0
    result.healthMetrics.playersWithPhotos = playersWithPhotos || 0

    return new Response(JSON.stringify(result), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      },
    })
  } catch (error) {
    console.error('Error in verify-images function:', error)

    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Unknown error occurred',
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
        },
      }
    )
  }
})
