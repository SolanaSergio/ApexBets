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
    liveGames: number
    scheduledGames: number
    completedGames: number
    correctPredictions: number
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

// Request cache to prevent duplicate fetches
const requestCache = new Map<string, { data: any, timestamp: number }>()
const CACHE_TTL = 15000 // 15 seconds - faster updates

// Track last data sent to avoid unnecessary updates
const lastDataState = new Map<string, string>()

interface RealTimeProviderProps {
  children: ReactNode
}

export function RealTimeProvider({ children }: RealTimeProviderProps) {
  const [selectedSport, setSelectedSport] = useState("")
  const [data, setData] = useState<RealTimeData>({
    liveGames: [],
    predictions: [],
    odds: [],
    stats: {
      totalGames: 0,
      accuracy: 0,
      teamsTracked: 0,
      dataPoints: 0,
      liveGames: 0,
      scheduledGames: 0,
      completedGames: 0,
      correctPredictions: 0
    },
    lastUpdate: null,
    isConnected: false,
    error: null
  })

  const { gameUpdates, isConnected, lastUpdate, error } = useRealTimeUpdates(selectedSport)

  // Enhanced data fetching with better error handling
  useEffect(() => {
    if (!selectedSport) {
      setData(prev => ({
        ...prev,
        error: 'No sport selected'
      }))
      return
    }

    const fetchData = async () => {
      try {
        setData(prev => ({ ...prev, error: null }))
        
        // Single optimized API call
        const response = await fetch(`/api/database-first/games?sport=${selectedSport}&status=live&limit=50`)
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`)
        }
        
        const result = await response.json()
        
        if (result.success && Array.isArray(result.data)) {
          setData(prev => ({
            ...prev,
            liveGames: result.data,
            lastUpdate: new Date(),
            error: null,
            isConnected: true
          }))
        } else {
          setData(prev => ({
            ...prev,
            liveGames: [],
            error: 'No data available',
            lastUpdate: new Date()
          }))
        }
      } catch (err) {
        console.error('Failed to fetch data:', err)
        setData(prev => ({
          ...prev,
          error: err instanceof Error ? err.message : 'Failed to fetch data',
          isConnected: false
        }))
      }
    }

    fetchData()
    const interval = setInterval(fetchData, 15000) // 15 second intervals
    return () => clearInterval(interval)
  }, [selectedSport])

  // Enhanced stats fetching with caching
  useEffect(() => {
    if (!selectedSport) {
      setData(prev => ({
        ...prev,
        error: 'No sport selected'
      }))
      return
    }

    const fetchData = async () => {
      try {
        setData(prev => ({ ...prev, error: null }))
        
        // Single optimized API call
        const response = await fetch(`/api/database-first/games?sport=${selectedSport}&status=live&limit=50`)
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`)
        }
        
        const result = await response.json()
        
        if (result.success && Array.isArray(result.data)) {
          setData(prev => ({
            ...prev,
            liveGames: result.data,
            lastUpdate: new Date(),
            error: null,
            isConnected: true
          }))
        } else {
          setData(prev => ({
            ...prev,
            liveGames: [],
            error: 'No data available',
            lastUpdate: new Date()
          }))
        }
      } catch (err) {
        console.error('Failed to fetch data:', err)
        setData(prev => ({
          ...prev,
          error: err instanceof Error ? err.message : 'Failed to fetch data',
          isConnected: false
        }))
      }
    }

    fetchData()
    const interval = setInterval(fetchData, 15000) // 15 second intervals
    return () => clearInterval(interval)
  }, [selectedSport])

  // Update connection status and real-time data with change detection
  useEffect(() => {
    // Create a string representation to check for changes
    const connectionData = JSON.stringify({ isConnected, lastUpdate, error, gameUpdates })
    const lastConnectionData = lastDataState.get('connection')
    
    // Only update state if data has actually changed
    if (connectionData !== lastConnectionData) {
      lastDataState.set('connection', connectionData)
      
      setData(prev => {
        return {
          ...prev,
          isConnected,
          lastUpdate: lastUpdate || prev.lastUpdate,
          error: error || prev.error,
          liveGames: gameUpdates.length > 0 ? gameUpdates : prev.liveGames
        }
      })
    }
  }, [gameUpdates, isConnected, lastUpdate, error])

  const refreshData = async () => {
    if (!selectedSport) return // Don't refresh if no sport selected
    
    // Force refresh all data using database-first endpoints
    try {
      const [gamesRes, predictionsRes, oddsRes, statsRes] = await Promise.all([
        fetch(`/api/database-first/games?sport=${selectedSport}&status=live&forceRefresh=true`),
        fetch(`/api/database-first/predictions?sport=${selectedSport}&limit=10&forceRefresh=true`),
        fetch(`/api/database-first/odds?sport=${selectedSport}&forceRefresh=true`),
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
        liveGames: Array.isArray(games.data) ? games.data : [],
        predictions: Array.isArray(predictions.data) ? predictions.data : (Array.isArray(predictions.predictions) ? predictions.predictions : []),
        odds: Array.isArray(odds.data) ? odds.data : (Array.isArray(odds) ? odds : []),
        stats: {
          totalGames: stats.data?.total_games || (Array.isArray(games.data) ? games.data.length : 0),
          accuracy: Math.round((stats.data?.accuracy_rate || 0) * 100),
          teamsTracked: stats.data?.total_teams || 0,
          dataPoints: stats.data?.total_predictions || 0,
          liveGames: stats.data?.live_games || 0,
          scheduledGames: stats.data?.scheduled_games || 0,
          completedGames: stats.data?.completed_games || 0,
          correctPredictions: stats.data?.correct_predictions || 0
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

  // Ensure liveGames is always an array
  const liveGames = Array.isArray(data.liveGames) ? data.liveGames : []

  return {
    games: liveGames.filter(game => !sport || game.sport === targetSport),
    loading: liveGames.length === 0 && !data.error,
    error: data.error,
    lastUpdate: data.lastUpdate,
    isConnected: data.isConnected
  }
}

// Hook for predictions with error handling
export function usePredictions(sport?: string) {
  const { data, selectedSport } = useRealTimeData()
  const targetSport = sport || selectedSport

  // Ensure predictions is always an array
  const predictions = Array.isArray(data.predictions) ? data.predictions : []

  return {
    predictions: predictions.filter(pred => !sport || pred.sport === targetSport),
    loading: predictions.length === 0 && !data.error,
    error: data.error,
    lastUpdate: data.lastUpdate
  }
}

// Hook for odds with error handling
export function useOdds(sport?: string) {
  const { data, selectedSport } = useRealTimeData()
  const targetSport = sport || selectedSport

  // Ensure odds is always an array
  const odds = Array.isArray(data.odds) ? data.odds : []

  return {
    odds: odds.filter(odd => !sport || odd.sport === targetSport),
    loading: odds.length === 0 && !data.error,
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