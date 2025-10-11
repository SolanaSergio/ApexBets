
export function mapSports(sports: any[]): any[] {
  return sports.map(sport => ({
    id: sport.key,
    name: sport.title,
    is_active: sport.active,
  }))
}

export function mapGames(games: any[]): any[] {
  return games.map(game => ({
    id: game.idEvent,
    name: game.strEvent,
    home_team: game.strHomeTeam,
    away_team: game.strAwayTeam,
    game_date: new Date(`${game.dateEvent}T${game.strTime}`),
    status: game.strStatus,
    home_score: game.intHomeScore,
    away_score: game.intAwayScore,
    league: game.strLeague,
    sport: game.strSport,
    venue: game.strVenue,
  }))
}

export function mapTeams(teams: any[]): any[] {
  return teams.map(team => ({
    id: team.idTeam,
    name: team.strTeam,
    short_name: team.strTeamShort,
    league: team.strLeague,
    sport: team.strSport,
    stadium: team.strStadium,
    badge_url: team.strTeamBadge,
  }))
}
