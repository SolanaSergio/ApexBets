import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'jsr:@supabase/supabase-js@2';

// ESPN CDN URL generation logic (from espn-cdn-mapper)
const ESPN_SPORT_CONFIGS = {
  basketball: {
    sport: 'basketball',
    espn_sport_key: 'basketball',
    logo_path_template: '/i/teamlogos/nba/500/{teamId}.png',
    player_path_template: '/i/headshots/nba/players/full/{playerId}.png',
    is_active: true
  },
  football: {
    sport: 'football',
    espn_sport_key: 'football',
    logo_path_template: '/i/teamlogos/nfl/500/{teamId}.png',
    player_path_template: '/i/headshots/nfl/players/full/{playerId}.png',
    is_active: true
  },
  baseball: {
    sport: 'baseball',
    espn_sport_key: 'baseball',
    logo_path_template: '/i/teamlogos/mlb/500/{teamId}.png',
    player_path_template: '/i/headshots/mlb/players/full/{playerId}.png',
    is_active: true
  },
  hockey: {
    sport: 'hockey',
    espn_sport_key: 'hockey',
    logo_path_template: '/i/teamlogos/nhl/500/{teamId}.png',
    player_path_template: '/i/headshots/nhl/players/full/{playerId}.png',
    is_active: true
  },
  soccer: {
    sport: 'soccer',
    espn_sport_key: 'soccer',
    logo_path_template: '/i/teamlogos/soccer/500/{teamId}.png',
    player_path_template: '/i/headshots/soccer/players/full/{playerId}.png',
    is_active: true
  }
};

// Team ID mappings for ESPN CDN
const TEAM_ID_MAP = {
  basketball: {
    'Lakers': '3', 'Warriors': '9', 'Celtics': '2', 'Heat': '14', 'Bulls': '4',
    'Knicks': '18', 'Nets': '17', '76ers': '21', 'Raptors': '28', 'Bucks': '15',
    'Pacers': '11', 'Pistons': '8', 'Cavaliers': '5', 'Hawks': '1', 'Hornets': '30',
    'Magic': '19', 'Wizards': '27', 'Nuggets': '7', 'Timberwolves': '16', 'Thunder': '25',
    'Trail Blazers': '22', 'Jazz': '26', 'Suns': '24', 'Kings': '23', 'Clippers': '12',
    'Mavericks': '6', 'Rockets': '10', 'Grizzlies': '29', 'Pelicans': '20', 'Spurs': '24'
  },
  football: {
    'Patriots': 'ne', 'Chiefs': 'kc', 'Bills': 'buf', 'Dolphins': 'mia', 'Jets': 'nyj',
    'Steelers': 'pit', 'Ravens': 'bal', 'Browns': 'cle', 'Bengals': 'cin', 'Colts': 'ind',
    'Titans': 'ten', 'Texans': 'hou', 'Jaguars': 'jax', 'Broncos': 'den', 'Raiders': 'lv',
    'Chargers': 'lac', 'Cowboys': 'dal', 'Eagles': 'phi', 'Giants': 'nyg', 'Commanders': 'wsh',
    'Packers': 'gb', 'Vikings': 'min', 'Bears': 'chi', 'Lions': 'det', 'Falcons': 'atl',
    'Saints': 'no', 'Panthers': 'car', 'Buccaneers': 'tb', 'Rams': 'lar', '49ers': 'sf',
    'Seahawks': 'sea', 'Cardinals': 'ari'
  },
  baseball: {
    'Yankees': 'nyy', 'Red Sox': 'bos', 'Rays': 'tb', 'Blue Jays': 'tor', 'Orioles': 'bal',
    'Astros': 'hou', 'Angels': 'laa', 'Athletics': 'oak', 'Mariners': 'sea', 'Rangers': 'tex',
    'Twins': 'min', 'Guardians': 'cle', 'Tigers': 'det', 'Royals': 'kc', 'White Sox': 'cws',
    'Braves': 'atl', 'Mets': 'nym', 'Phillies': 'phi', 'Marlins': 'mia', 'Nationals': 'was',
    'Cubs': 'chc', 'Brewers': 'mil', 'Cardinals': 'stl', 'Pirates': 'pit', 'Reds': 'cin',
    'Dodgers': 'lad', 'Padres': 'sd', 'Giants': 'sf', 'Diamondbacks': 'ari', 'Rockies': 'col'
  },
  hockey: {
    'Maple Leafs': 'tor', 'Bruins': 'bos', 'Lightning': 'tb', 'Panthers': 'fla', 'Red Wings': 'det',
    'Sabres': 'buf', 'Senators': 'ott', 'Canadiens': 'mtl', 'Rangers': 'nyr', 'Islanders': 'nyi',
    'Devils': 'nj', 'Flyers': 'phi', 'Penguins': 'pit', 'Capitals': 'was', 'Hurricanes': 'car',
    'Blue Jackets': 'cbj', 'Blackhawks': 'chi', 'Wild': 'min', 'Stars': 'dal', 'Predators': 'nsh',
    'Jets': 'wpg', 'Avalanche': 'col', 'Blues': 'stl', 'Coyotes': 'ari', 'Golden Knights': 'vgk',
    'Kings': 'la', 'Ducks': 'ana', 'Sharks': 'sj', 'Oilers': 'edm', 'Flames': 'cgy',
    'Canucks': 'van', 'Kraken': 'sea'
  }
};

