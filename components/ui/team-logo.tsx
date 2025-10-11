'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { cn } from '@/lib/utils'
import { imageService } from '@/lib/services/image-service'

interface TeamLogoProps {
  logoUrl?: string | null | undefined
  teamName: string
  abbreviation?: string | undefined
  size?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
  fallbackIcon?: React.ReactNode
  sport?: string
  league?: string
}

const sizeClasses = {
  sm: 'h-6 w-6',
  md: 'h-8 w-8',
  lg: 'h-12 w-12',
  xl: 'h-16 w-16',
}

const sizePixels = {
  sm: 24,
  md: 32,
  lg: 48,
  xl: 64,
}

export function TeamLogo({
  logoUrl,
  teamName,
  abbreviation,
  size = 'md',
  className,
  fallbackIcon,
  sport,
  league,
}: TeamLogoProps) {
  const [imageUrl, setImageUrl] = useState<string>(logoUrl || '')
  const [imageError, setImageError] = useState(false)
  const [imageLoading, setImageLoading] = useState(true)
  const [isFallback, setIsFallback] = useState(false)

  useEffect(() => {
    const loadImage = async () => {
      try {
        setImageLoading(true)
        setImageError(false)

        const startTime = Date.now()

        // If logoUrl is provided, use it directly
        if (logoUrl) {
          setImageUrl(logoUrl)
          setIsFallback(false)

          // Track direct logo usage
          try {
            await fetch('/api/monitor/image-event', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                entityType: 'team',
                entityName: teamName,
                sport,
                source: 'database',
                success: true,
                url: logoUrl,
                loadTime: Date.now() - startTime,
              }),
            })
          } catch (error) {
            console.debug('Failed to track image event:', error)
          }
          return
        }

        // Otherwise, use bulletproof image service
        const result = await imageService.getTeamLogoUrl(teamName, league, sport)
        const loadTime = Date.now() - startTime

        // Validate result structure
        if (!result || typeof result !== 'object' || !result.url) {
          throw new Error('Invalid result from image service')
        }

        setImageUrl(result.url)
        setIsFallback(result.url.startsWith('data:image/svg+xml'))

        // Track image service usage (fire-and-forget)
        fetch('/api/monitor/image-event', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            entityType: 'team',
            entityName: teamName,
            sport,
            source: result.source,
            success: true,
            url: result.url,
            loadTime,
          }),
        }).catch(error => {
          console.debug('Failed to track image event:', error)
        })
      } catch (error) {
        const loadTime = Date.now() - Date.now()
        console.error('Failed to load team logo:', error)
        setImageError(true)
        setIsFallback(true)

        // Track failed image load (fire-and-forget)
        fetch('/api/monitor/image-event', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            entityType: 'team',
            entityName: teamName,
            sport,
            source: 'svg',
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
            loadTime,
          }),
        }).catch(trackError => {
          console.debug('Failed to track image event:', trackError)
        })
      } finally {
        setImageLoading(false)
      }
    }

    loadImage()
  }, [logoUrl, teamName, league, sport])

  const handleImageError = () => {
    setImageError(true)
    setImageLoading(false)
    setIsFallback(true)
  }

  const handleImageLoad = () => {
    setImageLoading(false)
  }

  // Show fallback if error or no image
  if (imageError || !imageUrl) {
    return (
      <div
        className={cn(
          'flex items-center justify-center rounded-full bg-muted text-muted-foreground font-semibold',
          sizeClasses[size],
          className
        )}
        title={teamName}
      >
        {fallbackIcon || (
          <span className="text-xs font-bold">
            {abbreviation?.slice(0, 2).toUpperCase() || teamName.slice(0, 2).toUpperCase()}
          </span>
        )}
      </div>
    )
  }

  const pixelSize = sizePixels[size]

  return (
    <div className={cn('relative', sizeClasses[size], className)}>
      {imageLoading && (
        <div className="absolute inset-0 flex items-center justify-center rounded-full bg-muted animate-pulse">
          <span className="text-xs font-bold text-muted-foreground">
            {abbreviation?.slice(0, 2).toUpperCase() || teamName.slice(0, 2).toUpperCase()}
          </span>
        </div>
      )}
      <Image
        src={imageUrl}
        alt={`${teamName} logo`}
        width={pixelSize}
        height={pixelSize}
        className={cn(
          'rounded-full object-cover transition-opacity duration-200',
          sizeClasses[size],
          imageLoading ? 'opacity-0' : 'opacity-100',
          isFallback && 'opacity-90'
        )}
        onError={handleImageError}
        onLoad={handleImageLoad}
        title={teamName}
        unoptimized={isFallback} // Don't optimize SVG data URIs
      />
    </div>
  )
}
