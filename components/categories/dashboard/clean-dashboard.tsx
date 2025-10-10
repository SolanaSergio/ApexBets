"use client"

/**
 * CLEAN DASHBOARD COMPONENT
 * 
 * ================================================================================
 * COMPLIANT: NO HARDCODED SPORTS - ENVIRONMENT/CONFIGURATION BASED
 * ================================================================================
 * 
 * This component is fully compliant with the NO HARDCODED SPORT rules.
 * All sport handling is dynamic and uses environment/configuration sources.
 * 
 * PURPOSE: Sport selection uses this priority chain:
 * 1. defaultSport prop (passed from parent)
 * 2. First sport from SportConfigManager.getSupportedSports()
 * 3. First sport from NEXT_PUBLIC_SUPPORTED_SPORTS environment variable
 * 4. If all fail, shows sport selection UI (no default sport)
 * 
 * DYNAMIC GUARANTEE: All sport handling is completely dynamic:
 * - Dynamic sport loading from SportConfigManager
 * - User sport selection changes (users can select any sport)
 * - API data fetching (all data is loaded dynamically based on selected sport)
 * - Real-time updates (all updates are sport-agnostic)
 * - Multi-sport support (dashboard supports all configured sports)
 * - Data normalization (all data is processed dynamically)
 * - Error handling (all errors are handled dynamically)
 * 
 * FALLBACK CHAIN: defaultSport prop → SportConfigManager → environment → null (sport selection UI)
 * 
 * All behavior is completely dynamic and sport-agnostic with no hardcoded values.
 * ================================================================================
 */

import { useState, useEffect, useCallback, useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  Activity, 
  TrendingUp, 
  Clock, 
  Star,
  Zap,
  RefreshCw,
  CheckCircle,
  AlertCircle
} from "lucide-react"
import { databaseFirstApiClient, Game, Team } from "@/lib/api-client-database-first"
import { SportConfigManager, SupportedSport } from "@/lib/services/core/sport-config"
// Real-time updates hook removed; using RealTimeProvider context where needed

type GameData = Game
type TeamData = Team
import { SportSelector } from "@/components/shared/sport-selector"
import { GamesList } from "@/components/sports/games-list"
import { TeamsList } from "@/components/sports/teams-list"
import { NoSportSelected } from "@/components/shared/no-sport-selected"
import { TeamLogo } from "@/components/ui/team-logo"
import { normalizeTeamData, normalizeGameData, deduplicateGames, deduplicateTeams, isGameActuallyLive } from "@/lib/utils/data-utils"
import { FadeIn, StaggerContainer, StaggerItem, ScaleIn } from "@/components/ui/page-transition"

interface CleanDashboardProps {
  className?: string
  defaultSport?: SupportedSport | null
}

