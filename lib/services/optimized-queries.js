/**
 * Optimized Database Queries
 * Fixed queries that were causing performance issues
 */

// Optimized games query without week column
const OPTIMIZED_GAMES_QUERY = `
  SELECT 
    g.id,
    g.external_id,
    g.sport,
    g.league_id,
    g.league_name,
    g.season,
    g.home_team_id,
    g.away_team_id,
    g.home_team_name,
    g.away_team_name,
    g.home_team_score,
    g.away_team_score,
    g.game_date,
    g.game_time_local,
    g.status,
    g.game_type,
    g.venue,
    g.attendance,
    g.weather_conditions,
    g.referee_info,
    g.broadcast_info,
    g.betting_odds,
    g.last_updated,
    g.created_at,
    ht.name as home_team_name_clean,
    at.name as away_team_name_clean
  FROM games g
  LEFT JOIN teams ht ON g.home_team_id = ht.id
  LEFT JOIN teams at ON g.away_team_id = at.id
  WHERE g.sport = $1
    AND g.status = $2
  ORDER BY g.game_date DESC
  LIMIT $3
`;

// Optimized predictions query
const OPTIMIZED_PREDICTIONS_QUERY = `
  SELECT 
    p.id,
    p.game_id,
    p.model_name,
    p.prediction_type,
    p.predicted_value,
    p.confidence,
    p.actual_value,
    p.is_correct,
    p.sport,
    p.league,
    p.reasoning,
    p.model_version,
    p.created_at
  FROM predictions p
  WHERE p.sport = $1
  ORDER BY p.created_at DESC
  LIMIT $2
`;

// Optimized odds query
const OPTIMIZED_ODDS_QUERY = `
  SELECT 
    o.id,
    o.game_id,
    o.source,
    o.odds_type,
    o.home_odds,
    o.away_odds,
    o.spread,
    o.total,
    o.timestamp,
    o.sport,
    o.league,
    o.prop_bets,
    o.live_odds,
    o.created_at
  FROM odds o
  WHERE o.sport = $1
  ORDER BY o.timestamp DESC
  LIMIT $2
`;

// Optimized analytics query
const OPTIMIZED_ANALYTICS_QUERY = `
  SELECT 
    COUNT(*) as total_games,
    COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_games,
    COUNT(CASE WHEN status = 'live' THEN 1 END) as live_games,
    COUNT(CASE WHEN status = 'scheduled' THEN 1 END) as scheduled_games
  FROM games 
  WHERE sport = $1
`;

module.exports = {
  OPTIMIZED_GAMES_QUERY,
  OPTIMIZED_PREDICTIONS_QUERY,
  OPTIMIZED_ODDS_QUERY,
  OPTIMIZED_ANALYTICS_QUERY
};
