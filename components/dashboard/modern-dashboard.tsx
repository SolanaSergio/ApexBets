"use client"

import { useState, useEffect } from "react"
import { useRealTimeData, useLiveGames, useDashboardStats } from "@/components/data/real-time-provider"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { TrendingUp, TrendingDown, Activity, Users, Target, BarChart3, Zap, Gamepad2, Trophy, Clock, Calendar } from "lucide-react"
import { SportConfigManager, SupportedSport } from "@/lib/services/core/sport-config"

interface LiveGameData {
  id: string
  homeTeam: string
  awayTeam: string
  homeScore: number
  awayScore: number
  status: string
  quarter: string
  timeRemaining: string
  sport: string
}

interface DashboardStats {
  liveGames: number
  totalPredictions: number
  accuracyRate: number
  teamsTracked: number
  dataPoints: number
  trend: "up" | "down" | "neutral"
}

export function ModernDashboard() {
  const { selectedSport, setSelectedSport } = useRealTimeData()
  const { games: liveGames, loading: gamesLoading, isConnected } = useLiveGames()
  const { stats, loading: statsLoading, lastUpdate } = useDashboardStats()
  const [supportedSports, setSupportedSports] = useState<SupportedSport[]>([])
  const [sportsLoading, setSportsLoading] = useState(true)

  useEffect(() => {
    loadSupportedSports()
  }, [])

  const loadSupportedSports = async () => {
    try {
      setSportsLoading(true)
      await SportConfigManager.initialize()
      const sports = SportConfigManager.getSupportedSports()
      setSupportedSports(sports)
    } catch (error) {
      console.error('Error loading supported sports:', error)
      SportConfigManager.initializeSync()
      const sports = SportConfigManager.getSupportedSports()
      setSupportedSports(sports)
    } finally {
      setSportsLoading(false)
    }
  }

  const dashboardStats: DashboardStats = {
    liveGames: liveGames.length,
    totalPredictions: stats.totalGames || 0,
    accuracyRate: stats.accuracy || 0,
    teamsTracked: stats.teamsTracked || 0,
    dataPoints: stats.dataPoints || 0,
    trend: "up"
  }

  const getSportIcon = (sport: SupportedSport) => {
    // Dynamic icon mapping based on sport configuration
    const config = SportConfigManager.getSportConfig(sport)
    if (config?.icon) {
      // Map common icon names to Lucide icons
      const iconMap: Record<string, any> = {
        'zap': Zap,
        'activity': Activity,
        'target': Target,
        'gamepad2': Gamepad2,
        'trophy': Trophy
      }
      return iconMap[config.icon.toLowerCase()] || Trophy
    }
    return Trophy
  }

  const getSportColor = (sport: SupportedSport) => {
    // Dynamic color mapping based on sport configuration
    const config = SportConfigManager.getSportConfig(sport)
    if (config?.color) {
      // Use color from config, fallback to default gradient
      return config.color.includes('gradient') ? config.color : "from-primary to-primary/80"
    }
    return "from-muted to-muted/80"
  }

  if (sportsLoading) {
    return (
      <div className="space-y-8 lg:space-y-12">
        <div className="text-center py-8">
          <div className="glass-card p-8 rounded-lg max-w-md mx-auto">
            <div className="flex items-center justify-center mb-4">
              <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Loading Sports Data</h3>
            <p className="text-muted-foreground">
              Fetching available sports and configuration...
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-4 justify-center">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="h-12 w-32 bg-muted rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8 lg:space-y-12">
      {/* Dynamic Sport Selector */}
      <div className="flex flex-wrap gap-4 justify-center">
        {supportedSports.map((sport) => {
          const SportIcon = getSportIcon(sport)
          const sportColor = getSportColor(sport)
          const config = SportConfigManager.getSportConfig(sport)
          const isSelected = selectedSport === sport

          return (
            <Button
              key={sport}
              onClick={() => setSelectedSport(sport)}
              variant={isSelected ? "default" : "outline"}
              className={`
                px-4 sm:px-6 py-3 sm:py-4 rounded-lg transition-all duration-500 font-bold text-sm sm:text-base
                ${isSelected
                  ? `bg-gradient-to-r ${sportColor} text-white shadow-xl premium-glow hover:shadow-2xl`
                  : 'glass-card hover:bg-white/80 hover:scale-105 hover:shadow-lg border-2 hover:border-primary/30'
                }
              `}
            >
              <SportIcon className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
              <span className="hidden sm:inline">{config?.name || sport}</span>
              <span className="sm:hidden">{config?.name?.slice(0, 3) || sport.slice(0, 3)}</span>
            </Button>
          )
        })}
      </div>

      {/* Connection Status */}
      <div className="flex justify-center">
        <div className={`
          glass-card px-6 py-3 rounded-lg border-2 transition-all duration-500 hover:scale-105
          ${isConnected
            ? 'border-green-500/30 glow-green hover:shadow-lg hover:shadow-green-500/20'
            : 'border-red-500/30 glow-red hover:shadow-lg hover:shadow-red-500/20'
          }
        `}>
          <div className="flex items-center gap-3">
            <div className={`
              w-3 h-3 rounded-full animate-pulse shadow-lg
              ${isConnected ? 'bg-green-500 shadow-green-500/50' : 'bg-red-500 shadow-red-500/50'}
            `} />
            <span className="font-bold text-slate-800">
              {isConnected ? 'Live Data Connected' : 'Connecting...'}
            </span>
            {lastUpdate && (
              <span className="text-sm text-slate-600 bg-slate-100 px-2 py-1 rounded">
                Updated {new Date(lastUpdate).toLocaleTimeString()}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6 lg:gap-8">
        <StatCard
          title="Live Games"
          value={dashboardStats.liveGames}
          icon={Activity}
          color="from-cyan-500 to-blue-500"
          trend={dashboardStats.trend}
          loading={gamesLoading}
        />
        <StatCard
          title="Predictions"
          value={dashboardStats.totalPredictions}
          icon={Target}
          color="from-cyan-500 to-blue-500"
          trend={dashboardStats.trend}
          loading={statsLoading}
        />
        <StatCard
          title="Accuracy"
          value={`${dashboardStats.accuracyRate}%`}
          icon={TrendingUp}
          color="from-green-500 to-emerald-500"
          trend={dashboardStats.trend}
          loading={statsLoading}
        />
        <StatCard
          title="Teams"
          value={dashboardStats.teamsTracked}
          icon={Users}
          color="from-purple-500 to-pink-500"
          trend={dashboardStats.trend}
          loading={statsLoading}
        />
        <StatCard
          title="Data Points"
          value={dashboardStats.dataPoints.toLocaleString()}
          icon={BarChart3}
          color="from-indigo-500 to-purple-500"
          trend={dashboardStats.trend}
          loading={statsLoading}
        />
      </div>

      {/* Live Games Grid */}
      <div className="space-y-6">
        <h2 className="text-3xl font-black text-gradient text-center">Live Games</h2>
        {gamesLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="glass-card p-6 rounded-lg animate-pulse">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="h-6 w-16 bg-muted rounded" />
                    <div className="h-4 w-20 bg-muted rounded" />
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="h-4 w-24 bg-muted rounded" />
                      <div className="h-6 w-8 bg-muted rounded" />
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="h-4 w-24 bg-muted rounded" />
                      <div className="h-6 w-8 bg-muted rounded" />
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="h-3 w-16 bg-muted rounded" />
                    <div className="h-3 w-12 bg-muted rounded" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : liveGames && liveGames.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {liveGames.slice(0, 6).map((game: LiveGameData) => (
              <LiveGameCard key={game.id} game={game} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="glass-card p-8 rounded-lg max-w-md mx-auto">
              <Activity className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">No Live Games</h3>
              <p className="text-muted-foreground mb-4">
                There are currently no games in progress for {selectedSport || 'the selected sport'}.
              </p>
              <p className="text-sm text-muted-foreground">
                Check back later or switch to a different sport to see live action.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Upcoming Games Section */}
      <UpcomingGamesSection selectedSport={selectedSport} />
    </div>
  )
}

interface StatCardProps {
  title: string
  value: string | number
  icon: React.ComponentType<any>
  color: string
  trend: "up" | "down" | "neutral"
  loading?: boolean
}

function StatCard({ title, value, icon: Icon, color, trend, loading }: StatCardProps) {
  return (
    <div className="glass-card p-6 rounded-lg card-hover relative overflow-hidden">
      <div className={`absolute inset-0 bg-gradient-to-br ${color} opacity-10 group-hover:opacity-20 transition-opacity duration-500`} />
      <div className="relative z-10 space-y-4">
        <div className="flex items-center justify-between">
          <div className={`w-12 h-12 bg-gradient-to-br ${color} rounded-lg flex items-center justify-center premium-glow`}>
            <Icon className="h-6 w-6 text-white" />
          </div>
          <div className="flex items-center gap-1">
            {trend === "up" && <TrendingUp className="h-4 w-4 text-green-500" />}
            {trend === "down" && <TrendingDown className="h-4 w-4 text-red-500" />}
            {trend === "neutral" && <div className="w-4 h-4 bg-gray-400 rounded-sm" />}
          </div>
        </div>
        <div>
          <p className="text-sm font-bold text-slate-600 uppercase tracking-wide">{title}</p>
          <p className="text-3xl font-black text-gradient">
            {loading ? "..." : value}
          </p>
        </div>
      </div>
    </div>
  )
}

interface LiveGameCardProps {
  game: LiveGameData
}

function LiveGameCard({ game }: LiveGameCardProps) {
  const formatTimeRemaining = (timeRemaining: string) => {
    if (!timeRemaining) return 'Live'
    return timeRemaining
  }

  const formatQuarter = (quarter: string) => {
    if (!quarter) return 'Live'
    return quarter
  }

  return (
    <div className="glass-card p-6 rounded-lg card-hover relative overflow-hidden border-2 border-red-200 hover:border-red-300 transition-all duration-300">
      <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-red-500/20 to-pink-500/20 rounded-lg blur-2xl" />
      <div className="relative z-10 space-y-4">
        <div className="flex items-center justify-between">
          <Badge variant="destructive" className="rounded-md font-bold animate-pulse bg-red-500">
            🔴 LIVE
          </Badge>
          <span className="text-sm font-bold text-slate-600 uppercase">
            {game.sport}
          </span>
        </div>
        
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="font-bold text-slate-800">{game.homeTeam}</span>
            <span className="text-2xl font-black text-gradient bg-gradient-to-r from-red-500 to-pink-500 bg-clip-text text-transparent">
              {game.homeScore}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="font-bold text-slate-800">{game.awayTeam}</span>
            <span className="text-2xl font-black text-gradient bg-gradient-to-r from-red-500 to-pink-500 bg-clip-text text-transparent">
              {game.awayScore}
            </span>
          </div>
        </div>
        
        <div className="flex items-center justify-between text-sm">
          <span className="font-bold text-slate-600 bg-red-50 px-2 py-1 rounded">
            {formatQuarter(game.quarter)}
          </span>
          <span className="font-bold text-slate-600 bg-red-50 px-2 py-1 rounded">
            {formatTimeRemaining(game.timeRemaining)}
          </span>
        </div>
        
        <div className="pt-2 border-t border-red-100">
          <div className="flex items-center justify-center">
            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse mr-2" />
            <span className="text-xs text-red-600 font-semibold">Live Updates Active</span>
          </div>
        </div>
      </div>
    </div>
  )
}

interface UpcomingGameData {
  id: string
  homeTeam: string
  awayTeam: string
  gameDate: string
  venue?: string
  sport: string
  league: string
}

interface UpcomingGamesSectionProps {
  selectedSport: string
}

function UpcomingGamesSection({ selectedSport }: UpcomingGamesSectionProps) {
  const [upcomingGames, setUpcomingGames] = useState<UpcomingGameData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchUpcomingGames = async () => {
      if (!selectedSport) {
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        setError(null)
        
        const response = await fetch(`/api/database-first/games?sport=${selectedSport}&status=scheduled&limit=6`)
        const data = await response.json()

        if (data.success && Array.isArray(data.data)) {
          const games = data.data.map((game: any) => ({
            id: game.id,
            homeTeam: game.home_team_data?.name || game.home_team_name || 'TBD',
            awayTeam: game.away_team_data?.name || game.away_team_name || 'TBD',
            gameDate: game.game_date,
            venue: game.venue,
            sport: game.sport,
            league: game.league
          }))
          setUpcomingGames(games)
        } else {
          setUpcomingGames([])
        }
      } catch (err) {
        console.error('Failed to fetch upcoming games:', err)
        setError('Failed to load upcoming games')
        setUpcomingGames([])
      } finally {
        setLoading(false)
      }
    }

    fetchUpcomingGames()
  }, [selectedSport])

  const formatGameDate = (dateString: string) => {
    try {
      const date = new Date(dateString)
      const now = new Date()
      const diffInHours = (date.getTime() - now.getTime()) / (1000 * 60 * 60)
      
      if (diffInHours < 24) {
        return {
          date: date.toLocaleDateString('en-US', { 
            weekday: 'short', 
            month: 'short', 
            day: 'numeric' 
          }),
          time: date.toLocaleTimeString('en-US', { 
            hour: 'numeric', 
            minute: '2-digit',
            hour12: true 
          }),
          relative: diffInHours < 1 ? 'Starting Soon' : `In ${Math.round(diffInHours)}h`
        }
      } else {
        return {
          date: date.toLocaleDateString('en-US', { 
            weekday: 'short', 
            month: 'short', 
            day: 'numeric' 
          }),
          time: date.toLocaleTimeString('en-US', { 
            hour: 'numeric', 
            minute: '2-digit',
            hour12: true 
          }),
          relative: `${Math.round(diffInHours / 24)} days`
        }
      }
    } catch {
      return {
        date: 'TBD',
        time: 'TBD',
        relative: 'TBD'
      }
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <h2 className="text-3xl font-black text-gradient text-center">Upcoming Games</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="glass-card p-6 rounded-lg animate-pulse">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="h-6 w-20 bg-muted rounded" />
                  <div className="h-4 w-16 bg-muted rounded" />
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="h-4 w-24 bg-muted rounded" />
                    <div className="h-4 w-8 bg-muted rounded" />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="h-4 w-24 bg-muted rounded" />
                    <div className="h-4 w-8 bg-muted rounded" />
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="h-3 w-16 bg-muted rounded" />
                  <div className="h-3 w-12 bg-muted rounded" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-black text-gradient text-center">Upcoming Games</h2>
      {error ? (
        <div className="text-center py-8">
          <div className="glass-card p-8 rounded-lg max-w-md mx-auto">
            <Calendar className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">Unable to Load Games</h3>
            <p className="text-muted-foreground">{error}</p>
          </div>
        </div>
      ) : upcomingGames.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {upcomingGames.map((game) => {
            const timeInfo = formatGameDate(game.gameDate)
            return (
              <UpcomingGameCard key={game.id} game={game} timeInfo={timeInfo} />
            )
          })}
        </div>
      ) : (
        <div className="text-center py-8">
          <div className="glass-card p-8 rounded-lg max-w-md mx-auto">
            <Calendar className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">No Upcoming Games</h3>
            <p className="text-muted-foreground mb-4">
              No scheduled games found for {selectedSport || 'the selected sport'}.
            </p>
            <p className="text-sm text-muted-foreground">
              Check back later or switch to a different sport.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

interface UpcomingGameCardProps {
  game: UpcomingGameData
  timeInfo: {
    date: string
    time: string
    relative: string
  }
}

function UpcomingGameCard({ game, timeInfo }: UpcomingGameCardProps) {
  return (
    <div className="glass-card p-6 rounded-lg card-hover relative overflow-hidden border border-blue-200 hover:border-blue-300 transition-all duration-300">
      <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-blue-500/20 to-indigo-500/20 rounded-lg blur-2xl" />
      <div className="relative z-10 space-y-4">
        <div className="flex items-center justify-between">
          <Badge variant="outline" className="border-blue-300 text-blue-700 bg-blue-50">
            <Clock className="h-3 w-3 mr-1" />
            {timeInfo.relative}
          </Badge>
          <span className="text-sm font-bold text-slate-600 uppercase">
            {game.sport}
          </span>
        </div>
        
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="font-bold text-slate-800">{game.homeTeam}</span>
            <span className="text-sm text-muted-foreground">vs</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="font-bold text-slate-800">{game.awayTeam}</span>
            <span className="text-sm text-muted-foreground">vs</span>
          </div>
        </div>
        
        <div className="space-y-2 pt-2 border-t border-blue-100">
          <div className="flex items-center justify-between text-sm">
            <span className="font-semibold text-blue-700">{timeInfo.date}</span>
            <span className="font-semibold text-blue-700">{timeInfo.time}</span>
          </div>
          {game.venue && (
            <div className="text-xs text-muted-foreground text-center">
              📍 {game.venue}
            </div>
          )}
          <div className="text-xs text-center text-blue-600 font-medium">
            {game.league}
          </div>
        </div>
      </div>
    </div>
  )
}
