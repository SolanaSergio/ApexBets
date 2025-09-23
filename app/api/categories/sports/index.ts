// Sports Category API Routes
// Removed games route import - route doesn't exist
export { GET as getLiveGames } from '../../live-scores/route'
export { GET as getTeams } from '../../teams/route'
export { GET as getPlayers } from '../../players/route'
export { GET as getStandings } from '../../standings/route'
export { GET as getOdds } from '../../odds/[sport]/route'
