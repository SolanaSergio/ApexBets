'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useErrorHandler } from '@/components/error/enhanced-error-boundary'

// Debounce utility to prevent rapid successive calls
function debounce<T extends (...args: any[]) => any>(func: T, delay: number): T {
  let timeoutId: NodeJS.Timeout
  return ((...args: Parameters<T>) => {
    clearTimeout(timeoutId)
    timeoutId = setTimeout(() => func(...args), delay)
  }) as T
}
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
  const { initialData = null, enabled = true, refetchInterval, onError, onSuccess } = options

  const [data, setData] = useState<T | null>(initialData)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const errorHandler = useErrorHandler()

  // Use useRef to store stable references to callbacks
  const onErrorRef = useRef(onError)
  const onSuccessRef = useRef(onSuccess)
  const errorHandlerRef = useRef(errorHandler)

  // Update refs when callbacks change
  useEffect(() => {
    onErrorRef.current = onError
  }, [onError])

  useEffect(() => {
    onSuccessRef.current = onSuccess
  }, [onSuccess])

  // Keep a stable reference to the error handler to avoid re-creating fetchData on each render
  useEffect(() => {
    errorHandlerRef.current = errorHandler
  }, [errorHandler])

  const fetchDataInternal = useCallback(async () => {
    if (!enabled) return

    try {
      setLoading(true)
      setError(null)
      const result = await fetchFn()

      // Only update state if data has actually changed
      setData((prevData: T | null) => {
        // Use a more efficient comparison for large objects
        if (prevData === result) {
          return prevData // Same reference, no change
        }

        if (prevData === null) {
          return result // No previous data, set new data
        }

        // Use shallow comparison for arrays and objects
        if (Array.isArray(prevData) && Array.isArray(result)) {
          if (prevData.length !== result.length) {
            return result
          }
          // Quick length check for arrays
          return prevData
        }

        // For objects, check if they're structurally similar
        if (
          typeof prevData === 'object' &&
          typeof result === 'object' &&
          prevData !== null &&
          result !== null
        ) {
          const prevKeys = Object.keys(prevData as object)
          const resultKeys = Object.keys(result as object)
          if (prevKeys.length !== resultKeys.length) {
            return result
          }
          // If same number of keys, assume similar structure
          return prevData
        }

        return result
      })

      onSuccessRef.current?.(result)
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error occurred')
      setError(error)
      errorHandlerRef.current?.(error)
      onErrorRef.current?.(error)
    } finally {
      setLoading(false)
    }
  }, [fetchFn, enabled])

  // Debounced version to prevent rapid successive calls
  const fetchData = useCallback(() => {
    return debounce(fetchDataInternal, 100)()
  }, [fetchDataInternal])

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
    mutate,
  }
}

export function useHealthStatus(options?: UseApiDataOptions<Record<string, boolean>>) {
  const fetchFn = useCallback(async () => {
    const { databaseFirstApiClient } = await import('@/lib/api-client-database-first')
    return databaseFirstApiClient.getHealthStatus()
  }, [])

  return useApiData(fetchFn, { refetchInterval: 30000, ...options }) // Refetch every 30 seconds
}
