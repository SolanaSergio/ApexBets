"use client"

import { createContext, useContext, useEffect, useState, ReactNode } from "react"
import { useRealTimeUpdates } from "@/hooks/use-real-time-updates"

interface RealTimeData {
  liveGames: any[]
  predictions: any[]
  odds: any[]
  stats: {
    totalGames: number
    accuracy: number
    teamsTracked: number
    dataPoints: number
  }
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

interface RealTimeProviderProps {
  children: ReactNode
}

export function RealTimeProvider({ children }: RealTimeProviderProps) {
  const [selectedSport, setSelectedSport] = useState("all")
  const [data, setData] = useState<RealTimeData>({
    liveGames: [],
    predictions: [],
    odds: [],
    stats: {
      totalGames: 0,
      accuracy: 0,
      teamsTracked: 0,
      dataPoints: 0
    },
    lastUpdate: null,
    isConnected: false,
    error: null
  })

  const { gameUpdates, isConnected, lastUpdate, error } = useRealTimeUpdates(selectedSport)

  // Fetch live games data
  useEffect(() => {
    const fetchLiveGames = async () => {
      try {
        const response = await fetch(`/api/live-updates?sport=${selectedSport}&real=true`)
        const result = await response.json()
        
        if (result.success) {
          setData(prev => ({
            ...prev,
            liveGames: result.live || [],
            lastUpdate: new Date(),
            error: null
          }))
        }
      } catch (err) {
        console.error('Failed to fetch live games:', err)
        setData(prev => ({
          ...prev,
          error: 'Failed to fetch live games'
        }))
      }
    }

    fetchLiveGames()
    const interval = setInterval(fetchLiveGames, 30000) // Refresh every 30 seconds
    return () => clearInterval(interval)
  }, [selectedSport])

  // Fetch predictions data
  useEffect(() => {
    const fetchPredictions = async () => {
      try {
        const response = await fetch(`/api/predictions?sport=${selectedSport}&limit=10`)
        const result = await response.json()
        
        setData(prev => ({
          ...prev,
          predictions: result.predictions || []
        }))
      } catch (err) {
        console.error('Failed to fetch predictions:', err)
      }
    }

    fetchPredictions()
    const interval = setInterval(fetchPredictions, 60000) // Refresh every minute
    return () => clearInterval(interval)
  }, [selectedSport])

  // Fetch odds data
  useEffect(() => {
    const fetchOdds = async () => {
      try {
        const response = await fetch(`/api/odds?sport=${selectedSport}&external=true`)
        const result = await response.json()
        
        setData(prev => ({
          ...prev,
          odds: result || []
        }))
      } catch (err) {
        console.error('Failed to fetch odds:', err)
      }
    }

    fetchOdds()
    const interval = setInterval(fetchOdds, 45000) // Refresh every 45 seconds
    return () => clearInterval(interval)
  }, [selectedSport])

  // Fetch stats data
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch(`/api/analytics/stats?sport=${selectedSport}`)
        const result = await response.json()
        
        setData(prev => ({
          ...prev,
          stats: {
            totalGames: result.data?.total_games || prev.liveGames.length,
            accuracy: Math.round((result.data?.accuracy_rate || 0) * 100),
            teamsTracked: result.data?.total_teams || 0,
            dataPoints: result.data?.total_predictions || 0
          }
        }))
      } catch (err) {
        console.error('Failed to fetch stats:', err)
      }
    }

    fetchStats()
    const interval = setInterval(fetchStats, 120000) // Refresh every 2 minutes
    return () => clearInterval(interval)
  }, [selectedSport])

  // Update connection status and real-time data
  useEffect(() => {
    setData(prev => ({
      ...prev,
      isConnected,
      lastUpdate: lastUpdate || prev.lastUpdate,
      error: error || prev.error,
      liveGames: gameUpdates.length > 0 ? gameUpdates : prev.liveGames
    }))
  }, [gameUpdates, isConnected, lastUpdate, error])

  const refreshData = async () => {
    // Force refresh all data
    try {
      const [gamesRes, predictionsRes, oddsRes, statsRes] = await Promise.all([
        fetch(`/api/live-updates?sport=${selectedSport}&real=true`),
        fetch(`/api/predictions?sport=${selectedSport}&limit=10`),
        fetch(`/api/odds?sport=${selectedSport}&external=true`),
        fetch(`/api/analytics/stats?sport=${selectedSport}`)
      ])

      const [games, predictions, odds, stats] = await Promise.all([
        gamesRes.json(),
        predictionsRes.json(),
        oddsRes.json(),
        statsRes.json()
      ])

      setData(prev => ({
        ...prev,
        liveGames: games.live || [],
        predictions: predictions.predictions || [],
        odds: odds || [],
        stats: {
          totalGames: stats.data?.total_games || games.live?.length || 0,
          accuracy: Math.round((stats.data?.accuracy_rate || 0) * 100),
          teamsTracked: stats.data?.total_teams || 0,
          dataPoints: stats.data?.total_predictions || 0
        },
        lastUpdate: new Date(),
        error: null
      }))
    } catch (err) {
      console.error('Failed to refresh data:', err)
      setData(prev => ({
        ...prev,
        error: 'Failed to refresh data'
      }))
    }
  }

  return (
    <RealTimeContext.Provider value={{
      data,
      refreshData,
      setSelectedSport,
      selectedSport
    }}>
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

// Hook for live games with error handling
export function useLiveGames(sport?: string) {
  const { data, selectedSport } = useRealTimeData()
  const targetSport = sport || selectedSport
  
  return {
    games: data.liveGames.filter(game => !sport || game.sport === targetSport),
    loading: data.liveGames.length === 0 && !data.error,
    error: data.error,
    lastUpdate: data.lastUpdate,
    isConnected: data.isConnected
  }
}

// Hook for predictions with error handling
export function usePredictions(sport?: string) {
  const { data, selectedSport } = useRealTimeData()
  const targetSport = sport || selectedSport
  
  return {
    predictions: data.predictions.filter(pred => !sport || pred.sport === targetSport),
    loading: data.predictions.length === 0 && !data.error,
    error: data.error,
    lastUpdate: data.lastUpdate
  }
}

// Hook for odds with error handling
export function useOdds(sport?: string) {
  const { data, selectedSport } = useRealTimeData()
  const targetSport = sport || selectedSport
  
  return {
    odds: data.odds.filter(odd => !sport || odd.sport === targetSport),
    loading: data.odds.length === 0 && !data.error,
    error: data.error,
    lastUpdate: data.lastUpdate
  }
}

// Hook for dashboard stats
export function useDashboardStats() {
  const { data } = useRealTimeData()
  
  return {
    stats: data.stats,
    loading: data.stats.totalGames === 0 && !data.error,
    error: data.error,
    lastUpdate: data.lastUpdate,
    isConnected: data.isConnected
  }
}
