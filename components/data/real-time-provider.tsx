'use client'

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
  useCallback,
  useMemo,
  useRef,
} from 'react'
import { subscribeToTable, unsubscribeFromTable } from '@/lib/supabase/realtime'
import { isGameActuallyLive } from '@/lib/utils/data-utils'
import { databaseFirstApiClient } from '@/lib/api-client-database-first'
import type { Game, Prediction, BettingOdds as Odd, LeagueStanding as Standing, Player, PlayerStats } from '@/types/api-responses'


interface RealTimeData {
  games: Game[]
  predictions: Prediction[]
  odds: Odd[]
  standings: Standing[]
  players: Player[]
  player_stats: PlayerStats[]
  lastUpdate: Date | null
  isConnected: boolean
  error: string | null
}

interface RealTimeContextType {
  data: RealTimeData
  refreshData: () => void
  setSelectedSport: (sport: string) => void
  selectedSport: string
  supportedSports: string[]
}

const RealTimeContext = createContext<RealTimeContextType | undefined>(undefined)

interface InitialData {
  games: Game[]
  predictions: Prediction[]
  odds: Odd[]
  standings: Standing[]
  players: Player[]
  sportsData: Record<string, any>
  supportedSports: string[]
}

export function RealTimeProvider({
  children,
  initialData,
  supportedSports = [],
}: {
  children: ReactNode
  initialData?: InitialData
  supportedSports?: string[]
}) {
  const [selectedSport, setSelectedSport] = useState('all')
  const [data, setData] = useState<RealTimeData>({
    games: initialData?.games || [],
    predictions: initialData?.predictions || [],
    odds: initialData?.odds || [],
    standings: initialData?.standings || [],
    players: initialData?.players || [],
    player_stats: [],
    lastUpdate: initialData ? new Date() : null,
    isConnected: false,
    error: null,
  })
  const [isInitialLoad, setIsInitialLoad] = useState(!initialData)

  // Use supportedSports from initialData if available, otherwise fall back to prop
  const effectiveSupportedSports = initialData?.supportedSports || supportedSports

  // Performance optimization: deduplicate updates
  const lastDataHash = useRef<string>('')
  const updateTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const handleUpdate = (payload: any, table: string) => {
    const { eventType, new: newRecord, old: oldRecord } = payload

    // Debounce updates to prevent excessive re-renders
    if (updateTimeoutRef.current) {
      clearTimeout(updateTimeoutRef.current)
    }

    updateTimeoutRef.current = setTimeout(() => {
      setData(currentData => {
        const tableData = currentData[table as keyof RealTimeData] as any[]
        let updatedTableData = tableData

        if (eventType === 'INSERT') {
          updatedTableData = [...tableData, newRecord]
        }
        if (eventType === 'UPDATE') {
          updatedTableData = tableData.map(item => (item.id === newRecord.id ? newRecord : item))
        }
        if (eventType === 'DELETE') {
          updatedTableData = tableData.filter(item => item.id !== oldRecord.id)
        }

        const newData = {
          ...currentData,
          [table]: updatedTableData,
          lastUpdate: new Date(),
          isConnected: true,
        }

        // Check for actual changes to prevent unnecessary updates
        const newDataHash = JSON.stringify(newData)
        if (lastDataHash.current === newDataHash) {
          return currentData
        }

        lastDataHash.current = newDataHash
        return newData
      })
    }, 100) // 100ms debounce
  }

  const fetchData = useCallback(async () => {
    try {
      let games: Game[] = []
      let predictions: Prediction[] = []
      let odds: Odd[] = []
      let standings: Standing[] = []
      let players: Player[] = []

      // Reduced limits for better performance
      const limits = {
        games: 50,
        predictions: 25,
        odds: 100,
        standings: 50,
        players: 200
      }

      if (selectedSport === 'all') {
        // Load only essential data initially, rest will be lazy loaded
        const promises = effectiveSupportedSports.map(async sport => {
          try {
            // Only fetch games and basic data initially
            const [sportGames, sportStandings] = await Promise.all([
              databaseFirstApiClient.getGames({ sport, limit: limits.games }),
              databaseFirstApiClient.getStandings({ sport }),
            ])
            return { sportGames, sportStandings, sportPredictions: [], sportOdds: [], sportPlayers: [] }
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error'
            console.warn(`Failed to fetch data for ${sport}:`, errorMessage)

            return {
              sportGames: [],
              sportPredictions: [],
              sportOdds: [],
              sportStandings: [],
              sportPlayers: [],
            }
          }
        })

        const results = await Promise.all(promises)
        results.forEach(
          ({ sportGames, sportPredictions, sportOdds, sportStandings, sportPlayers }) => {
            games = [...games, ...sportGames]
            predictions = [...predictions, ...sportPredictions]
            odds = [...odds, ...sportOdds]
            standings = [...standings, ...sportStandings]
            players = [...players, ...sportPlayers]
          }
        )
      } else {
        // Fetch data for specific sport with reduced limits
        const [sportGames, sportPredictions, sportOdds, sportStandings, sportPlayers] =
          await Promise.all([
            databaseFirstApiClient.getGames({ sport: selectedSport, limit: limits.games }),
            databaseFirstApiClient.getPredictions({ sport: selectedSport, limit: limits.predictions }),
            databaseFirstApiClient.getOdds({ sport: selectedSport, limit: limits.odds }),
            databaseFirstApiClient.getStandings({ sport: selectedSport }),
            databaseFirstApiClient.getPlayers({ sport: selectedSport, limit: limits.players }),
          ])
        games = sportGames
        predictions = sportPredictions
        odds = sportOdds
        standings = sportStandings
        players = sportPlayers
      }

      setData(prev => ({
        ...prev,
        games,
        predictions,
        odds,
        standings,
        players,
        player_stats: [],
        lastUpdate: new Date(),
        isConnected: true,
        error: null,
      }))
    } catch (err) {
      console.error('Failed to fetch initial data:', err)
      setData(prev => ({
        ...prev,
        error: err instanceof Error ? err.message : 'Failed to fetch initial data',
        isConnected: false,
      }))
    }
  }, [selectedSport, effectiveSupportedSports])



  useEffect(() => {
    // If no initial data, fetch everything client-side
    if (isInitialLoad) {
      fetchData().finally(() => {
        setIsInitialLoad(false)
      })
    }

    subscribeToTable('games', p => handleUpdate(p, 'games'))
    subscribeToTable('predictions', p => handleUpdate(p, 'predictions'))
    subscribeToTable('odds', p => handleUpdate(p, 'odds'))
    subscribeToTable('standings', p => handleUpdate(p, 'standings'))
    subscribeToTable('players', p => handleUpdate(p, 'players'))
    subscribeToTable('player_stats', p => handleUpdate(p, 'player_stats'))

    return () => {
      unsubscribeFromTable('games')
      unsubscribeFromTable('predictions')
      unsubscribeFromTable('odds')
      unsubscribeFromTable('standings')
      unsubscribeFromTable('players')
      unsubscribeFromTable('player_stats')

      // Clean up timeout on unmount
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current)
      }
    }
  }, [fetchData, isInitialLoad])

  const refreshData = useCallback(() => {
    fetchData()
  }, [fetchData])

  return (
    <RealTimeContext.Provider
      value={{ data, refreshData, setSelectedSport, selectedSport, supportedSports: effectiveSupportedSports }}
    >
      {children}
    </RealTimeContext.Provider>
  )
}

