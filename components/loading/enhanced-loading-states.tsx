"use client"

import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { 
  Activity, 
  Users, 
  Trophy, 
  Target,
  BarChart3,
  Zap,
  Loader2
} from "lucide-react"

interface LoadingProps {
  count?: number
  variant?: 'default' | 'compact' | 'detailed'
  animated?: boolean
}

export function EnhancedLoadingCard({ variant = 'default', animated = true }: Omit<LoadingProps, 'count'>) {
  return (
    <Card className={`${animated ? 'animate-pulse' : ''} relative overflow-hidden`}>
      {animated && (
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer" />
      )}
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
  )
}

export function EnhancedLoadingGrid({ count = 6, variant = 'default' }: LoadingProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <EnhancedLoadingCard key={i} variant={variant} />
      ))}
    </div>
  )
}

export function EnhancedLoadingStats({ count = 4, variant = 'default' }: LoadingProps) {
  const icons = [Activity, Users, Trophy, Target]
  
  return (
    <div className={`grid gap-3 lg:gap-4 ${
      variant === 'compact' ? 'grid-cols-2 lg:grid-cols-6' : 'grid-cols-2 lg:grid-cols-4'
    }`}>
      {Array.from({ length: count }).map((_, i) => {
        const Icon = icons[i % icons.length]
        return (
          <Card key={i} className="animate-pulse relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-primary/10" />
            <CardContent className={variant === 'compact' ? 'p-3' : 'p-4 lg:p-6'}>
              <div className="flex items-center justify-between mb-2">
                <Skeleton className={variant === 'compact' ? 'h-3 w-12' : 'h-4 w-16'} />
                <Icon className={`text-muted-foreground/50 ${variant === 'compact' ? 'h-3 w-3' : 'h-4 w-4'}`} />
              </div>
              <Skeleton className={variant === 'compact' ? 'h-6 w-8 mb-1' : 'h-8 w-12 mb-1'} />
              <Skeleton className={variant === 'compact' ? 'h-2 w-16' : 'h-3 w-20'} />
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}

export function EnhancedLoadingTable({ rows = 8, variant = 'default' }: LoadingProps & { rows?: number }) {
  const isCompact = variant === 'compact'
  const headerHeight = isCompact ? 'h-3' : 'h-4'
  const rowHeight = isCompact ? 'h-4' : 'h-6'
  const padding = isCompact ? 'p-2' : 'p-3'
  
  return (
    <div className={isCompact ? 'space-y-1' : 'space-y-2'}>
      {/* Header */}
      <div className={`flex items-center gap-3 ${padding} border-b bg-muted/20`}>
        <Skeleton className={`${headerHeight} w-8`} />
        <Skeleton className={`${headerHeight} w-8`} />
        <Skeleton className={`${headerHeight} w-32`} />
        <div className="grid grid-cols-3 lg:grid-cols-4 gap-2 flex-1">
          <Skeleton className={`${headerHeight} w-8`} />
          <Skeleton className={`${headerHeight} w-8`} />
          <Skeleton className={`${headerHeight} w-12 hidden lg:block`} />
          <Skeleton className={`${headerHeight} w-12`} />
        </div>
        <Skeleton className={`${headerHeight} w-12`} />
      </div>
      
      {/* Rows */}
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className={`flex items-center gap-3 ${padding} hover:bg-muted/20 animate-pulse`}>
          <Skeleton className={`${rowHeight} w-6 rounded-full`} />
          <Skeleton className={`${rowHeight} w-6 rounded`} />
          <Skeleton className={`${headerHeight} w-32`} />
          <div className="grid grid-cols-3 lg:grid-cols-4 gap-2 flex-1">
            <Skeleton className={`${headerHeight} w-8`} />
            <Skeleton className={`${headerHeight} w-8`} />
            <Skeleton className={`${headerHeight} w-12 hidden lg:block`} />
            <Skeleton className={`${headerHeight} w-12`} />
          </div>
          <Skeleton className={`${headerHeight} w-12`} />
        </div>
      ))}
    </div>
  )
}

export function LoadingTeamsWidget() {
  return (
    <Card className="h-fit">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-muted-foreground/50" />
            <Skeleton className="h-5 w-24" />
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-8 w-20" />
            <Skeleton className="h-8 w-24" />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="p-3 border rounded-lg animate-pulse">
              <div className="flex items-center gap-3">
                <Skeleton className="h-6 w-6 rounded-full" />
                <Skeleton className="h-6 w-6 rounded" />
                <div className="flex-1">
                  <Skeleton className="h-4 w-24 mb-1" />
                  <Skeleton className="h-3 w-16" />
                </div>
                <Skeleton className="h-4 w-8" />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

export function LoadingStandingsWidget() {
  return (
    <Card className="h-fit">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-muted-foreground/50" />
            <Skeleton className="h-5 w-32" />
          </div>
          <Skeleton className="h-8 w-20" />
        </div>
      </CardHeader>
      <CardContent>
        <EnhancedLoadingTable rows={10} variant="compact" />
      </CardContent>
    </Card>
  )
}

export function LoadingDashboard() {
  return (
    <div className="space-y-4 lg:space-y-6">
      {/* Header */}
      <div className="bg-card/50 backdrop-blur-sm rounded-lg border p-4 lg:p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex gap-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-24" />
            ))}
          </div>
          <div className="flex items-center gap-3">
            <Skeleton className="h-8 w-32" />
            <Skeleton className="h-8 w-20" />
          </div>
        </div>
      </div>

      {/* Stats */}
      <EnhancedLoadingStats count={4} />

      {/* Main Content */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 lg:gap-6">
        <LoadingTeamsWidget />
        <LoadingStandingsWidget />
      </div>
    </div>
  )
}

// Enhanced spinner with sport-specific animations
export function SportLoadingSpinner({ 
  sport = 'all', 
  size = 'default',
  message = 'Loading...'
}: { 
  sport?: string
  size?: 'sm' | 'default' | 'lg'
  message?: string 
}) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    default: 'h-6 w-6',
    lg: 'h-8 w-8'
  }

  const getSportIcon = () => {
    switch (sport) {
      case 'basketball': return Zap
      case 'football': return Activity
      case 'soccer': return Target
      case 'hockey': return BarChart3
      default: return Loader2
    }
  }

  const Icon = getSportIcon()

  return (
    <div className="flex flex-col items-center gap-3 p-6">
      <div className="relative">
        <Icon className={`animate-spin text-primary ${sizeClasses[size]}`} />
        <div className="absolute inset-0 rounded-full border-2 border-primary/20 animate-pulse" />
      </div>
      <p className="text-sm text-muted-foreground font-medium">{message}</p>
      <div className="w-24 bg-muted rounded-full h-1">
        <div className="bg-gradient-to-r from-primary to-accent h-1 rounded-full animate-pulse" />
      </div>
    </div>
  )
}

// Shimmer effect for enhanced loading
export function ShimmerEffect({ className = "" }: { className?: string }) {
  return (
    <div className={`animate-shimmer bg-gradient-to-r from-transparent via-white/20 to-transparent ${className}`} />
  )
}

// Loading overlay with sport context
export function SportLoadingOverlay({ 
  sport = 'all',
  message = 'Loading sports data...',
  progress = 0
}: { 
  sport?: string
  message?: string
  progress?: number
}) {
  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in">
      <Card className="w-full max-w-sm">
        <CardContent className="p-6">
          <SportLoadingSpinner sport={sport} size="lg" message={message} />
          {progress > 0 && (
            <div className="mt-4">
              <div className="flex justify-between text-xs text-muted-foreground mb-1">
                <span>Progress</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div 
                  className="bg-gradient-to-r from-primary to-accent h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
