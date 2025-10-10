"use client"

import { useState, useEffect, ReactNode } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { AlertCircle, RefreshCw, Loader2 } from "lucide-react"

interface TimeoutLoadingProps {
  children: ReactNode
  loading: boolean
  timeout?: number // milliseconds
  onRetry?: () => void
  errorMessage?: string
  loadingMessage?: string
  timeoutMessage?: string
}

export function TimeoutLoading({
  children,
  loading,
  timeout = 30000, // 30 seconds default
  onRetry,
  errorMessage = "Failed to load data",
  loadingMessage = "Loading...",
  timeoutMessage = "Loading is taking longer than expected"
}: TimeoutLoadingProps) {
  const [hasTimedOut, setHasTimedOut] = useState(false)
  const [showTimeoutWarning, setShowTimeoutWarning] = useState(false)

  useEffect(() => {
    if (!loading) {
      setHasTimedOut(false)
      setShowTimeoutWarning(false)
      return
    }

    // Show timeout warning at 80% of timeout duration
    const warningTimeout = setTimeout(() => {
      setShowTimeoutWarning(true)
    }, timeout * 0.8)

    // Show timeout error at full timeout duration
    const errorTimeout = setTimeout(() => {
      setHasTimedOut(true)
      setShowTimeoutWarning(false)
    }, timeout)

    return () => {
      clearTimeout(warningTimeout)
      clearTimeout(errorTimeout)
    }
  }, [loading, timeout])

  if (hasTimedOut) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <AlertCircle className="h-5 w-5" />
            Loading Timeout
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {errorMessage}. The request took longer than {timeout / 1000} seconds to complete.
            </AlertDescription>
          </Alert>
          {onRetry && (
            <Button 
              onClick={onRetry} 
              variant="outline" 
              className="mt-4"
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Try Again
            </Button>
          )}
        </CardContent>
      </Card>
    )
  }

  if (loading) {
    return (
      <div className="space-y-4">
        {showTimeoutWarning && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {timeoutMessage}. Please wait...
            </AlertDescription>
          </Alert>
        )}
        
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Loader2 className="h-5 w-5 animate-spin" />
              {loadingMessage}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return <>{children}</>
}

interface TimeoutLoadingGridProps {
  loading: boolean
  timeout?: number
  onRetry?: () => void
  count?: number
  variant?: 'default' | 'compact' | 'detailed'
}

export function TimeoutLoadingGrid({
  loading,
  timeout = 30000,
  onRetry,
  count = 6,
  variant = 'default'
}: TimeoutLoadingGridProps) {
  const [hasTimedOut, setHasTimedOut] = useState(false)

  useEffect(() => {
    if (!loading) {
      setHasTimedOut(false)
      return
    }

    const timeoutId = setTimeout(() => {
      setHasTimedOut(true)
    }, timeout)

    return () => clearTimeout(timeoutId)
  }, [loading, timeout])

  if (hasTimedOut) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
        <div className="col-span-full">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-destructive">
                <AlertCircle className="h-5 w-5" />
                Loading Timeout
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Failed to load data. The request took longer than {timeout / 1000} seconds to complete.
                </AlertDescription>
              </Alert>
              {onRetry && (
                <Button 
                  onClick={onRetry} 
                  variant="outline" 
                  className="mt-4"
                  disabled={loading}
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                  Try Again
                </Button>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
        {Array.from({ length: count }).map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className={variant === 'compact' ? 'pb-2' : ''}>
              <div className="flex items-center justify-between">
                <Skeleton className="h-5 w-24" />
                <Skeleton className="h-4 w-4 rounded" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <Skeleton className={`h-${variant === 'compact' ? '3' : '4'} w-full`} />
                <Skeleton className={`h-${variant === 'compact' ? '3' : '4'} w-3/4`} />
                {variant === 'detailed' && (
                  <>
                    <Skeleton className="h-4 w-1/2" />
                    <div className="flex gap-2 mt-3">
                      <Skeleton className="h-6 w-16 rounded-full" />
                      <Skeleton className="h-6 w-20 rounded-full" />
                    </div>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return null
}
