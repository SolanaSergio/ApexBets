// @ts-nocheck
/// <reference path="./types.d.ts" />
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

interface AutoUpdateResult {
  success: boolean
  stats: {
    teamsProcessed: number
    teamsUpdated: number
    teamsFailed: number
    playersProcessed: number
    playersUpdated: number
    playersFailed: number
  }
  bySport: Record<string, { updated: number; failed: number }>
  failures: Array<{ name: string; sport: string; error: string }>
}

async function generateTeamLogoURL(
  teamName: string,
  sport: string,
  league: string,
  supabase: any
): Promise<string | null> {
  try {
    // Get sport configuration from database
    const { data: sportConfig } = await supabase
      .from('sports')
      .select('logo_template, cdn_config')
      .eq('name', sport)
      .eq('is_active', true)
      .single()

    if (!sportConfig?.logo_template) return null

    // Get team CDN mapping from database
    const { data: teamMapping } = await supabase
      .from('team_cdn_mappings')
      .select('cdn_team_id')
      .eq('team_name', teamName)
      .eq('sport', sport)
      .eq('league', league)
      .eq('cdn_provider', 'espn')
      .eq('is_active', true)
      .single()

    if (!teamMapping?.cdn_team_id) return null

    const url = `https://a.espncdn.com${sportConfig.logo_template}`.replace(
      '{teamId}',
      teamMapping.cdn_team_id
    )

    // Verify URL exists
    const response = await fetch(url, { method: 'HEAD' })
    return response.ok ? url : null
  } catch {
    return null
  }
}

async function generatePlayerPhotoURL(
  playerId: string,
  sport: string,
  supabase: any
): Promise<string | null> {
  try {
    // Get sport configuration from database
    const { data: sportConfig } = await supabase
      .from('sports')
      .select('player_template')
      .eq('name', sport)
      .eq('is_active', true)
      .single()

    if (!sportConfig?.player_template) return null

    const url = `https://a.espncdn.com${sportConfig.player_template}`.replace(
      '{playerId}',
      playerId
    )

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

    const result: AutoUpdateResult = {
      success: true,
      stats: {
        teamsProcessed: 0,
        teamsUpdated: 0,
        teamsFailed: 0,
        playersProcessed: 0,
        playersUpdated: 0,
        playersFailed: 0,
      },
      bySport: {},
      failures: [],
    }

    // Process teams that need updates (missing logos or stale)
    let teamsQuery = supabase
      .from('teams')
      .select('id, name, sport, league, logo_url, primary_color, secondary_color, last_updated')
      .or(
        'logo_url.is.null,last_updated.lt.' +
          new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString()
      )

    if (sport) {
      teamsQuery = teamsQuery.eq('sport', sport)
    }

    const { data: teams, error: teamsError } = await teamsQuery
    if (teamsError) throw teamsError

    for (const team of teams || []) {
      result.stats.teamsProcessed++

      try {
        const espnUrl = await generateTeamLogoURL(team.name, team.sport, team.league, supabase)

        if (espnUrl) {
          // Update team with ESPN URL
          const { error: updateError } = await supabase
            .from('teams')
            .update({
              logo_url: espnUrl,
              last_updated: new Date().toISOString(),
            })
            .eq('id', team.id)

          if (updateError) throw updateError

          await logAuditEvent(
            supabase,
            'team',
            team.id,
            team.name,
            team.sport,
            'updated',
            team.logo_url,
            espnUrl,
            'success'
          )

          result.stats.teamsUpdated++
          result.bySport[team.sport] = result.bySport[team.sport] || { updated: 0, failed: 0 }
          result.bySport[team.sport].updated++
        } else {
          // No ESPN URL found
          await logAuditEvent(
            supabase,
            'team',
            team.id,
            team.name,
            team.sport,
            'updated',
            team.logo_url,
            null,
            'failed',
            'No ESPN CDN URL found'
          )

          result.stats.teamsFailed++
          result.bySport[team.sport] = result.bySport[team.sport] || { updated: 0, failed: 0 }
          result.bySport[team.sport].failed++
          result.failures.push({
            name: team.name,
            sport: team.sport,
            error: 'No ESPN CDN URL found',
          })
        }
      } catch (error) {
        result.stats.teamsFailed++
        result.bySport[team.sport] = result.bySport[team.sport] || { updated: 0, failed: 0 }
        result.bySport[team.sport].failed++
        result.failures.push({
          name: team.name,
          sport: team.sport,
          error: error.message || 'Unknown error',
        })

        await logAuditEvent(
          supabase,
          'team',
          team.id,
          team.name,
          team.sport,
          'updated',
          team.logo_url,
          null,
          'failed',
          error.message
        )
      }
    }

    // Process players that need updates (missing headshots or stale)
    let playersQuery = supabase
      .from('players')
      .select('id, name, sport, headshot_url, last_updated')
      .or(
        'headshot_url.is.null,last_updated.lt.' +
          new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
      )

    if (sport) {
      playersQuery = playersQuery.eq('sport', sport)
    }

    const { data: players, error: playersError } = await playersQuery
    if (playersError) throw playersError

    for (const player of players || []) {
      result.stats.playersProcessed++

      try {
        // Use player ID or generate from name
        const playerId = player.id.split('-')[0] || player.name.replace(/\s+/g, '-').toLowerCase()
        const espnUrl = await generatePlayerPhotoURL(playerId, player.sport, supabase)

        if (espnUrl) {
          // Update player with ESPN URL
          const { error: updateError } = await supabase
            .from('players')
            .update({
              headshot_url: espnUrl,
              last_updated: new Date().toISOString(),
            })
            .eq('id', player.id)

          if (updateError) throw updateError

          await logAuditEvent(
            supabase,
            'player',
            player.id,
            player.name,
            player.sport,
            'updated',
            player.headshot_url,
            espnUrl,
            'success'
          )

          result.stats.playersUpdated++
          result.bySport[player.sport] = result.bySport[player.sport] || { updated: 0, failed: 0 }
          result.bySport[player.sport].updated++
        } else {
          // No ESPN URL found
          await logAuditEvent(
            supabase,
            'player',
            player.id,
            player.name,
            player.sport,
            'updated',
            player.headshot_url,
            null,
            'failed',
            'No ESPN CDN URL found'
          )

          result.stats.playersFailed++
          result.bySport[player.sport] = result.bySport[player.sport] || { updated: 0, failed: 0 }
          result.bySport[player.sport].failed++
          result.failures.push({
            name: player.name,
            sport: player.sport,
            error: 'No ESPN CDN URL found',
          })
        }
      } catch (error) {
        result.stats.playersFailed++
        result.bySport[player.sport] = result.bySport[player.sport] || { updated: 0, failed: 0 }
        result.bySport[player.sport].failed++
        result.failures.push({
          name: player.name,
          sport: player.sport,
          error: error.message || 'Unknown error',
        })

        await logAuditEvent(
          supabase,
          'player',
          player.id,
          player.name,
          player.sport,
          'updated',
          player.headshot_url,
          null,
          'failed',
          error.message
        )
      }
    }

    return new Response(JSON.stringify(result), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      },
    })
  } catch (error) {
    console.error('Error in auto-update-images function:', error)

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
