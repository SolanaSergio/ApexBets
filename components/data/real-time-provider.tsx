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

  // Enhanced data fetching with better error handling and caching
  useEffect(() => {
    let liveGamesController: AbortController | null = null
    let predictionsController: AbortController | null = null
    let oddsController: AbortController | null = null
    let lastFetchTime = 0

    const fetchLiveGames = async () => {
      try {
        // Prevent excessive calls - minimum 30 seconds between fetches
        const now = Date.now()
        if (now - lastFetchTime < 30000) {
          return
        }
        lastFetchTime = now

        liveGamesController = new AbortController()
        const response = await fetch(`/api/live-updates?sport=${selectedSport}&real=true`, {
          signal: liveGamesController.signal,
          headers: {
            'Cache-Control': 'max-age=60', // Cache for 60 seconds
          }
        })

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`)
        }

        const result = await response.json()
        const newLiveGames = Array.isArray(result.live) ? result.live : []

        if (result.success) {
          // Only update state if data has actually changed
          setData(prev => {
            const currentGamesStr = JSON.stringify(prev.liveGames)
            const newGamesStr = JSON.stringify(newLiveGames)

            if (currentGamesStr === newGamesStr) {
              return prev // No change, prevent unnecessary re-render
            }

            return {
              ...prev,
              liveGames: newLiveGames,
              stats: {
                ...prev.stats,
                totalGames: newLiveGames.length
              },
              lastUpdate: new Date(),
              error: null,
              isConnected: true
            }
          })
        } else {
          // Handle API errors gracefully - don't throw for empty results
          const errorMessage = result.error || 'Failed to fetch live games'
          console.warn('Live games API returned error:', errorMessage)
          setData(prev => ({
            ...prev,
            liveGames: [],
            stats: {
              ...prev.stats,
              totalGames: 0
            },
            lastUpdate: new Date(),
            error: `Live games: ${errorMessage}`,
            isConnected: false
          }))
        }
      } catch (err) {
        if (err instanceof Error && err.name !== 'AbortError') {
          console.error('Failed to fetch live games:', err)
          setData(prev => ({
            ...prev,
            error: `Live games: ${err.message}`,
            isConnected: false
          }))
        }
      }
    }

    const fetchPredictions = async () => {
      try {
        predictionsController = new AbortController()
        const response = await fetch(`/api/predictions?sport=${selectedSport}&limit=10`, {
          signal: predictionsController.signal,
          headers: {
            'Cache-Control': 'max-age=60', // Cache for 1 minute
          }
        })

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`)
        }

        const result = await response.json()

        setData(prev => ({
          ...prev,
          predictions: Array.isArray(result.predictions) ? result.predictions : [],
          stats: {
            ...prev.stats,
            dataPoints: result.predictions?.length || 0,
            accuracy: result.accuracy || prev.stats.accuracy
          }
        }))
      } catch (err) {
        if (err instanceof Error && err.name !== 'AbortError') {
          console.error('Failed to fetch predictions:', err)
          setData(prev => ({
            ...prev,
            predictions: [],
            error: prev.error ? `${prev.error}; Predictions: ${err.message}` : `Predictions: ${err.message}`
          }))
        }
      }
    }

    const fetchOdds = async () => {
      try {
        oddsController = new AbortController()
        const response = await fetch(`/api/odds?sport=${selectedSport}&external=true`, {
          signal: oddsController.signal,
          headers: {
            'Cache-Control': 'max-age=120', // Cache for 2 minutes
          }
        })

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`)
        }

        const result = await response.json()

        setData(prev => ({
          ...prev,
          odds: Array.isArray(result) ? result : []
        }))
      } catch (err) {
        if (err instanceof Error && err.name !== 'AbortError') {
          console.error('Failed to fetch odds:', err)
          setData(prev => ({
            ...prev,
            odds: [],
            error: prev.error ? `${prev.error}; Odds: ${err.message}` : `Odds: ${err.message}`
          }))
        }
      }
    }

    // Initial data fetch
    const fetchAllData = async () => {
      await Promise.allSettled([
        fetchLiveGames(),
        fetchPredictions(),
        fetchOdds()
      ])
    }

    fetchAllData()

    // Set up intervals with different frequencies for optimal performance
    const liveGamesInterval = setInterval(fetchLiveGames, 30000) // Every 30 seconds for live data
    const predictionsInterval = setInterval(fetchPredictions, 60000) // Every minute for predictions
    const oddsInterval = setInterval(fetchOdds, 45000) // Every 45 seconds for odds

    // Cleanup function
    return () => {
      clearInterval(liveGamesInterval)
      clearInterval(predictionsInterval)
      clearInterval(oddsInterval)

      // Cancel any pending requests
      liveGamesController?.abort()
      predictionsController?.abort()
      oddsController?.abort()
    }
  }, [selectedSport])

  // Enhanced stats fetching with better error handling
  useEffect(() => {
    let statsController: AbortController | null = null

    const fetchStats = async () => {
      try {
        statsController = new AbortController()
        const response = await fetch(`/api/analytics/stats?sport=${selectedSport}`, {
          signal: statsController.signal,
          headers: {
            'Cache-Control': 'max-age=120', // Cache for 2 minutes
          }
        })

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`)
        }

        const result = await response.json()

        setData(prev => ({
          ...prev,
          stats: {
            totalGames: result.data?.total_games || prev.liveGames.length,
            accuracy: Math.round((result.data?.accuracy_rate || 0) * 100),
            teamsTracked: result.data?.total_teams || 0,
            dataPoints: result.data?.total_predictions || prev.predictions.length
          }
        }))
      } catch (err) {
        if (err instanceof Error && err.name !== 'AbortError') {
          console.error('Failed to fetch stats:', err)
          // Don't update error state for stats as it's not critical
        }
      }
    }

    fetchStats()
    const interval = setInterval(fetchStats, 120000) // Refresh every 2 minutes

    return () => {
      clearInterval(interval)
      statsController?.abort()
    }
  }, [selectedSport])

  // Update connection status and real-time data with change detection
  useEffect(() => {
    setData(prev => {
      // Only update if there are actual changes to prevent unnecessary re-renders
      const hasConnectionChange = prev.isConnected !== isConnected
      const hasLastUpdateChange = lastUpdate && (!prev.lastUpdate || lastUpdate.getTime() !== prev.lastUpdate.getTime())
      const hasErrorChange = prev.error !== error
      const hasGameUpdates = gameUpdates.length > 0 && JSON.stringify(gameUpdates) !== JSON.stringify(prev.liveGames)

      if (!hasConnectionChange && !hasLastUpdateChange && !hasErrorChange && !hasGameUpdates) {
        return prev // No changes, prevent re-render
      }

      return {
        ...prev,
        isConnected,
        lastUpdate: lastUpdate || prev.lastUpdate,
        error: error || prev.error,
        liveGames: gameUpdates.length > 0 ? gameUpdates : prev.liveGames
      }
    })
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
        liveGames: Array.isArray(games.live) ? games.live : [],
        predictions: Array.isArray(predictions.predictions) ? predictions.predictions : [],
        odds: Array.isArray(odds) ? odds : [],
        stats: {
          totalGames: stats.data?.total_games || (Array.isArray(games.live) ? games.live.length : 0),
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