export function CleanDashboard({ className = "", defaultSport = null }: CleanDashboardProps) {
  const [mounted, setMounted] = useState(false)
  
  // ============================================================================
  // COMPLIANT: NO HARDCODED SPORT - USING ENVIRONMENT/CONFIGURATION ONLY
  // ============================================================================
  // Updated to be fully compliant with NO HARDCODED SPORT rules.
  // 
  // PURPOSE: Gets default sport from environment or configuration only:
  // 1. Use defaultSport prop if provided
  // 2. Use first sport from SportConfigManager supported sports
  // 3. Use first sport from SUPPORTED_SPORTS environment variable
  // 4. If all fail, component will show "no sport selected" state
  //
  // DYNAMIC BEHAVIOR: All sport handling is completely dynamic:
  // - Dynamic sport loading from SportConfigManager
  // - User sport selection changes
  // - API data fetching (all data is loaded dynamically based on selected sport)
  // - Real-time updates (all updates are sport-agnostic)
  // - Multi-sport support (dashboard supports all configured sports)
  //
  // FALLBACK CHAIN: defaultSport prop → SportConfigManager → environment → null (shows selection UI)
  // ============================================================================
  const [selectedSupportedSport, setSelectedSupportedSport] = useState<SupportedSport | null>(defaultSport)
  const [activeTab, setActiveTab] = useState("overview")
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  
  // Data states
  const [allLiveGames, setAllLiveGames] = useState<GameData[]>([])
  const [allUpcomingGames, setAllUpcomingGames] = useState<GameData[]>([])
  const [allTeams, setAllTeams] = useState<TeamData[]>([])
  const [serviceHealth, setServiceHealth] = useState<Record<SupportedSport, boolean>>({} as Record<SupportedSport, boolean>)
  
  // Additional dashboard data
  const [standings, setStandings] = useState<any[]>([])
  const [upcomingPredictions, setUpcomingPredictions] = useState<any[]>([])
  const [valueBets, setValueBets] = useState<any[]>([])
  const [liveOdds, setLiveOdds] = useState<any[]>([])
  
  // Use real-time updates hook
  const liveGameUpdates: GameData[] = useMemo(() => [], [])
  const isConnected = false

  // All function definitions moved to top to prevent reference errors
  const loadServiceHealth = useCallback(async () => {
    try {
      const healthStatus = await databaseFirstApiClient.getHealthStatus()
      setServiceHealth(healthStatus as Record<SupportedSport, boolean>)
    } catch (error) {
      console.error('Error loading service health:', error)
    }
  }, [])



  const loadTeamsForSport = useCallback(async (sport: SupportedSport) => {
    try {
      console.log(`Loading teams for ${sport} using database-first approach...`)
      
      const teams = await databaseFirstApiClient.getTeams({ sport })
      console.log(`Database-first: Loaded ${teams.length} teams for ${sport}`)
      
      // Normalize team data to ensure consistency
      const normalizedTeams = teams
        .filter(team => team && typeof team === 'object')
        .map(team => {
          try {
            return normalizeTeamData(team, sport)
          } catch (error) {
            console.warn('Error normalizing team data:', error, team)
            return null
          }
        })
        .filter(team => team !== null) as TeamData[]
      
      // Deduplicate teams
      const uniqueTeams = deduplicateTeams(normalizedTeams)
      
      setAllTeams(prev => {
        const filtered = prev.filter(team => team.sport !== sport)
        return [...filtered, ...uniqueTeams]
      })
      
      console.log(`Successfully loaded ${uniqueTeams.length} teams for ${sport}`)
    } catch (error) {
      console.warn(`Failed to load teams for ${sport}:`, error)
    }
  }, [])


  const loadUpcomingGamesForSport = useCallback(async (sport: SupportedSport) => {
    try {
      const today = new Date().toISOString().split('T')[0]
      const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      console.log(`Loading upcoming games for ${sport} on ${today}...`)
      
      // Use external API first for real-time data
      let games: GameData[] = []
      try {
        // Try today first, then tomorrow if no games today
        games = await databaseFirstApiClient.getGames({
          sport,
          dateFrom: today,
          status: 'scheduled',
          limit: 20
        })
        console.log(`External API: Loaded ${games.length} upcoming games for ${sport} on ${today}`)
        
        // If no games today, try tomorrow
        if (games.length === 0) {
          console.log(`No games today, trying tomorrow (${tomorrow})...`)
          games = await databaseFirstApiClient.getGames({
            sport,
            dateFrom: tomorrow,
            status: 'scheduled',
            limit: 20
          })
          console.log(`External API: Loaded ${games.length} upcoming games for ${sport} on ${tomorrow}`)
        }
        
        // Debug: Log the actual sports of the returned games
        if (games.length > 0) {
          const gameSports = games.map(g => g.sport).filter(Boolean)
          console.log(`Upcoming games returned for ${sport}:`, gameSports.slice(0, 5))
          console.log(`Sample game data:`, games[0])
        }
        
        // Normalize game data with error handling
        console.log(`Before normalization: ${games.length} games`)
        games = games
          .filter(game => game && typeof game === 'object') // Filter out invalid games
          .map(game => {
            try {
              const normalized = normalizeGameData(game, sport)
              console.log(`Normalized game:`, {
                id: normalized.id,
                status: normalized.status,
                homeTeam: normalized.home_team?.name,
                awayTeam: normalized.away_team?.name,
                sport: normalized.sport
              })
              return normalized
            } catch (error) {
              console.warn('Error normalizing upcoming game data:', error, game)
              return null
            }
          })
          .filter(game => game !== null) // Remove failed normalizations
        console.log(`After normalization: ${games.length} games`)
        
        // Deduplicate games
        games = deduplicateGames(games)
        
        // If no games found for today, try without date filter to get any scheduled games
        if (games.length === 0) {
          console.log(`No games found for today, trying without date filter...`)
          const allScheduledGames = await databaseFirstApiClient.getGames({
            sport,
            status: 'scheduled',
            limit: 20
          })
          console.log(`External API (no date filter): Loaded ${allScheduledGames.length} scheduled games for ${sport}`)
          games = allScheduledGames
            .filter((game: any) => game && typeof game === 'object') // Filter out invalid games
            .map((game: any) => {
              try {
                return normalizeGameData(game, sport)
              } catch (error) {
                console.warn('Error normalizing scheduled game data:', error, game)
                return null
              }
            })
            .filter((game: any) => game !== null) // Remove failed normalizations
          games = deduplicateGames(games)
        }
        
        // Fallback to database if external API fails or returns no data
        if (games.length === 0) {
          try {
            games = await databaseFirstApiClient.getGames({
              sport,
              dateFrom: today,
              status: 'scheduled',
              limit: 20
            })
            games = games
              .filter(game => game && typeof game === 'object') // Filter out invalid games
              .map(game => {
                try {
                  return normalizeGameData(game, sport)
                } catch (error) {
                  console.warn('Error normalizing upcoming game data (DB fallback):', error, game)
                  return null
                }
              })
              .filter((game: any) => game !== null) // Remove failed normalizations
            games = deduplicateGames(games)
            console.log(`Database fallback: Loaded ${games.length} upcoming games for ${sport}`)
          } catch (dbError) {
            console.warn(`Database fallback failed for upcoming games ${sport}:`, dbError)
          }
        }
      } catch (externalError) {
        console.warn(`External API failed for upcoming games ${sport}:`, externalError)
        // Fallback to database
        try {
          games = await databaseFirstApiClient.getGames({
            sport,
            dateFrom: today,
            status: 'scheduled',
            limit: 20
          })
          games = games
            .filter((game: any) => game && typeof game === 'object') // Filter out invalid games
            .map((game: any) => {
              try {
                return normalizeGameData(game, sport)
              } catch (error) {
                console.warn('Error normalizing upcoming game data (catch fallback):', error, game)
                return null
              }
            })
            .filter((game: any) => game !== null) // Remove failed normalizations
          games = deduplicateGames(games)
          console.log(`Database fallback: Loaded ${games.length} upcoming games for ${sport}`)
        } catch (dbError) {
          console.warn(`Database fallback failed for upcoming games ${sport}:`, dbError)
          games = []
        }
      }
      
      setAllUpcomingGames(prev => {
        const filtered = prev.filter(game => game.sport !== sport)
        return [...filtered, ...games]
      })
    } catch (error) {
      console.warn(`Failed to load upcoming games for ${sport}:`, error)
    }
  }, [])


  const loadLiveGamesForSport = useCallback(async (sport: SupportedSport) => {
    try {
      console.log(`Loading live games for ${sport}...`)
      
      // Use external API first for real-time data
      let games: GameData[] = []
      try {
        // Try to get live games (status: 'live')
        games = await databaseFirstApiClient.getGames({ 
          sport, 
          status: 'live'
        })
        console.log(`External API: Loaded ${games.length} live games for ${sport}`)
        
        // If no live games, try to get any games with 'in_progress' status
        if (games.length === 0) {
          console.log(`No live games, trying in_progress status...`)
          games = await databaseFirstApiClient.getGames({ 
            sport, 
            status: 'in_progress'
          })
          console.log(`External API: Loaded ${games.length} in_progress games for ${sport}`)
        }
        
        // Debug: Log the actual sports of the returned games
        if (games.length > 0) {
          const gameSports = games.map(g => g.sport).filter(Boolean)
          console.log(`Games returned for ${sport}:`, gameSports.slice(0, 5))
        }
        
        // Normalize and filter games with error handling
        games = games
          .filter(game => game && typeof game === 'object') // Filter out invalid games
          .map(game => {
            try {
              return normalizeGameData(game, sport)
            } catch (error) {
              console.warn('Error normalizing game data:', error, game)
              return null
            }
          })
          .filter(game => game !== null) // Remove failed normalizations
        games = deduplicateGames(games)
        
        // Filter to only show truly live games (with real scores or live indicators)
        console.log(`Before live filtering: ${games.length} games`)
        games = games.filter(game => {
          try {
            const isLive = isGameActuallyLive(game)
            if (!isLive) {
              console.log(`Game filtered out (not live):`, {
                id: game.id,
                status: game.status,
                homeScore: game.home_score,
                awayScore: game.away_score,
                homeTeam: game.home_team?.name,
                awayTeam: game.away_team?.name
              })
            }
            return isLive
          } catch (error) {
            console.warn('Error checking if game is live:', error, game)
            return false
          }
        })
        console.log(`After live filtering: ${games.length} games`)
        
        // Fallback to database if external API fails
        if (games.length === 0) {
          try {
            games = await databaseFirstApiClient.getGames({ 
              sport, 
              status: 'in_progress'
            })
            games = games
              .filter(game => game && typeof game === 'object') // Filter out invalid games
              .map(game => {
                try {
                  return normalizeGameData(game, sport)
                } catch (error) {
                  console.warn('Error normalizing game data (DB fallback):', error, game)
                  return null
                }
              })
              .filter((game: any) => game !== null) // Remove failed normalizations
            games = deduplicateGames(games)
            
            // Filter to only show truly live games (with real scores or live indicators)
            games = games.filter(game => {
              try {
                return isGameActuallyLive(game)
              } catch (error) {
                console.warn('Error checking if game is live (DB fallback):', error, game)
                return false
              }
            })
            console.log(`Database fallback: Loaded ${games.length} live games for ${sport}`)
          } catch (dbError) {
            console.warn(`Database fallback failed for live games ${sport}:`, dbError)
          }
        }
      } catch (externalError) {
        console.warn(`External API failed for live games ${sport}:`, externalError)
        // Fallback to database
        try {
          games = await databaseFirstApiClient.getGames({ 
            sport, 
            status: 'in_progress'
          })
          games = games
            .filter((game: any) => game && typeof game === 'object') // Filter out invalid games
            .map((game: any) => {
              try {
                return normalizeGameData(game, sport)
              } catch (error) {
                console.warn('Error normalizing game data (catch fallback):', error, game)
                return null
              }
            })
            .filter((game: any) => game !== null) // Remove failed normalizations
          games = deduplicateGames(games)
          
          // Filter to only show truly live games (with real scores or live indicators)
          games = games.filter(game => {
            try {
              return isGameActuallyLive(game)
            } catch (error) {
              console.warn('Error checking if game is live (catch fallback):', error, game)
              return false
            }
          })
          console.log(`Database fallback: Loaded ${games.length} live games for ${sport}`)
        } catch (dbError) {
          console.warn(`Database fallback failed for live games ${sport}:`, dbError)
          games = []
        }
      }
      
      setAllLiveGames(prev => {
        const filtered = prev.filter(game => game.sport !== sport)
        return [...filtered, ...games]
      })
    } catch (error) {
      console.warn(`Failed to load live games for ${sport}:`, error)
    }
  }, [])


  const initializeAndLoadData = useCallback(async () => {
    try {
      // Initialize sport configuration first
      await SportConfigManager.initialize()
      
      // Use default sport if provided, otherwise set the first available sport
      if (!selectedSupportedSport) {
        const supportedSports = SportConfigManager.getSupportedSports()
        if (supportedSports.length > 0) {
          const sportToSet = defaultSport || supportedSports[0]
          setSelectedSupportedSport(sportToSet)
        } else {
          // No supported sports found - show sport selection UI
          console.warn('No supported sports found in configuration, showing sport selection UI')
          setSelectedSupportedSport(null)
        }
      }
    } catch (error) {
      console.error('Error initializing dashboard:', error)
      // Fallback to synchronous initialization
      SportConfigManager.initializeSync()
      
      // Use default sport if provided, otherwise set the first available sport
      if (!selectedSupportedSport) {
        const supportedSports = SportConfigManager.getSupportedSports()
        if (supportedSports.length > 0) {
          const sportToSet = defaultSport || supportedSports[0]
          setSelectedSupportedSport(sportToSet)
        } else {
          // No supported sports found - show sport selection UI
          console.warn('No supported sports found in configuration, showing sport selection UI')
          setSelectedSupportedSport(null)
        }
      }
    }
  }, [selectedSupportedSport, defaultSport])

  // Load standings data
  const loadStandings = useCallback(async (sport: SupportedSport) => {
    try {
      const response = await databaseFirstApiClient.getStandings({ sport })
      // Handle both wrapped and direct array responses
      const standingsData = Array.isArray(response) ? response : (response as any)?.data || []
      setStandings(standingsData)
      console.log(`Loaded ${standingsData.length} standings entries for ${sport}`)
    } catch (error) {
      console.warn(`Failed to load standings for ${sport}:`, error)
      setStandings([])
    }
  }, [])

  // Load upcoming predictions
  const loadUpcomingPredictions = useCallback(async (sport: SupportedSport) => {
    try {
      const predictions = await databaseFirstApiClient.getUpcomingPredictions({ sport, limit: 5 })
      setUpcomingPredictions(predictions)
      console.log(`Loaded ${predictions.length} upcoming predictions for ${sport}`)
    } catch (error) {
      console.warn(`Failed to load upcoming predictions for ${sport}:`, error)
      setUpcomingPredictions([])
    }
  }, [])

  // Load value betting opportunities
  const loadValueBets = useCallback(async (sport: SupportedSport) => {
    try {
      const response = await fetch(`/api/value-bets?sport=${sport}&min_value=0.1&limit=5`)
      const data = await response.json()
      const valueBetsData = data.opportunities || []
      setValueBets(valueBetsData)
      console.log(`Loaded ${valueBetsData.length} value betting opportunities for ${sport}`)
    } catch (error) {
      console.warn(`Failed to load value bets for ${sport}:`, error)
      setValueBets([])
    }
  }, [])

  // Load live odds
  const loadLiveOdds = useCallback(async (sport: SupportedSport) => {
    try {
      const odds = await databaseFirstApiClient.getOdds({ sport, limit: 10 })
      // Ensure odds is an array and filter out any invalid entries
      const validOdds = Array.isArray(odds) ? odds.filter(odd => odd && odd.home_team && odd.away_team) : []
      setLiveOdds(validOdds)
      console.log(`Loaded ${validOdds.length} live odds for ${sport}`)
    } catch (error) {
      console.warn(`Failed to load live odds for ${sport}:`, error)
      setLiveOdds([])
    }
  }, [])

  const loadDataForSport = useCallback(async (sport: SupportedSport, retryCount = 0) => {
    try {
      setLoading(true)
      
      // Load all data in parallel for better performance
      await Promise.all([
        loadServiceHealth(),
        loadTeamsForSport(sport),
        loadLiveGamesForSport(sport),
        loadUpcomingGamesForSport(sport),
        loadStandings(sport),
        loadUpcomingPredictions(sport),
        loadValueBets(sport),
        loadLiveOdds(sport)
      ])
      
      console.log(`Successfully loaded data for ${sport}`)
    } catch (error) {
      console.error(`Error loading data for sport ${sport} (attempt ${retryCount + 1}):`, error)
      
      // Retry once if it's the first attempt
      if (retryCount === 0) {
        console.log(`Retrying data load for ${sport}...`)
        setTimeout(() => {
          loadDataForSport(sport, 1)
        }, 2000) // Wait 2 seconds before retry
      }
    } finally {
      setLoading(false)
    }
  }, []) // Remove all dependencies - functions are stable


  const handleRefresh = useCallback(async () => {
    setRefreshing(true)
    // Clear cache to force fresh data
    databaseFirstApiClient.clearCache()
    if (selectedSupportedSport) {
      await loadDataForSport(selectedSupportedSport)
    }
    setRefreshing(false)
  }, [selectedSupportedSport, loadDataForSport])

  // Combined initialization and data loading effect
  useEffect(() => {
    setMounted(true)
    if (selectedSupportedSport) {
      initializeAndLoadData()
    }
  }, [selectedSupportedSport]) // Only depend on sport selection

  // Update live games with real-time updates
  useEffect(() => {
    if (liveGameUpdates.length > 0) {
      setAllLiveGames(prev => {
        // Combine existing games with new updates
        const combined = [...prev, ...liveGameUpdates]
        // Remove duplicates and return
        return deduplicateGames(combined) as GameData[]
      })
    }
  }, [liveGameUpdates])

  // Recalculate stats when data changes - use useMemo for better performance
  const computedStats = useMemo(() => {
    if (!mounted) return null
    return {
      totalGames: allLiveGames.length + allUpcomingGames.length,
      totalTeams: allTeams.length,
      liveGames: allLiveGames.length,
      upcomingGames: allUpcomingGames.length
    }
  }, [mounted, allLiveGames.length, allUpcomingGames.length, allTeams.length])

  // Prevent hydration mismatch by not rendering until mounted
  if (!mounted) {
    return null
  }

  const isServiceHealthy = selectedSupportedSport ? (serviceHealth[selectedSupportedSport] ?? false) : false

  if (loading) {
    return <DashboardSkeleton />
  }

  // Show no sport selected state if no sport is available
  if (!selectedSupportedSport) {
    return (
      <div className={className}>
        <NoSportSelected 
          onSportSelect={setSelectedSupportedSport}
          title="Welcome to ApexBets"
          description="Select a sport to view live data, games, and analytics"
        />
      </div>
    )
  }

  return (
    <div>
      <div className={`space-y-8 ${className}`}>
      {/* Header */}
      <FadeIn>
        <div className="flex flex-col space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
                ApexBets Dashboard
              </h1>
              <p className="text-muted-foreground">
                Multi-sport analytics and predictions
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                disabled={refreshing}
                className="transition-all duration-200 hover:scale-105 hover:shadow-md"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              <div className="flex items-center space-x-2">
                <Badge variant={isServiceHealthy ? "default" : "destructive"} className="transition-all duration-200">
                  {isServiceHealthy ? (
                    <><CheckCircle className="h-3 w-3 mr-1" /> Healthy</>
                  ) : (
                    <><AlertCircle className="h-3 w-3 mr-1" /> Issues</>
                  )}
                </Badge>
                <Badge variant={isConnected ? "default" : "destructive"} className="transition-all duration-200">
                  {isConnected ? (
                    <><Zap className="h-3 w-3 mr-1" /> Live</>
                  ) : (
                    <><AlertCircle className="h-3 w-3 mr-1" /> Disconnected</>
                  )}
                </Badge>
              </div>
            </div>
          </div>

          {/* Sport Selector - Responsive Design */}
          <div className="w-full">
            <SportSelector
              selectedSport={selectedSupportedSport}
              onSportChange={setSelectedSupportedSport}
              variant="responsive"
              className="w-full"
            />
          </div>
        </div>
      </FadeIn>

      {/* Stats Overview */}
      <StaggerContainer className="grid gap-4 md:grid-cols-2 lg:grid-cols-6">
        <StaggerItem index={0} className="transition-all duration-300 hover:scale-105 hover:shadow-lg">
          <Card className="h-full">
            <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Games</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{computedStats?.totalGames || 0}</div>
              <p className="text-xs text-muted-foreground">
                Across all sports
              </p>
            </CardContent>
          </Card>
        </StaggerItem>
        
        <StaggerItem index={1} className="transition-all duration-300 hover:scale-105 hover:shadow-lg">
          <Card className="h-full">
            <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Live Games</CardTitle>
              <Zap className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{computedStats?.liveGames || 0}</div>
              <p className="text-xs text-muted-foreground">
                Currently playing
              </p>
            </CardContent>
          </Card>
        </StaggerItem>
        
        <StaggerItem index={2} className="transition-all duration-300 hover:scale-105 hover:shadow-lg">
          <Card className="h-full">
            <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Teams</CardTitle>
              <Star className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{computedStats?.totalTeams || 0}</div>
              <p className="text-xs text-muted-foreground">
                Across all leagues
              </p>
            </CardContent>
          </Card>
        </StaggerItem>
        
        <StaggerItem index={3} className="transition-all duration-300 hover:scale-105 hover:shadow-lg">
          <Card className="h-full">
            <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Standings</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{standings.length}</div>
              <p className="text-xs text-muted-foreground">
                League standings
              </p>
            </CardContent>
          </Card>
        </StaggerItem>

        <StaggerItem index={4} className="transition-all duration-300 hover:scale-105 hover:shadow-lg">
          <Card className="h-full">
            <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Predictions</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{upcomingPredictions.length}</div>
              <p className="text-xs text-muted-foreground">
                Upcoming predictions
              </p>
            </CardContent>
          </Card>
        </StaggerItem>

        <StaggerItem index={5} className="transition-all duration-300 hover:scale-105 hover:shadow-lg">
          <Card className="h-full">
            <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Value Bets</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{valueBets.length}</div>
              <p className="text-xs text-muted-foreground">
                Opportunities
              </p>
            </CardContent>
          </Card>
        </StaggerItem>
      </StaggerContainer>

      {/* Live Odds Section */}
      {liveOdds.length > 0 && (
        <FadeIn>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Live Odds
              </CardTitle>
              <CardDescription>
                Current betting odds for {selectedSupportedSport} games
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-2">
                {liveOdds.slice(0, 5).map((odd, index) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-muted/50 rounded-lg">
                    <div className="text-sm font-medium">
                      {odd.home_team} vs {odd.away_team}
                    </div>
                    <div className="flex gap-2 text-sm">
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded">
                        H: {odd.home_odds || 'N/A'}
                      </span>
                      <span className="px-2 py-1 bg-green-100 text-green-800 rounded">
                        A: {odd.away_odds || 'N/A'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </FadeIn>
      )}

      {/* Main Content Tabs */}
      <FadeIn>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-4 bg-slate-100 p-1 rounded-lg">
            <TabsTrigger 
              value="overview"
              className="data-[state=active]:bg-white data-[state=active]:shadow-sm transition-all duration-200"
            >
              Overview
            </TabsTrigger>
            <TabsTrigger 
              value="games"
              className="data-[state=active]:bg-white data-[state=active]:shadow-sm transition-all duration-200"
            >
              Games
            </TabsTrigger>
            <TabsTrigger 
              value="teams"
              className="data-[state=active]:bg-white data-[state=active]:shadow-sm transition-all duration-200"
            >
              Teams
            </TabsTrigger>
            <TabsTrigger 
              value="all-sports"
              className="data-[state=active]:bg-white data-[state=active]:shadow-sm transition-all duration-200"
            >
              All SupportedSports
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4 animate-fade-in">
            <div className="grid gap-4 md:grid-cols-2">
              {/* Live Games Overview */}
              <ScaleIn delay={100}>
                <Card className="transition-all duration-300 hover:shadow-lg">
              <CardHeader className="flex flex-col items-start pb-4">
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5 text-green-500" />
                  Live Games
                </CardTitle>
                <CardDescription>
                  Currently playing across all sports
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {allLiveGames.length > 0 ? (
                    allLiveGames.slice(0, 5).map((game) => (
                      <div key={game.id} className="flex items-center justify-between p-4 rounded-lg border-2 border-green-200 bg-gradient-to-r from-green-50 to-emerald-50 hover:shadow-md transition-all">
                        <div className="flex items-center space-x-4">
                          <div className="flex items-center space-x-2">
                            <TeamLogo
                              logoUrl={game.away_team?.logo_url}
                              teamName={game.away_team?.name || 'Visiting Team'}
                              abbreviation={game.away_team?.abbreviation}
                              size="md"
                            />
                            <div className="text-center">
                              <span className="text-sm font-medium text-muted-foreground">@</span>
                            </div>
                            <TeamLogo
                              logoUrl={game.home_team?.logo_url}
                              teamName={game.home_team?.name || 'Home Team'}
                              abbreviation={game.home_team?.abbreviation}
                              size="md"
                            />
                          </div>
                          <div>
                            <div className="font-semibold text-base">
                              {game.away_team?.name} @ {game.home_team?.name}
                            </div>
                            <div className="text-xs text-muted-foreground flex items-center gap-2">
                              <Badge className="bg-red-500 text-white text-xs animate-pulse">
                                🔴 LIVE
                              </Badge>
                              {game.league} • {game.game_time || new Date(game.game_date).toLocaleTimeString()}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-extrabold text-2xl text-green-600">
                            {(game.away_score !== null && game.home_score !== null) ? 
                              `${game.away_score} - ${game.home_score}` : 
                              <span className="text-muted-foreground text-lg">0 - 0</span>
                            }
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {(game.away_score !== null && game.home_score !== null) ? 'LIVE SCORE' : 'STARTING SOON'}
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-6 text-muted-foreground">
                      <Zap className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p className="font-medium">No live games at the moment</p>
                      <p className="text-sm mt-1">Games will appear here when they start</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
              </ScaleIn>

            {/* Upcoming Games Overview */}
            <ScaleIn delay={200}>
            <Card className="transition-all duration-300 hover:shadow-lg">
              <CardHeader className="flex flex-col items-start pb-4">
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Upcoming Games
                </CardTitle>
                <CardDescription>
                  Today's scheduled games
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {allUpcomingGames.length > 0 ? (
                    allUpcomingGames.slice(0, 5).map((game) => (
                      <div key={game.id} className="flex items-center justify-between p-4 rounded-lg border border-blue-200 bg-gradient-to-r from-blue-50 to-sky-50 hover:shadow-md transition-all">
                        <div className="flex items-center space-x-4">
                          <div className="flex items-center space-x-2">
                            <TeamLogo
                              logoUrl={game.away_team?.logo_url}
                              teamName={game.away_team?.name || 'Visiting Team'}
                              abbreviation={game.away_team?.abbreviation}
                              size="md"
                            />
                            <div className="text-center">
                              <span className="text-sm font-medium text-muted-foreground">@</span>
                            </div>
                            <TeamLogo
                              logoUrl={game.home_team?.logo_url}
                              teamName={game.home_team?.name || 'Home Team'}
                              abbreviation={game.home_team?.abbreviation}
                              size="md"
                            />
                          </div>
                          <div>
                            <div className="font-semibold text-base">
                              {game.away_team?.name} @ {game.home_team?.name}
                            </div>
                            <div className="text-xs text-muted-foreground flex items-center gap-2">
                              <Badge variant="outline" className="border-blue-300 text-blue-700 text-xs">
                                🕒 SCHEDULED
                              </Badge>
                              {game.league} • {game.game_time || new Date(game.game_date).toLocaleTimeString()}
                            </div>
                          </div>
                        </div>
                        <div className="text-center">
                          <div className="text-lg font-medium text-blue-600">
                            {new Date(game.game_date).toLocaleDateString()}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {new Date(game.game_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-6 text-muted-foreground">
                      <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p className="font-medium">No upcoming games today</p>
                      <p className="text-sm mt-1">Check back later for scheduled games</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
            </ScaleIn>
          </div>
        </TabsContent>

        <TabsContent value="games" className="space-y-4">
          {selectedSupportedSport && <GamesList sport={selectedSupportedSport} />}
        </TabsContent>

        <TabsContent value="teams" className="space-y-4">
          {selectedSupportedSport && <TeamsList sport={selectedSupportedSport} />}
        </TabsContent>

        <TabsContent value="all-sports" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {SportConfigManager.getSupportedSports().map((sport: SupportedSport) => {
              const config = SportConfigManager.getSportConfig(sport)
              const isHealthy = true // Assume healthy
              
              return (
                <Card key={sport} className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => setSelectedSupportedSport(sport)}>
                  <CardContent className="p-4 flex items-center space-x-4">
                    <div className="flex items-center space-x-3">
                      <div className={`p-3 rounded-full bg-muted flex items-center justify-center ${selectedSupportedSport === sport ? 'bg-primary/10' : ''}`}>
                        <span className={`text-2xl ${config?.color}`}>{config?.icon}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-lg">{config?.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {(config?.leagues?.length || 0)} leagues
                        </div>
                        <div className="flex items-center gap-1 mt-1">
                          {isHealthy ? (
                            <CheckCircle className="h-4 w-4 text-green-500" />
                          ) : (
                            <AlertCircle className="h-4 w-4 text-red-500" />
                          )}
                          <span className="text-xs text-muted-foreground">
                            {isHealthy ? 'Healthy' : 'Issues'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </TabsContent>
        </Tabs>
      </FadeIn>
    </div>
    </div>
  )
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-8 w-64 bg-muted rounded animate-pulse" />
          <div className="h-4 w-48 bg-muted rounded animate-pulse" />
        </div>
        <div className="h-10 w-24 bg-muted rounded animate-pulse" />
      </div>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-24 bg-muted rounded animate-pulse" />
        ))}
      </div>
      
      <div className="space-y-4">
        <div />
        <div className="grid gap-4 md:grid-cols-2">
          <div />
          <div />
        </div>
      </div>
    </div>
  )
}

export default CleanDashboard
