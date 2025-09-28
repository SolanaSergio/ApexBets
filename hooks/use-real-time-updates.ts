"use client"

import { useEffect, useState, useCallback, useRef } from "react"
import type { Game } from "@/lib/api-client-database-first"
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
  const retryCountRef = useRef(0)
  const maxRetries = 3 // Reduced from 5
  const lastGameDataRef = useRef<string>("")

  const connect = useCallback(() => {
    // Clear any existing reconnect timeout
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
      reconnectTimeoutRef.current = null
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
      retryCountRef.current = 0
      console.log(`[Real-time] Connection established for ${sport}`)
    }

    eventSource.onmessage = (event) => {
      try {
        const update: LiveUpdate = JSON.parse(event.data)
        setLastUpdate(new Date(update.timestamp))

        switch (update.type) {
          case "connected":
            console.log("[Real-time] Connected to live stream")
            break
          case "game_update":
            setGameUpdates((prev) => {
              // Simplified processing - no complex caching
              if (!update.data || update.data.length === 0) {
                return prev
              }

              // Simple normalization without caching
              const normalizedGames = update.data.map((game: any) => {
                const normalized = normalizeGameData(game, game.sport || sport)
                return normalizeSportData(normalized, game.sport || sport)
              })
              
              // Deduplicate and return
              const deduplicatedGames = deduplicateGames([...prev, ...normalizedGames]) as Game[]
              
              // Simple change detection
              const newGamesStr = JSON.stringify(deduplicatedGames)
              if (lastGameDataRef.current !== newGamesStr) {
                lastGameDataRef.current = newGamesStr
                console.log(`[Real-time] Updated ${deduplicatedGames.length} games for ${sport}`)
                return deduplicatedGames
              }
              return prev
            })
            break
          case "prediction_update":
            console.log("[Real-time] Prediction update received:", update.data)
            break
          case "heartbeat":
            // Keep connection alive
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
      console.log(`[Real-time] Connection lost for ${sport}`, error)
      
      // Close the connection
      if (eventSourceRef.current) {
        eventSourceRef.current.close()
        eventSourceRef.current = null
      }

      // Simplified reconnection logic
      if (retryCountRef.current < maxRetries) {
        retryCountRef.current += 1
        const delay = Math.min(2000 * retryCountRef.current, 10000) // Max 10 seconds
        
        setError(`Connection lost, attempting to reconnect (${retryCountRef.current}/${maxRetries})...`)
        reconnectTimeoutRef.current = setTimeout(() => {
          console.log(`[Real-time] Attempting to reconnect for ${sport}...`)
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

  // Reset retry count when sport changes
  useEffect(() => {
    retryCountRef.current = 0
    lastGameDataRef.current = ""
  }, [sport])

  return {
    isConnected,
    lastUpdate,
    gameUpdates,
    refresh,
    error
  }
}