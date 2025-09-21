"use client"

import { useEffect, useState, useCallback, useRef } from "react"
import type { Game } from "@/lib/api-client-simple"
import { normalizeGameData, deduplicateGames, normalizeSportData } from "@/lib/utils/data-utils"

interface LiveUpdate {
  type: "connected" | "game_update" | "prediction_update" | "heartbeat" | "error"
  data?: any
  timestamp: string
}

export function useRealTimeUpdates(sport: string = "basketball") {
  const [isConnected, setIsConnected] = useState(false)
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)
  const [gameUpdates, setGameUpdates] = useState<Game[]>([])
  const [error, setError] = useState<string | null>(null)
  const eventSourceRef = useRef<EventSource | null>(null)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const pingIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const retryCountRef = useRef(0)
  const maxRetries = 5
  const lastGameDataRef = useRef<string>("")
  const normalizationCacheRef = useRef<Map<string, any>>(new Map())
  const cacheCleanupTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Clean up cache periodically to prevent memory leaks
  useEffect(() => {
    cacheCleanupTimeoutRef.current = setInterval(() => {
      // Only clear old entries, not the entire cache
      const now = Date.now()
      for (const [key, value] of normalizationCacheRef.current) {
        if (now - value.timestamp > 300000) { // 5 minutes
          normalizationCacheRef.current.delete(key)
        }
      }
    }, 120000) // Check every 2 minutes

    return () => {
      if (cacheCleanupTimeoutRef.current) {
        clearInterval(cacheCleanupTimeoutRef.current)
      }
    }
  }, [])

  const connect = useCallback(() => {
    // Clear any existing reconnect timeout
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
      reconnectTimeoutRef.current = null
    }

    // Clear any existing ping interval
    if (pingIntervalRef.current) {
      clearInterval(pingIntervalRef.current)
      pingIntervalRef.current = null
    }

    // Close existing connection if any
    if (eventSourceRef.current) {
      eventSourceRef.current.close()
    }

    // Connect to the SSE endpoint with sport parameter
    const eventSource = new EventSource(`/api/live-stream?sport=${sport}`)
    eventSourceRef.current = eventSource

    eventSource.onopen = () => {
      setIsConnected(true)
      setError(null)
      retryCountRef.current = 0 // Reset retry count on successful connection
      // Reduced logging frequency to avoid console spam
      if (process.env.NODE_ENV === 'development') {
        console.log(`[Real-time] Connection established for ${sport}`)
      }
      
      // Send periodic pings to keep connection alive
      pingIntervalRef.current = setInterval(() => {
        // This is just for logging, actual keep-alive is handled by the server
        if (process.env.NODE_ENV === 'development') {
          console.log(`[Real-time] Ping sent for ${sport}`)
        }
      }, 45000) // Every 45 seconds
    }

    eventSource.onmessage = (event) => {
      try {
        const update: LiveUpdate = JSON.parse(event.data)
        setLastUpdate(new Date(update.timestamp))

        switch (update.type) {
          case "connected":
            if (process.env.NODE_ENV === 'development') {
              console.log("[Real-time] Connected to live stream")
            }
            break
          case "game_update":
            setGameUpdates((prev) => {
              // Check if data is empty or unchanged
              if (!update.data || update.data.length === 0) {
                return prev
              }

              // Create a cache key for this update
              const cacheKey = `update-${JSON.stringify(update.data)}`
              const cachedResult = normalizationCacheRef.current.get(cacheKey)
              
              if (cachedResult && cachedResult.timestamp) {
                // Check if the cached result is different from current state
                const newGamesStr = JSON.stringify(cachedResult.data)
                if (lastGameDataRef.current !== newGamesStr) {
                  lastGameDataRef.current = newGamesStr
                  if (process.env.NODE_ENV === 'development') {
                    console.log(`[Real-time] Updated ${cachedResult.data.length} games for ${sport} (cached)`)
                  }
                  return cachedResult.data
                }
                return prev
              }

              // Normalize the incoming game data with sport-specific normalization
              const normalizedGames = update.data.map((game: any) => {
                // Create a cache key for individual game normalization
                const gameCacheKey = `game-${JSON.stringify(game)}-${game.sport || sport}`
                const cachedGame = normalizationCacheRef.current.get(gameCacheKey)
                
                if (cachedGame && cachedGame.timestamp) {
                  return cachedGame.data
                }
                
                const normalized = normalizeGameData(game, game.sport || sport)
                const result = normalizeSportData(normalized, game.sport || sport)
                
                // Cache the result with timestamp
                normalizationCacheRef.current.set(gameCacheKey, {
                  data: result,
                  timestamp: Date.now()
                })
                return result
              })
              
              // Deduplicate and return
              const deduplicatedGames = deduplicateGames([...prev, ...normalizedGames]) as Game[]
              
              // Cache the final result with timestamp
              normalizationCacheRef.current.set(cacheKey, {
                data: deduplicatedGames,
                timestamp: Date.now()
              })
              
              // Only update if there are actual changes using efficient comparison
              const newGamesStr = JSON.stringify(deduplicatedGames)
              if (lastGameDataRef.current !== newGamesStr) {
                lastGameDataRef.current = newGamesStr
                if (process.env.NODE_ENV === 'development') {
                  console.log(`[Real-time] Updated ${deduplicatedGames.length} games for ${sport}`)
                }
                return deduplicatedGames
              }
              return prev
            })
            break
          case "prediction_update":
            // Handle prediction updates
            if (process.env.NODE_ENV === 'development') {
              console.log("[Real-time] Prediction update received:", update.data)
            }
            break
          case "heartbeat":
            // Keep connection alive
            if (process.env.NODE_ENV === 'development') {
              console.log("[Real-time] Heartbeat received")
            }
            break
          case "error":
            setError(update.data?.message || "Unknown error")
            console.error("[Real-time] Error received:", update.data)
            break
        }
      } catch (error) {
        console.error("[Real-time] Error parsing update:", error)
        setError("Failed to parse real-time update")
      }
    }

    eventSource.onerror = (error) => {
      setIsConnected(false)
      if (process.env.NODE_ENV === 'development') {
        console.log(`[Real-time] Connection lost for ${sport}`, error)
      }
      
      // Close the connection
      if (eventSourceRef.current) {
        eventSourceRef.current.close()
        eventSourceRef.current = null
      }

      // Clear ping interval
      if (pingIntervalRef.current) {
        clearInterval(pingIntervalRef.current)
        pingIntervalRef.current = null
      }

      // Implement exponential backoff for reconnection
      if (retryCountRef.current < maxRetries) {
        retryCountRef.current += 1
        const delay = Math.min(1000 * 2 ** retryCountRef.current, 30000) // Max 30 seconds
        
        setError(`Connection lost, attempting to reconnect (${retryCountRef.current}/${maxRetries})...`)
        reconnectTimeoutRef.current = setTimeout(() => {
          if (process.env.NODE_ENV === 'development') {
            console.log(`[Real-time] Attempting to reconnect for ${sport}...`)
          }
          connect()
        }, delay)
      } else {
        setError("Failed to reconnect after multiple attempts. Please refresh the page.")
        console.error(`[Real-time] Failed to reconnect for ${sport} after ${maxRetries} attempts`)
      }
    }

    return eventSource
  }, [sport])

  useEffect(() => {
    const eventSource = connect()
    return () => {
      // Cleanup on unmount
      if (eventSource) {
        eventSource.close()
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current)
      }
      if (pingIntervalRef.current) {
        clearInterval(pingIntervalRef.current)
      }
      setIsConnected(false)
    }
  }, [connect])

  // Function to manually trigger a refresh
  const refresh = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close()
    }
    connect()
  }, [connect])

  // Reset retry count and cached data when sport changes
  useEffect(() => {
    retryCountRef.current = 0
    lastGameDataRef.current = ""
    normalizationCacheRef.current.clear()
  }, [sport])

  return {
    isConnected,
    lastUpdate,
    gameUpdates,
    refresh,
    error
  }
}