export function useRealTimeData() {
  const context = useContext(RealTimeContext)
  if (context === undefined) {
    throw new Error('useRealTimeData must be used within a RealTimeProvider')
  }
  return context
}

export function useLiveGames(sport?: string) {
  const { data, selectedSport } = useRealTimeData()
  const targetSport = sport || selectedSport
  const liveGames = Array.isArray(data.games)
    ? data.games.filter(game => {
        try {
          return isGameActuallyLive(game)
        } catch {
          return false
        }
      })
    : []

  return {
    games: liveGames.filter(game => !sport || game.sport === targetSport),
    loading: liveGames.length === 0 && !data.error,
    error: data.error,
    lastUpdate: data.lastUpdate,
    isConnected: data.isConnected,
  }
}

export function usePredictions(sport?: string) {
  const { data, selectedSport } = useRealTimeData()
  const targetSport = sport || selectedSport
  const predictions = Array.isArray(data.predictions) ? (data.predictions as Prediction[]) : []

  return {
    predictions: predictions.filter(pred => !sport || (pred.sport ?? targetSport) === targetSport),
    loading: predictions.length === 0 && !data.error,
    error: data.error,
    lastUpdate: data.lastUpdate,
  }
}

export function useOdds(sport?: string) {
  const { data, selectedSport } = useRealTimeData()
  const targetSport = sport || selectedSport
  const odds = Array.isArray(data.odds) ? data.odds : []

  return {
    odds: odds.filter(odd => !sport || odd.sport === targetSport),
    loading: odds.length === 0 && !data.error,
    error: data.error,
    lastUpdate: data.lastUpdate,
  }
}

