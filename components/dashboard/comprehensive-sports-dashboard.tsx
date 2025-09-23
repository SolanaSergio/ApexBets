"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { 
  Activity, 
  BarChart3, 
  Target, 
  Users, 
  TrendingUp, 
  TrendingDown,
  Zap,
  Trophy,
  Calendar,
  Clock,
  RefreshCw,
  Gamepad2
} from "lucide-react"
import { useRealTimeData, useLiveGames, usePredictions, useOdds } from "@/components/data/real-time-provider"
import { useSports, Sport } from "@/hooks/use-sports"
import { LiveTeamsWidget } from "./live-teams-widget"
import { LiveStandingsWidget } from "./live-standings-widget"
import { EnhancedErrorBoundary } from "@/components/error/enhanced-error-boundary"
// Loading components removed - using built-in loading states

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

interface StatsCardProps {
  title: string
  value: string | number
  icon: React.ComponentType<any>
  color: string
  trend?: "up" | "down" | "neutral"
  loading?: boolean
  subtitle?: string
}

function StatsCard({ title, value, icon: Icon, color, trend, loading, subtitle }: StatsCardProps) {
  return (
    <Card className="relative overflow-hidden">
      <div className={`absolute inset-0 bg-gradient-to-br ${color} opacity-5`} />
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <div className="flex items-center gap-2">
          {trend === "up" && <TrendingUp className="h-4 w-4 text-accent" />}
          {trend === "down" && <TrendingDown className="h-4 w-4 text-destructive" />}
          <Icon className={`h-4 w-4 text-primary`} />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">
          {loading ? "..." : value}
        </div>
        {subtitle && (
          <p className="text-xs text-muted-foreground">{subtitle}</p>
        )}
      </CardContent>
    </Card>
  )
}

function LiveGameCard({ game }: { game: LiveGameData }) {
  return (
    <Card className="relative overflow-hidden">
      <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-br from-primary/20 to-accent/20 rounded-lg blur-xl" />
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <Badge variant="destructive" className="text-xs">
            LIVE
          </Badge>
          <span className="text-xs font-medium text-muted-foreground uppercase">
            {game.sport}
          </span>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-medium">{game.homeTeam}</span>
            <span className="text-xl font-bold text-primary">{game.homeScore}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="font-medium">{game.awayTeam}</span>
            <span className="text-xl font-bold text-primary">{game.awayScore}</span>
          </div>
        </div>
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>{game.quarter}</span>
          <span>{game.timeRemaining}</span>
        </div>
      </CardContent>
    </Card>
  )
}

function SportSelector({
  sports,
  selectedSport,
  onSportChange
}: {
  sports: Sport[]
  selectedSport: string
  onSportChange: (sport: string) => void
}) {
  // Dynamic icon mapping based on sport data from database
  const getSportIcon = (sport: Sport) => {
    if (sport.icon) {
      // Map common icon names to Lucide icons
      const iconMap: Record<string, any> = {
        'zap': Zap,
        'activity': Activity,
        'target': Target,
        'gamepad2': Gamepad2,
        'trophy': Trophy,
        '⚽': Gamepad2,
        '🏀': Gamepad2,
        '🏈': Gamepad2,
        '⚾': Gamepad2,
        '🏒': Gamepad2,
        '🎾': Gamepad2,
        '⛳': Gamepad2
      }
      return iconMap[sport.icon.toLowerCase()] || Trophy
    }
    return Trophy
  }

  // Dynamic color mapping based on sport data from database
  const getSportColor = (sport: Sport) => {
    if (sport.color) {
      // Use color from database, fallback to default gradient
      return sport.color.includes('gradient') ? sport.color : `from-[${sport.color}] to-[${sport.color}]/80`
    }
    return "from-primary to-primary/80"
  }

  return (
    <div className="flex flex-wrap gap-2 sm:gap-3 justify-center lg:justify-start">
      {sports.map((sport) => {
        const SportIcon = getSportIcon(sport)
        const sportColor = getSportColor(sport)
        const isSelected = selectedSport === sport.name

        return (
          <Button
            key={sport.id}
            onClick={() => onSportChange(sport.name)}
            variant={isSelected ? "default" : "outline"}
            className={`px-3 sm:px-4 py-2 text-sm hover:scale-105 transition-transform ${
              isSelected ? `bg-gradient-to-r ${sportColor} text-white` : ''
            }`}
          >
            <SportIcon className="w-4 h-4 mr-1 sm:mr-2" />
            <span className="hidden sm:inline">{sport.display_name}</span>
            <span className="sm:hidden">{sport.display_name.slice(0, 3)}</span>
          </Button>
        )
      })}
    </div>
  )
}