interface VerificationResult {
  success: boolean;
  stats: {
    teamsVerified: number;
    teamsHealthy: number;
    teamsStale: number;
    teamsFixed: number;
    playersVerified: number;
    playersHealthy: number;
    playersStale: number;
    playersFixed: number;
  };
  bySport: Record<string, { healthy: number; stale: number; fixed: number }>;
  staleUrls: Array<{ name: string; sport: string; url: string; reason: string }>;
  healthMetrics: {
    overallHealthPercent: number;
    teamsWithLogos: number;
    totalTeams: number;
    playersWithPhotos: number;
    totalPlayers: number;
  };
}

async function verifyImageURL(url: string): Promise<{ healthy: boolean; reason?: string }> {
  try {
    const response = await fetch(url, { 
      method: 'HEAD',
      signal: AbortSignal.timeout(10000) // 10 second timeout
    });
    
    if (!response.ok) {
      return { healthy: false, reason: `HTTP ${response.status}` };
    }
    
    return { healthy: true };
  } catch (error) {
    return { 
      healthy: false, 
      reason: error.name === 'TimeoutError' ? 'Timeout' : error.message 
    };
  }
}

async function generateTeamLogoURL(teamName: string, sport: string, league: string): Promise<string | null> {
  try {
    const config = ESPN_SPORT_CONFIGS[sport.toLowerCase()];
    if (!config) return null;

    const teamId = TEAM_ID_MAP[sport.toLowerCase()]?.[teamName];
    if (!teamId) return null;

    const url = `https://a.espncdn.com${config.logo_path_template}`
      .replace('{sport}', config.espn_sport_key)
      .replace('{teamId}', teamId);

    // Verify URL exists
    const response = await fetch(url, { method: 'HEAD' });
    return response.ok ? url : null;
  } catch {
    return null;
  }
}

async function generatePlayerPhotoURL(playerId: string, sport: string): Promise<string | null> {
  try {
    const config = ESPN_SPORT_CONFIGS[sport.toLowerCase()];
    if (!config || !config.player_path_template) return null;

    const url = `https://a.espncdn.com${config.player_path_template}`
      .replace('{sport}', config.espn_sport_key)
      .replace('{playerId}', playerId);

    // Verify URL exists
    const response = await fetch(url, { method: 'HEAD' });
    return response.ok ? url : null;
  } catch {
    return null;
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
      error_message: errorMessage
    });
  } catch (error) {
    console.error('Failed to log audit event:', error);
  }
}

