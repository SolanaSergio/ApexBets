'use client'

import React, { Component, ReactNode } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { AlertTriangle, RefreshCw, Bug, Wifi, Server, Clock, Home } from 'lucide-react'

interface ErrorInfo {
  componentStack: string
  errorBoundary?: string
  errorBoundaryStack?: string
}

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
  errorInfo: ErrorInfo | null
  errorId: string
  retryCount: number
}

interface ErrorBoundaryProps {
  children: ReactNode
  fallback?: ReactNode
  onError?: (error: Error, errorInfo: ErrorInfo) => void
  maxRetries?: number
  showDetails?: boolean
}

export class EnhancedErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  private retryTimeouts: NodeJS.Timeout[] = []

  constructor(props: ErrorBoundaryProps) {
    super(props)

    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: '',
      retryCount: 0,
    }
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return {
      hasError: true,
      error,
      errorId: `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({
      errorInfo,
    })

    // Log error to monitoring service
    this.logError(error, errorInfo)

    // Call custom error handler
    this.props.onError?.(error, errorInfo)
  }

  componentWillUnmount() {
    // Clear any pending retry timeouts
    this.retryTimeouts.forEach(timeout => clearTimeout(timeout))
  }

  private logError = (error: Error, errorInfo: ErrorInfo) => {
    const errorData = {
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      errorId: this.state.errorId,
    }

    // In production, send to error monitoring service
    console.error('Error Boundary caught an error:', errorData)
  }

  private getErrorType = (
    error: Error
  ): {
    type: 'network' | 'api' | 'render' | 'unknown'
    icon: React.ComponentType<any>
    color: string
  } => {
    const message = error.message.toLowerCase()

    if (
      message.includes('fetch') ||
      message.includes('network') ||
      message.includes('connection')
    ) {
      return { type: 'network', icon: Wifi, color: 'text-orange-500' }
    }

    if (message.includes('api') || message.includes('http') || message.includes('server')) {
      return { type: 'api', icon: Server, color: 'text-red-500' }
    }

    if (message.includes('render') || message.includes('component')) {
      return { type: 'render', icon: Bug, color: 'text-purple-500' }
    }

    return { type: 'unknown', icon: AlertTriangle, color: 'text-yellow-500' }
  }

  private handleRetry = () => {
    const { maxRetries = 3 } = this.props

    if (this.state.retryCount >= maxRetries) {
      return
    }

    this.setState(prevState => ({
      retryCount: prevState.retryCount + 1,
    }))

    // Exponential backoff for retries
    const delay = Math.pow(2, this.state.retryCount) * 1000

    const timeout = setTimeout(() => {
      this.setState({
        hasError: false,
        error: null,
        errorInfo: null,
      })
    }, delay)

    this.retryTimeouts.push(timeout)
  }

  private handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: 0,
    })
  }

  private handleGoHome = () => {
    window.location.href = '/'
  }

  render() {
    if (this.state.hasError && this.state.error) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback
      }

      const { type, icon: ErrorIcon, color } = this.getErrorType(this.state.error)
      const { maxRetries = 3, showDetails = false } = this.props
      const canRetry = this.state.retryCount < maxRetries

      return (
        <div className="min-h-[400px] flex items-center justify-center p-4">
          <Card className="w-full max-w-lg">
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                <div className={`p-3 rounded-full bg-muted ${color}`}>
                  <ErrorIcon className="h-8 w-8" />
                </div>
              </div>
              <CardTitle className="text-xl">Something went wrong</CardTitle>
              <div className="flex justify-center gap-2 mt-2">
                <Badge variant="outline" className="text-xs">
                  {type.toUpperCase()} ERROR
                </Badge>
                <Badge variant="outline" className="text-xs">
                  ID: {this.state.errorId.slice(-8)}
                </Badge>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              <div className="text-center text-sm text-muted-foreground">
                {type === 'network' && 'Please check your internet connection and try again.'}
                {type === 'api' &&
                  'Our servers are experiencing issues. Please try again in a moment.'}
                {type === 'render' && 'There was a problem displaying this content.'}
                {type === 'unknown' &&
                  'An unexpected error occurred. Please try refreshing the page.'}
              </div>

              {showDetails && this.state.error && (
                <details className="text-xs">
                  <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
                    Technical Details
                  </summary>
                  <div className="mt-2 p-3 bg-muted rounded-lg font-mono text-xs overflow-auto max-h-32">
                    <div className="font-semibold">Error:</div>
                    <div className="mb-2">{this.state.error.message}</div>
                    {this.state.errorInfo && (
                      <>
                        <div className="font-semibold">Component Stack:</div>
                        <div>{this.state.errorInfo.componentStack}</div>
                      </>
                    )}
                  </div>
                </details>
              )}

              <div className="flex flex-col sm:flex-row gap-2 justify-center">
                {canRetry && (
                  <Button
                    onClick={this.handleRetry}
                    variant="default"
                    size="sm"
                    className="flex items-center gap-2"
                  >
                    <RefreshCw className="h-4 w-4" />
                    Retry ({maxRetries - this.state.retryCount} left)
                  </Button>
                )}

                <Button
                  onClick={this.handleReset}
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-2"
                >
                  <Clock className="h-4 w-4" />
                  Reset
                </Button>

                <Button
                  onClick={this.handleGoHome}
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-2"
                >
                  <Home className="h-4 w-4" />
                  Go Home
                </Button>
              </div>

              {this.state.retryCount > 0 && (
                <div className="text-center text-xs text-muted-foreground">
                  Retry attempt {this.state.retryCount} of {maxRetries}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )
    }

    return this.props.children
  }
}

// Convenience wrapper for common use cases
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<ErrorBoundaryProps, 'children'>
) {
  return function WrappedComponent(props: P) {
    return (
      <EnhancedErrorBoundary {...errorBoundaryProps}>
        <Component {...props} />
      </EnhancedErrorBoundary>
    )
  }
}

// Hook for manual error reporting
export function useErrorHandler() {
  return (error: Error, context?: string) => {
    console.error(`Manual error report${context ? ` (${context})` : ''}:`, error)

    // In production, send to error monitoring service
    const errorData = {
      message: error.message,
      stack: error.stack,
      context,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
    }

    // Could integrate with services like Sentry, LogRocket, etc.
    console.error('Error reported:', errorData)
  }
}
