"use client"

import { useState, useEffect, useCallback, useRef } from 'react'
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

  // Use useRef to store stable references to callbacks
  const onErrorRef = useRef(onError)
  const onSuccessRef = useRef(onSuccess)
  
  // Update refs when callbacks change
  useEffect(() => {
    onErrorRef.current = onError
  }, [onError])
  
  useEffect(() => {
    onSuccessRef.current = onSuccess
  }, [onSuccess])

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

      onSuccessRef.current?.(result)
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error occurred')
      setError(error)
      errorHandler(error)
      onErrorRef.current?.(error)
    } finally {
      setLoading(false)
    }
  }, [fetchFn, enabled, errorHandler])

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
  const fetchFn = useCallback(async () => {
    if (!sport) throw new Error('Sport is required for games data')
    const { databaseFirstApiClient } = await import('@/lib/api-client-database-first')
    return databaseFirstApiClient.getGames({ sport, limit: 50 })
  }, [sport])

  return useApiData(fetchFn, { enabled: !!sport, ...options })
}

export function useTeams(sport?: string, options?: UseApiDataOptions<any[]>) {
  const fetchFn = useCallback(async () => {
    const { databaseFirstApiClient } = await import('@/lib/api-client-database-first')
    const params: { sport?: string; league?: string } = {}
    if (sport) params.sport = sport
    return databaseFirstApiClient.getTeams(params)
  }, [sport])

  return useApiData(fetchFn, { enabled: !!sport, ...options })
}

export function usePlayers(sport?: string, options?: UseApiDataOptions<any[]>) {
  const fetchFn = useCallback(async () => {
    const { databaseFirstApiClient } = await import('@/lib/api-client-database-first')
    const params: { sport?: string; limit?: number; search?: string } = { limit: 50 }
    if (sport) params.sport = sport
    return databaseFirstApiClient.getPlayers(params)
  }, [sport])

  return useApiData(fetchFn, { enabled: !!sport, ...options })
}

export function useHealthStatus(options?: UseApiDataOptions<Record<string, boolean>>) {
  const fetchFn = useCallback(async () => {
    const { databaseFirstApiClient } = await import('@/lib/api-client-database-first')
    return databaseFirstApiClient.getHealthStatus()
  }, [])

  return useApiData(fetchFn, { refetchInterval: 30000, ...options }) // Refetch every 30 seconds
}