export function useStandings(sport?: string) {
  const { data, selectedSport } = useRealTimeData()
  const targetSport = sport || selectedSport
  const standings = Array.isArray(data.standings) ? data.standings : []

  return {
    standings: standings.filter(standing => !sport || standing.sport === targetSport),
    loading: standings.length === 0 && !data.error,
    error: data.error,
    lastUpdate: data.lastUpdate,
  }
}

export function usePlayers(sport?: string) {
  const { data, selectedSport } = useRealTimeData()
  const targetSport = sport || selectedSport
  const players = Array.isArray(data.players) ? data.players : []

  return {
    players: players.filter(player => !sport || player.sport === targetSport),
    loading: players.length === 0 && !data.error,
    error: data.error,
    lastUpdate: data.lastUpdate,
  }
}

export function usePlayerStats(playerId?: string) {
  const { data } = useRealTimeData()
  const playerStats = Array.isArray(data.player_stats) ? (data.player_stats as PlayerStats[]) : []

  return {
    stats: playerStats.filter(stat => !playerId || String(stat.player_id) === String(playerId)),
    loading: playerStats.length === 0 && !data.error,
    error: data.error,
    lastUpdate: data.lastUpdate,
  }
}

export function useDashboardStats() {
  const { data, selectedSport } = useRealTimeData()

  const stats = useMemo(() => {
    const games = Array.isArray(data.games) ? data.games : []
    const predictions = Array.isArray(data.predictions) ? data.predictions : []

    const filteredGames =
      selectedSport === 'all' ? games : games.filter(game => game.sport === selectedSport)

    const filteredPredictions =
      selectedSport === 'all'
        ? predictions
        : predictions.filter(pred => pred.sport === selectedSport)

    return {
      totalGames: filteredGames.length,
      accuracy:
        filteredPredictions.length > 0
          ? Math.round(
              (filteredPredictions.filter(p => p.is_correct).length / filteredPredictions.length) *
                100
            )
          : 0,
      teamsTracked: [
        ...new Set(filteredGames.map(g => g.home_team_id)),
        ...new Set(filteredGames.map(g => g.away_team_id)),
      ].length,
      dataPoints: filteredPredictions.length,
      liveGames: filteredGames.filter(g => g.status === 'live').length,
      scheduledGames: filteredGames.filter(g => g.status === 'scheduled').length,
      completedGames: filteredGames.filter(g => g.status === 'completed').length,
      correctPredictions: filteredPredictions.filter(p => p.is_correct).length,
    }
  }, [data.games, data.predictions, selectedSport])

  return {
    stats,
    loading: data.games.length === 0 && !data.error,
    error: data.error,
    lastUpdate: data.lastUpdate,
    isConnected: data.isConnected,
  }
}
