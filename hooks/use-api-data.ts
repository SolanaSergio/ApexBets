"use client"

import { useState, useEffect, useCallback } from 'react'
import { useErrorHandler } from '@/components/error/enhanced-error-boundary'
interface UseApiDataOptions<T> {
  initialData?: T
  enabled?: boolean
  refetchInterval?: number
  onError?: (error: Error) => void
  onSuccess?: (data: T) => void
}

interface UseApiDataReturn<T> {
  data: T | null
  loading: boolean
  error: Error | null
  refetch: () => Promise<void>
  mutate: (newData: T) => void
}

export function useApiData<T>(
  fetchFn: () => Promise<T>,
  options: UseApiDataOptions<T> = {}
): UseApiDataReturn<T> {
  const {
    initialData = null,
    enabled = true,
    refetchInterval,
    onError,
    onSuccess
  } = options

  const [data, setData] = useState<T | null>(initialData)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const errorHandler = useErrorHandler()

  const fetchData = useCallback(async () => {
    if (!enabled) return

    try {
      setLoading(true)
      setError(null)
      const result = await fetchFn()

      // Only update state if data has actually changed
      setData(prevData => {
        const prevDataStr = JSON.stringify(prevData)
        const newDataStr = JSON.stringify(result)

        if (prevDataStr === newDataStr) {
          return prevData // No change, prevent unnecessary re-render
        }

        return result
      })

      onSuccess?.(result)
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error occurred')
      setError(error)
      errorHandler(error)
      onError?.(error)
    } finally {
      setLoading(false)
    }
  }, [fetchFn, enabled, onError, onSuccess, errorHandler])

  const mutate = useCallback((newData: T) => {
    setData(newData)
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  useEffect(() => {
    if (refetchInterval && enabled) {
      const interval = setInterval(fetchData, refetchInterval)
      return () => clearInterval(interval)
    }
    return undefined
  }, [fetchData, refetchInterval, enabled])

  return {
    data,
    loading,
    error,
    refetch: fetchData,
    mutate
  }
}

// Specialized hooks for common data types
export function useGames(sport?: string, options?: UseApiDataOptions<any[]>) {
  return useApiData(
    async () => {
      if (!sport) throw new Error('Sport is required for games data')
      const { simpleApiClient } = await import('@/lib/api-client-simple')
      return simpleApiClient.getGames({ sport, limit: 50 })
    },
    { enabled: !!sport, ...options }
  )
}

export function useTeams(sport?: string, options?: UseApiDataOptions<any[]>) {
  return useApiData(
    async () => {
      const { simpleApiClient } = await import('@/lib/api-client-simple')
      const params: Parameters<typeof simpleApiClient.getTeams>[0] = {}
      if (sport) params.sport = sport
      return simpleApiClient.getTeams(params)
    },
    { enabled: !!sport, ...options }
  )
}

export function usePlayers(sport?: string, options?: UseApiDataOptions<any[]>) {
  return useApiData(
    async () => {
      const { simpleApiClient } = await import('@/lib/api-client-simple')
      const params: Parameters<typeof simpleApiClient.getPlayers>[0] = { limit: 50 }
      if (sport) params.sport = sport
      return simpleApiClient.getPlayers(params)
    },
    { enabled: !!sport, ...options }
  )
}

export function useHealthStatus(options?: UseApiDataOptions<Record<string, boolean>>) {
  return useApiData(
    async () => {
      const { simpleApiClient } = await import('@/lib/api-client-simple')
      return simpleApiClient.getHealthStatus()
    },
    { refetchInterval: 30000, ...options } // Refetch every 30 seconds
  )
}
