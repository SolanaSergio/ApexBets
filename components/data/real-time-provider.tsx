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

// Request cache to prevent duplicate fetches
const requestCache = new Map<string, { data: any, timestamp: number }>()
const CACHE_TTL = 30000 // 30 seconds

// Track last data sent to avoid unnecessary updates
const lastDataState = new Map<string, string>()

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

  // Enhanced data fetching with caching and better error handling
  useEffect(() => {
    let liveGamesController: AbortController | null = null
    let predictionsController: AbortController | null = null
    let oddsController: AbortController | null = null

    // Cache-aware fetch function
    const fetchWithCache = async (url: string, options: RequestInit = {}) => {
      const cacheKey = `${url}-${JSON.stringify(options)}`
      const now = Date.now()
      
      // Check cache first
      const cached = requestCache.get(cacheKey)
      if (cached && (now - cached.timestamp) < CACHE_TTL) {
        return cached.data
      }
      
      // Prepare fetch options with proper signal handling
      const fetchOptions: RequestInit = {
        ...options
      }
      
      // Only add signal if it's not undefined
      if (options.signal !== undefined) {
        fetchOptions.signal = options.signal
      }
      
      // Fetch fresh data
      const response = await fetch(url, fetchOptions)
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }
      
      const result = await response.json()
      
      // Cache the result
      requestCache.set(cacheKey, {
        data: result,
        timestamp: now
      })
      
      return result
    }

    const fetchLiveGames = async () => {
      try {
        liveGamesController = new AbortController()
        const result = await fetchWithCache(`/api/live-updates?sport=${selectedSport}&real=true`, {
          signal: liveGamesController.signal,
          headers: {
            'Cache-Control': 'max-age=60', // Cache for 60 seconds
          }
        })

        const newLiveGames = Array.isArray(result.live) ? result.live : []

        if (result.success) {
          // Create a string representation to check for changes
          const dataStr = JSON.stringify(newLiveGames)
          const lastDataStr = lastDataState.get('liveGames')
          
          // Only update state if data has actually changed
          if (dataStr !== lastDataStr) {
            lastDataState.set('liveGames', dataStr)
            
            setData(prev => {
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
          }
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
        const result = await fetchWithCache(`/api/predictions?sport=${selectedSport}&limit=10`, {
          signal: predictionsController.signal,
          headers: {
            'Cache-Control': 'max-age=60', // Cache for 1 minute
          }
        })

        // Create a string representation to check for changes
        const dataStr = JSON.stringify(result.predictions)
        const lastDataStr = lastDataState.get('predictions')
        
        // Only update state if data has actually changed
        if (dataStr !== lastDataStr) {
          lastDataState.set('predictions', dataStr)
          
          setData(prev => ({
            ...prev,
            predictions: Array.isArray(result.predictions) ? result.predictions : [],
            stats: {
              ...prev.stats,
              dataPoints: result.predictions?.length || 0,
              accuracy: result.accuracy || prev.stats.accuracy
            }
          }))
        }
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
        const result = await fetchWithCache(`/api/odds?sport=${selectedSport}`, {
          signal: oddsController.signal,
          headers: {
            'Cache-Control': 'max-age=120', // Cache for 2 minutes
          }
        })

        // Create a string representation to check for changes
        const dataStr = JSON.stringify(result)
        const lastDataStr = lastDataState.get('odds')
        
        // Only update state if data has actually changed
        if (dataStr !== lastDataStr) {
          lastDataState.set('odds', dataStr)
          
          setData(prev => ({
            ...prev,
            odds: Array.isArray(result) ? result : []
          }))
        }
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
    // Optimized intervals to balance real-time updates with performance
    const liveGamesInterval = setInterval(fetchLiveGames, 60000) // Every 1 minute for live data
    const predictionsInterval = setInterval(fetchPredictions, 180000) // Every 3 minutes for predictions
    const oddsInterval = setInterval(fetchOdds, 120000) // Every 2 minutes for odds

    // Cleanup function
    return () => {
      clearInterval(liveGamesInterval)
      clearInterval(predictionsInterval)
      clearInterval(oddsInterval)

      // Cancel any pending requests
      liveGamesController?.abort()
      predictionsController?.abort()
      oddsController?.abort()
      
      // Clean up old cache entries
      const now = Date.now()
      for (const [key, cacheEntry] of requestCache) {
        if (now - cacheEntry.timestamp > CACHE_TTL) {
          requestCache.delete(key)
        }
      }
    }
  }, [selectedSport])

  // Enhanced stats fetching with caching
  useEffect(() => {
    let statsController: AbortController | null = null

    // Cache-aware fetch function for stats
    const fetchStatsWithCache = async (url: string) => {
      const cacheKey = `stats-${url}`
      const now = Date.now()
      
      // Check cache first
      const cached = requestCache.get(cacheKey)
      if (cached && (now - cached.timestamp) < CACHE_TTL) {
        return cached.data
      }
      
      // Prepare fetch options with proper signal handling
      const fetchOptions: RequestInit = {
        headers: {
          'Cache-Control': 'max-age=120', // Cache for 2 minutes
        }
      }
      
      // Only add signal if controller exists
      if (statsController) {
        fetchOptions.signal = statsController.signal
      }
      
      // Fetch fresh data
      const response = await fetch(url, fetchOptions)
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }
      
      const result = await response.json()
      
      // Cache the result
      requestCache.set(cacheKey, {
        data: result,
        timestamp: now
      })
      
      return result
    }

    const fetchStats = async () => {
      try {
        statsController = new AbortController()
        const result = await fetchStatsWithCache(`/api/analytics/stats?sport=${selectedSport}`)

        // Create a string representation to check for changes
        const dataStr = JSON.stringify(result.data)
        const lastDataStr = lastDataState.get('stats')
        
        // Only update state if data has actually changed
        if (dataStr !== lastDataStr) {
          lastDataState.set('stats', dataStr)
          
          setData(prev => ({
            ...prev,
            stats: {
              totalGames: result.data?.total_games || prev.liveGames.length,
              accuracy: Math.round((result.data?.accuracy_rate || 0) * 100),
              teamsTracked: result.data?.total_teams || 0,
              dataPoints: result.data?.total_predictions || prev.predictions.length
            }
          }))
        }
      } catch (err) {
        if (err instanceof Error && err.name !== 'AbortError') {
          console.error('Failed to fetch stats:', err)
          // Don't update error state for stats as it's not critical
        }
      }
    }

    fetchStats()
    // Optimized interval for stats updates
    const interval = setInterval(fetchStats, 300000) // Refresh every 5 minutes

    return () => {
      clearInterval(interval)
      statsController?.abort()
    }
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
    // Force refresh all data
    try {
      const [gamesRes, predictionsRes, oddsRes, statsRes] = await Promise.all([
        fetch(`/api/live-updates?sport=${selectedSport}&real=true`),
        fetch(`/api/predictions?sport=${selectedSport}&limit=10`),
        fetch(`/api/odds?sport=${selectedSport}`),
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