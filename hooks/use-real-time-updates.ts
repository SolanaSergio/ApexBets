"use client"

import { useEffect, useState, useCallback } from "react"
import type { Game } from "@/lib/api-client"

interface LiveUpdate {
  type: "connected" | "game_update" | "prediction_update" | "heartbeat"
  data?: any
  timestamp: string
}

export function useRealTimeUpdates() {
  const [isConnected, setIsConnected] = useState(false)
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)
  const [gameUpdates, setGameUpdates] = useState<Game[]>([])

  const connect = useCallback(() => {
    const eventSource = new EventSource("/api/live-updates")

    eventSource.onopen = () => {
      setIsConnected(true)
      console.log("[v0] Real-time connection established")
    }

    eventSource.onmessage = (event) => {
      try {
        const update: LiveUpdate = JSON.parse(event.data)
        setLastUpdate(new Date(update.timestamp))

        switch (update.type) {
          case "game_update":
            setGameUpdates((prev) => {
              const existingIndex = prev.findIndex((game) => game.id === update.data.id)
              if (existingIndex >= 0) {
                const updated = [...prev]
                updated[existingIndex] = update.data
                return updated
              }
              return [...prev, update.data]
            })
            break
          case "prediction_update":
            // Handle prediction updates
            console.log("[v0] Prediction update received:", update.data)
            break
          case "heartbeat":
            // Keep connection alive
            break
        }
      } catch (error) {
        console.error("[v0] Error parsing live update:", error)
      }
    }

    eventSource.onerror = () => {
      setIsConnected(false)
      console.log("[v0] Real-time connection lost, attempting to reconnect...")
      eventSource.close()

      // Reconnect after 5 seconds
      setTimeout(connect, 5000)
    }

    return eventSource
  }, [])

  useEffect(() => {
    const eventSource = connect()
    return () => {
      eventSource.close()
      setIsConnected(false)
    }
  }, [connect])

  return {
    isConnected,
    lastUpdate,
    gameUpdates,
  }
}
