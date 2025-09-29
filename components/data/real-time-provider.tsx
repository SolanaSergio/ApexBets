"use client"

import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from "react"
import { subscribeToTable, unsubscribeFromTable } from "@/lib/supabase/realtime"
import { databaseFirstApiClient, type Game, type Prediction, type Odd, type Standing, type Player, type PlayerStats } from "@/lib/api-client-database-first"

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
}

const RealTimeContext = createContext<RealTimeContextType | undefined>(undefined)

export function RealTimeProvider({ children }: { children: ReactNode }) {
  const [selectedSport, setSelectedSport] = useState("basketball") // Default to basketball
  const [data, setData] = useState<RealTimeData>({
    games: [],
    predictions: [],
    odds: [],
    standings: [],
    players: [],
    player_stats: [],
    lastUpdate: null,
    isConnected: false,
    error: null
  })

  const handleUpdate = (payload: any, table: string) => {
    const { eventType, new: newRecord, old: oldRecord } = payload
    setData(currentData => {
      const tableData = currentData[table as keyof RealTimeData] as any[]
      let updatedTableData = tableData

      if (eventType === 'INSERT') {
        updatedTableData = [...tableData, newRecord]
      }
      if (eventType === 'UPDATE') {
        updatedTableData = tableData.map(item => item.id === newRecord.id ? newRecord : item)
      }
      if (eventType === 'DELETE') {
        updatedTableData = tableData.filter(item => item.id !== oldRecord.id)
      }

      return {
        ...currentData,
        [table]: updatedTableData,
        lastUpdate: new Date(),
        isConnected: true
      }
    })
  }

  const fetchData = useCallback(async () => {
    if (!selectedSport) return

    try {
      const [games, predictions, odds, standings, players, player_stats] = await Promise.all([
        databaseFirstApiClient.getGames({ sport: selectedSport, limit: 200 }),
        databaseFirstApiClient.getPredictions({ sport: selectedSport, limit: 100 }),
        databaseFirstApiClient.getOdds({ sport: selectedSport, limit: 500 }),
        databaseFirstApiClient.getStandings({ sport: selectedSport }),
        databaseFirstApiClient.getPlayers({ sport: selectedSport, limit: 1000 }),
        databaseFirstApiClient.getPlayerStats({ sport: selectedSport, limit: 5000 })
      ])

      setData(prev => ({
        ...prev,
        games,
        predictions,
        odds,
        standings,
        players,
        player_stats,
        lastUpdate: new Date(),
        isConnected: true,
        error: null
      }))
    } catch (err) {
      console.error("Failed to fetch initial data:", err)
      setData(prev => ({
        ...prev,
        error: err instanceof Error ? err.message : "Failed to fetch initial data",
        isConnected: false
      }))
    }
  }, [selectedSport])

  useEffect(() => {
    fetchData()

    const gamesSubscription = subscribeToTable('games', (p) => handleUpdate(p, 'games'))
    const predictionsSubscription = subscribeToTable('predictions', (p) => handleUpdate(p, 'predictions'))
    const oddsSubscription = subscribeToTable('odds', (p) => handleUpdate(p, 'odds'))
    const standingsSubscription = subscribeToTable('standings', (p) => handleUpdate(p, 'standings'))
    const playersSubscription = subscribeToTable('players', (p) => handleUpdate(p, 'players'))
    const playerStatsSubscription = subscribeToTable('player_stats', (p) => handleUpdate(p, 'player_stats'))

    return () => {
      unsubscribeFromTable('games')
      unsubscribeFromTable('predictions')
      unsubscribeFromTable('odds')
      unsubscribeFromTable('standings')
      unsubscribeFromTable('players')
      unsubscribeFromTable('player_stats')
    }
  }, [fetchData])

  const refreshData = useCallback(() => {
    fetchData()
  }, [fetchData])

  return (
    <RealTimeContext.Provider value={{ data, refreshData, setSelectedSport, selectedSport }}>
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
  const liveGames = Array.isArray(data.games) ? data.games.filter(game => game.status === 'in_progress') : []

  return {
    games: liveGames.filter(game => !sport || game.sport === targetSport),
    loading: liveGames.length === 0 && !data.error,
    error: data.error,
    lastUpdate: data.lastUpdate,
    isConnected: data.isConnected
  }
}

export function usePredictions(sport?: string) {
  const { data, selectedSport } = useRealTimeData()
  const targetSport = sport || selectedSport
  const predictions = Array.isArray(data.predictions) ? data.predictions : []

  return {
    predictions: predictions.filter(pred => !sport || pred.sport === targetSport),
    loading: predictions.length === 0 && !data.error,
    error: data.error,
    lastUpdate: data.lastUpdate
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
    lastUpdate: data.lastUpdate
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
    lastUpdate: data.lastUpdate
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
    lastUpdate: data.lastUpdate
  }
}

export function usePlayerStats(playerId?: string) {
  const { data } = useRealTimeData()
  const playerStats = Array.isArray(data.player_stats) ? data.player_stats : []

  return {
    stats: playerStats.filter(stat => !playerId || stat.player_id === playerId),
    loading: playerStats.length === 0 && !data.error,
    error: data.error,
    lastUpdate: data.lastUpdate
  }
}

export function useDashboardStats() {
  const { data } = useRealTimeData()
  const games = Array.isArray(data.games) ? data.games : []
  const predictions = Array.isArray(data.predictions) ? data.predictions : []

  const stats = {
    totalGames: games.length,
    accuracy: predictions.length > 0 ? Math.round(predictions.filter(p => p.is_correct).length / predictions.length * 100) : 0,
    teamsTracked: [...new Set(games.map(g => g.home_team_id)), ...new Set(games.map(g => g.away_team_id))].length,
    dataPoints: predictions.length,
    liveGames: games.filter(g => g.status === 'in_progress').length,
    scheduledGames: games.filter(g => g.status === 'scheduled').length,
    completedGames: games.filter(g => g.status === 'completed').length,
    correctPredictions: predictions.filter(p => p.is_correct).length
  }

  return {
    stats,
    loading: games.length === 0 && !data.error,
    error: data.error,
    lastUpdate: data.lastUpdate,
    isConnected: data.isConnected
  }
}