Deno.serve(async (req: Request) => {
  try {
    const url = new URL(req.url);
    const sport = url.searchParams.get('sport');
    
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

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
        playersFixed: 0
      },
      bySport: {},
      staleUrls: [],
      healthMetrics: {
        overallHealthPercent: 0,
        teamsWithLogos: 0,
        totalTeams: 0,
        playersWithPhotos: 0,
        totalPlayers: 0
      }
    };

    // Verify teams with logos
    let teamsQuery = supabase
      .from('teams')
      .select('id, name, sport, league, logo_url')
      .not('logo_url', 'is', null);
    
    if (sport) {
      teamsQuery = teamsQuery.eq('sport', sport);
    }
    
    const { data: teams, error: teamsError } = await teamsQuery;
    if (teamsError) throw teamsError;

    for (const team of teams || []) {
      result.stats.teamsVerified++;
      
      const verification = await verifyImageURL(team.logo_url);
      
      if (verification.healthy) {
        result.stats.teamsHealthy++;
        result.bySport[team.sport] = result.bySport[team.sport] || { healthy: 0, stale: 0, fixed: 0 };
        result.bySport[team.sport].healthy++;
      } else {
        result.stats.teamsStale++;
        result.stats.teamsFixed++;
        result.bySport[team.sport] = result.bySport[team.sport] || { healthy: 0, stale: 0, fixed: 0 };
        result.bySport[team.sport].stale++;
        result.bySport[team.sport].fixed++;
        result.staleUrls.push({
          name: team.name,
          sport: team.sport,
          url: team.logo_url,
          reason: verification.reason || 'Unknown'
        });

        // Try to fix with fresh ESPN URL
        try {
          const freshUrl = await generateTeamLogoURL(team.name, team.sport, team.league);
          if (freshUrl) {
            const { error: updateError } = await supabase
              .from('teams')
              .update({
                logo_url: freshUrl,
                last_updated: new Date().toISOString()
              })
              .eq('id', team.id);

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
              );
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
          );
        }
      }
    }

    // Verify players with headshots
    let playersQuery = supabase
      .from('players')
      .select('id, name, sport, headshot_url')
      .not('headshot_url', 'is', null);
    
    if (sport) {
      playersQuery = playersQuery.eq('sport', sport);
    }
    
    const { data: players, error: playersError } = await playersQuery;
    if (playersError) throw playersError;

    for (const player of players || []) {
      result.stats.playersVerified++;
      
      const verification = await verifyImageURL(player.headshot_url);
      
      if (verification.healthy) {
        result.stats.playersHealthy++;
        result.bySport[player.sport] = result.bySport[player.sport] || { healthy: 0, stale: 0, fixed: 0 };
        result.bySport[player.sport].healthy++;
      } else {
        result.stats.playersStale++;
        result.stats.playersFixed++;
        result.bySport[player.sport] = result.bySport[player.sport] || { healthy: 0, stale: 0, fixed: 0 };
        result.bySport[player.sport].stale++;
        result.bySport[player.sport].fixed++;
        result.staleUrls.push({
          name: player.name,
          sport: player.sport,
          url: player.headshot_url,
          reason: verification.reason || 'Unknown'
        });

        // Try to fix with fresh ESPN URL
        try {
          const playerId = player.id.split('-')[0] || player.name.replace(/\s+/g, '-').toLowerCase();
          const freshUrl = await generatePlayerPhotoURL(playerId, player.sport);
          if (freshUrl) {
            const { error: updateError } = await supabase
              .from('players')
              .update({
                headshot_url: freshUrl,
                last_updated: new Date().toISOString()
              })
              .eq('id', player.id);

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
              );
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
          );
        }
      }
    }

    // Calculate health metrics
    const totalVerified = result.stats.teamsVerified + result.stats.playersVerified;
    const totalHealthy = result.stats.teamsHealthy + result.stats.playersHealthy;
    result.healthMetrics.overallHealthPercent = totalVerified > 0 ? Math.round((totalHealthy / totalVerified) * 100) : 0;

    // Get total counts for coverage metrics
    const { count: totalTeams } = await supabase
      .from('teams')
      .select('*', { count: 'exact', head: true });
    
    const { count: teamsWithLogos } = await supabase
      .from('teams')
      .select('*', { count: 'exact', head: true })
      .not('logo_url', 'is', null);

    const { count: totalPlayers } = await supabase
      .from('players')
      .select('*', { count: 'exact', head: true });
    
    const { count: playersWithPhotos } = await supabase
      .from('players')
      .select('*', { count: 'exact', head: true })
      .not('headshot_url', 'is', null);

    result.healthMetrics.totalTeams = totalTeams || 0;
    result.healthMetrics.teamsWithLogos = teamsWithLogos || 0;
    result.healthMetrics.totalPlayers = totalPlayers || 0;
    result.healthMetrics.playersWithPhotos = playersWithPhotos || 0;

    return new Response(JSON.stringify(result), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      },
    });

  } catch (error) {
    console.error('Error in verify-images function:', error);
    
    return new Response(JSON.stringify({
      success: false,
      error: error.message || 'Unknown error occurred'
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      },
    });
  }
});