export function ComprehensiveSportsDashboard() {
  const { data, refreshData, selectedSport, setSelectedSport } = useRealTimeData()
  const { games: liveGames, loading: gamesLoading, isConnected } = useLiveGames()
  const { predictions, loading: predictionsLoading } = usePredictions()
  useOdds() // Load odds data in background
  
  const { sports, loading: sportsLoading, error: sportsError } = useSports()
  const [refreshing, setRefreshing] = useState(false)

  // Set default sport to first available sport if none selected
  useEffect(() => {
    if (sports.length > 0 && (!selectedSport || selectedSport === "all")) {
      setSelectedSport(sports[0].name)
    }
  }, [sports, selectedSport, setSelectedSport])

  // Handle refresh
  const handleRefresh = async () => {
    setRefreshing(true)
    await refreshData()
    setTimeout(() => setRefreshing(false), 1000)
  }

  if (sportsLoading) {
    return (
      <div className="space-y-8">
        <div className="flex justify-center">
          <div className="h-12 w-64 bg-muted rounded-lg animate-pulse" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-32 bg-muted rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  if (sportsError) {
    return (
      <div className="space-y-8">
        <div className="text-center">
          <div className="text-destructive mb-4">Failed to load sports: {sportsError}</div>
          <Button onClick={() => window.location.reload()}>Retry</Button>
        </div>
      </div>
    )
  }

  if (sports.length === 0) {
    return (
      <div className="space-y-8">
        <div className="text-center">
          <div className="text-muted-foreground mb-4">No sports available</div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4 lg:space-y-6">
      {/* Compact Header with Sport Selector and Controls */}
      <div className="bg-card/50 backdrop-blur-sm rounded-lg border p-4 lg:p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex-1">
            <SportSelector
              sports={sports}
              selectedSport={selectedSport}
              onSportChange={setSelectedSport}
            />
          </div>

          {/* Connection Status & Controls */}
          <div className="flex items-center justify-center lg:justify-end gap-3">
            <div className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm ${
              isConnected ? 'border-accent/30 bg-accent/5' : 'border-destructive/30 bg-destructive/5'
            }`}>
              <div className={`w-2 h-2 rounded-full animate-pulse ${
                isConnected ? 'bg-accent' : 'bg-destructive'
              }`} />
              <span className="font-medium">
                <span className="hidden sm:inline">{isConnected ? 'Live Data Connected' : 'Connecting...'}</span>
                <span className="sm:hidden">{isConnected ? 'Live' : 'Offline'}</span>
              </span>
            </div>

            <Button
              onClick={handleRefresh}
              disabled={refreshing}
              variant="outline"
              size="sm"
              className="text-sm hover:scale-105 transition-transform"
            >
              <RefreshCw className={`w-4 h-4 mr-1 sm:mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Refresh</span>
              <span className="sm:hidden">↻</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Optimized Stats Grid - Better Mobile/Desktop Layout */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
        <StatsCard
          title="Live Games"
          value={data.stats.totalGames || 0}
          icon={Activity}
          color="from-primary to-primary/80"
          trend="up"
          loading={gamesLoading}
          subtitle="Currently active"
        />
        <StatsCard
          title="Predictions"
          value={data.stats.dataPoints || 0}
          icon={Target}
          color="from-secondary to-secondary/80"
          trend="up"
          loading={predictionsLoading}
          subtitle="AI-powered forecasts"
        />
        <StatsCard
          title="Accuracy Rate"
          value={`${data.stats.accuracy || 0}%`}
          icon={TrendingUp}
          color="from-accent to-accent/80"
          trend="up"
          subtitle="Prediction accuracy"
        />
        <StatsCard
          title="Teams Tracked"
          value={data.stats.teamsTracked || 0}
          icon={Users}
          color="from-primary to-accent"
          trend="neutral"
          subtitle={`For ${selectedSport}`}
        />
      </div>

      {/* Enhanced Live Games Section - Better Layout */}
      <Card className="overflow-hidden">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl font-bold flex items-center gap-2">
              <Activity className="h-5 w-5 text-accent animate-pulse" />
              Live Games
            </CardTitle>
            {liveGames && liveGames.length > 0 && (
              <Badge variant="secondary" className="text-xs bg-accent/10 text-accent border-accent/20">
                {liveGames.length} Active
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {gamesLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 lg:gap-4">
              {Array.from({ length: 3 }).map((_, index) => (
                <div key={index} className="h-32 bg-muted rounded-lg animate-pulse" />
              ))}
            </div>
          ) : liveGames && liveGames.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 lg:gap-4">
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
                  {selectedSport ? `No ${selectedSport} games are currently in progress.` : 'No games are currently in progress.'}
                </p>
                <div className="space-y-2 text-sm text-muted-foreground">
                  <p>• Check back later for live action</p>
                  <p>• Switch to a different sport</p>
                  <p>• Enable live updates for notifications</p>
                </div>
                <div className="mt-4 pt-4 border-t border-muted">
                  <p className="text-xs text-muted-foreground">
                    Last checked: {new Date().toLocaleTimeString()}
                  </p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Enhanced Predictions Section - Compact Layout */}
      <Card className="overflow-hidden">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl font-bold flex items-center gap-2">
              <Target className="h-5 w-5 text-primary" />
              Recent Predictions
            </CardTitle>
            <Badge variant="outline" className="text-xs bg-primary/10 text-primary border-primary/20">
              AI-Powered
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          {predictionsLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 lg:gap-4">
              {Array.from({ length: 3 }).map((_, index) => (
                <div key={index} className="h-32 bg-muted rounded-lg animate-pulse" />
              ))}
            </div>
          ) : predictions && predictions.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 lg:gap-4">
              {predictions.slice(0, 6).map((prediction: any, index: number) => (
                <Card key={index} className="relative overflow-hidden border-muted/50 hover:border-primary/30 transition-colors">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <Badge variant="outline" className="text-xs">
                        {prediction.confidence || 'High'} Confidence
                      </Badge>
                      <span className="text-xs text-muted-foreground capitalize">
                        {prediction.sport || selectedSport}
                      </span>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="text-sm font-medium">
                      {prediction.matchup || `${prediction.homeTeam} vs ${prediction.awayTeam}`}
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">Prediction</span>
                      <span className="font-bold text-primary">
                        {prediction.prediction || prediction.winner}
                      </span>
                    </div>
                    {prediction.accuracy && (
                      <Progress value={prediction.accuracy * 100} className="h-2" />
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="glass-card p-8 rounded-lg max-w-md mx-auto">
                <Target className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">No Predictions Available</h3>
                <p className="text-muted-foreground mb-4">
                  {selectedSport ? `No ${selectedSport} predictions available at the moment.` : 'No predictions available at the moment.'}
                </p>
                <div className="space-y-2 text-sm text-muted-foreground">
                  <p>• Predictions are generated for upcoming games</p>
                  <p>• Check back when games are scheduled</p>
                  <p>• Try switching to a different sport</p>
                </div>
                <div className="mt-4 pt-4 border-t border-muted">
                  <p className="text-xs text-muted-foreground">
                    Last checked: {new Date().toLocaleTimeString()}
                  </p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Compact Stats Overview - Better Space Utilization */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 lg:gap-4">
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Calendar className="h-4 w-4 text-primary" />
              Today's Schedule
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Scheduled Games</span>
                <span className="font-bold">{data.stats.scheduledGames || 0}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Live Now</span>
                <span className="font-bold text-accent">{data.stats.liveGames || 0}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Completed</span>
                <span className="font-bold">{data.stats.completedGames || 0}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-secondary" />
              Performance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Win Rate</span>
                <span className="font-bold text-accent">{data.stats.accuracy || 0}%</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Total Predictions</span>
                <span className="font-bold">{data.stats.dataPoints || 0}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Correct Predictions</span>
                <span className="font-bold">{data.stats.correctPredictions || 0}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Clock className="h-4 w-4 text-accent" />
              Last Updated
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="text-sm text-muted-foreground">
                {data.lastUpdate ? (
                  <>
                    <div>{data.lastUpdate.toLocaleDateString()}</div>
                    <div className="font-bold">{data.lastUpdate.toLocaleTimeString()}</div>
                  </>
                ) : (
                  'Never'
                )}
              </div>
              <div className="flex items-center gap-2 text-xs">
                <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-accent' : 'bg-destructive'}`} />
                <span>{isConnected ? 'Real-time updates active' : 'Offline'}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Enhanced Teams and Standings Section - Full Width Utilization */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 lg:gap-6">
        <EnhancedErrorBoundary
          onError={(error, errorInfo) => console.error('Teams Widget Error:', error, errorInfo)}
          maxRetries={2}
        >
          <LiveTeamsWidget />
        </EnhancedErrorBoundary>

        <EnhancedErrorBoundary
          onError={(error, errorInfo) => console.error('Standings Widget Error:', error, errorInfo)}
          maxRetries={2}
        >
          <LiveStandingsWidget />
        </EnhancedErrorBoundary>
      </div>
    </div>
  )
}

// Enhanced wrapper with error boundary for the entire dashboard
export function ComprehensiveSportsDashboardWithErrorBoundary() {
  return (
    <EnhancedErrorBoundary
      onError={(error, errorInfo) => {
        console.error('Dashboard Error:', error, errorInfo)
        // In production, send to error monitoring service
      }}
      maxRetries={3}
      showDetails={process.env.NODE_ENV === 'development'}
    >
      <ComprehensiveSportsDashboard />
    </EnhancedErrorBoundary>
  )
}
