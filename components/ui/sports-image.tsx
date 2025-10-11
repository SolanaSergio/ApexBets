'use client'

import React, { useState, useCallback, useEffect } from 'react'
import Image from 'next/image'
import { cn } from '@/lib/utils'
import {
  imageService,
  getSportsImageUrl,
  getFallbackImageUrl,
  IMAGE_SOURCES,
  type SportsLeague,
  type TeamLogoConfig,
  type PlayerPhotoConfig,
} from '@/lib/services/image-service'

interface SportsImageProps {
  src?: string
  alt: string
  width?: number
  height?: number
  className?: string
  fallbackType?: 'team' | 'player' | 'sports'
  onError?: () => void
  priority?: boolean
  quality?: number
  type?: 'team' | 'player' | 'sports'
  league?: string | undefined
  teamName?: string
}

interface TeamLogoProps extends Omit<SportsImageProps, 'src'> {
  teamName: string
  league?: SportsLeague | string | undefined
  config?: Partial<TeamLogoConfig>
  sport?: string | undefined
  logoUrl?: string
  dynamicGeneration?: boolean // Enable for custom teams/leagues not in mappings
}

interface PlayerPhotoProps extends Omit<SportsImageProps, 'src'> {
  playerId: number | string
  league?: SportsLeague
  config?: Partial<PlayerPhotoConfig>
  playerName?: string
}

interface SportsImageGenericProps extends Omit<SportsImageProps, 'src'> {
  category: keyof typeof IMAGE_SOURCES
}

/**
 * Generic sports image component with bulletproof fallback support
 */
export function SportsImage({
  src,
  alt,
  width = 200,
  height = 200,
  className,
  fallbackType = 'sports',
  onError,
  priority = false,
  quality = 80,
}: SportsImageProps) {
  const [imgSrc, setImgSrc] = useState(src)
  const [hasError, setHasError] = useState(false)
  const [isFallback, setIsFallback] = useState(false)

  const handleError = useCallback(() => {
    if (!hasError) {
      setHasError(true)
      const fallbackUrl = getFallbackImageUrl(fallbackType)
      setImgSrc(fallbackUrl)
      setIsFallback(true)
      onError?.()
    }
  }, [hasError, fallbackType, onError])

  return (
    <div className={cn('relative overflow-hidden', className)}>
      <Image
        src={imgSrc || getFallbackImageUrl(fallbackType)}
        alt={alt}
        width={width}
        height={height}
        className={cn(
          'object-contain transition-opacity duration-200',
          hasError && 'opacity-50',
          isFallback && 'opacity-90'
        )}
        onError={handleError}
        priority={priority}
        quality={quality}
        unoptimized={isFallback} // Don't optimize static fallback images
      />
    </div>
  )
}

/**
 * Team logo component with bulletproof fallback support
 */
export function TeamLogo({
  teamName,
  league,
  alt,
  width = 200,
  height = 200,
  className,
  fallbackType = 'team',
  onError,
  priority = false,
  quality = 80,
  sport,
  logoUrl,
}: TeamLogoProps) {
  const [imgSrc, setImgSrc] = useState<string>('')
  const [hasError, setHasError] = useState(false)
  const [isFallback, setIsFallback] = useState(false)
  const [loading, setLoading] = useState(true)

  // Load logo using bulletproof image service
  useEffect(() => {
    const loadLogo = async () => {
      try {
        setLoading(true)
        setHasError(false)

        const startTime = Date.now()

        // If logoUrl is provided, use it directly
        if (logoUrl) {
          setImgSrc(logoUrl)
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

        setImgSrc(result.url)
        setIsFallback(result.url.startsWith('/images/fallbacks/'))

        // Track successful image load (fire-and-forget)
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
        console.warn('Failed to load team logo:', error)
        setHasError(true)
        const fallbackUrl = getFallbackImageUrl(fallbackType)
        setImgSrc(fallbackUrl)
        setIsFallback(true)

        // Track failed image load (fire-and-forget)
        fetch('/api/monitor/image-event', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            entityType: 'team',
            entityName: teamName,
            sport,
            source: 'static',
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
            loadTime,
          }),
        }).catch(trackError => {
          console.debug('Failed to track image event:', trackError)
        })
      } finally {
        setLoading(false)
      }
    }

    if (teamName) {
      loadLogo()
    }
  }, [teamName, league, sport, logoUrl, fallbackType])

  const handleError = useCallback(() => {
    if (!hasError) {
      setHasError(true)
      const fallbackUrl = getFallbackImageUrl(fallbackType)
      setImgSrc(fallbackUrl)
      setIsFallback(true)
      onError?.()
    }
  }, [hasError, fallbackType, onError])

  if (loading) {
    return <SportsImageSkeleton width={width} height={height} {...(className && { className })} />
  }

  return (
    <div className={cn('relative overflow-hidden', className)}>
      <Image
        src={imgSrc}
        alt={alt || `${teamName} logo`}
        width={width}
        height={height}
        className={cn(
          'object-contain transition-opacity duration-200',
          hasError && 'opacity-50',
          isFallback && 'opacity-90'
        )}
        onError={handleError}
        priority={priority}
        quality={quality}
        unoptimized={isFallback} // Don't optimize static fallback images
      />
    </div>
  )
}

/**
 * Player photo component with bulletproof fallback support
 */
export function PlayerPhoto({
  playerId,
  alt,
  width = 200,
  height = 200,
  className,
  fallbackType = 'player',
  onError,
  priority = false,
  quality = 80,
  playerName,
}: PlayerPhotoProps) {
  const [imgSrc, setImgSrc] = useState<string>('')
  const [hasError, setHasError] = useState(false)
  const [isFallback, setIsFallback] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true)
        setHasError(false)

        const startTime = Date.now()

        // Use bulletproof image service
        const result = await imageService.getPlayerPhotoUrl(String(playerId), undefined, playerName)
        const loadTime = Date.now() - startTime

        setImgSrc(result.url)
        setIsFallback(result.url.startsWith('/images/fallbacks/'))

        // Track successful image load
        try {
          await fetch('/api/monitor/image-event', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              entityType: 'player',
              entityName: playerName || String(playerId),
              source: result.source,
              success: true,
              url: result.url,
              loadTime,
            }),
          })
        } catch (error) {
          console.debug('Failed to track image event:', error)
        }
      } catch (error) {
        const loadTime = Date.now() - Date.now()
        console.warn('Failed to load player photo:', error)
        setHasError(true)
        const fallbackUrl = getFallbackImageUrl('player')
        setImgSrc(fallbackUrl)
        setIsFallback(true)

        // Track failed image load
        try {
          await fetch('/api/monitor/image-event', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              entityType: 'player',
              entityName: playerName || String(playerId),
              source: 'static',
              success: false,
              error: error instanceof Error ? error.message : 'Unknown error',
              loadTime,
            }),
          })
        } catch (trackError) {
          console.debug('Failed to track image event:', trackError)
        }
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [playerId, playerName])

  const handleError = useCallback(() => {
    if (!hasError) {
      setHasError(true)
      const fallbackUrl = getFallbackImageUrl(fallbackType)
      setImgSrc(fallbackUrl)
      setIsFallback(true)
      onError?.()
    }
  }, [hasError, fallbackType, onError])

  if (loading) {
    return <SportsImageSkeleton width={width} height={height} {...(className && { className })} />
  }

  return (
    <div className={cn('relative overflow-hidden', className)}>
      <Image
        src={imgSrc}
        alt={alt || `Player ${playerId}`}
        width={width}
        height={height}
        className={cn(
          'object-cover transition-opacity duration-200',
          hasError && 'opacity-50',
          isFallback && 'opacity-90'
        )}
        onError={handleError}
        priority={priority}
        quality={quality}
        unoptimized={isFallback} // Don't optimize static fallback images
      />
    </div>
  )
}

/**
 * Sports category image component with bulletproof fallback
 */
export function SportsImageGeneric({
  category,
  alt,
  width = 200,
  height = 200,
  className,
  fallbackType = 'sports',
  onError,
  priority = false,
  quality = 80,
}: SportsImageGenericProps) {
  const [imgSrc, setImgSrc] = useState(() => getSportsImageUrl(String(category), { width, height }))
  const [hasError, setHasError] = useState(false)
  const [isFallback, setIsFallback] = useState(imgSrc.startsWith('/images/fallbacks/'))

  const handleError = useCallback(() => {
    if (!hasError) {
      setHasError(true)
      const fallbackUrl = getFallbackImageUrl(fallbackType)
      setImgSrc(fallbackUrl)
      setIsFallback(true)
      onError?.()
    }
  }, [hasError, fallbackType, onError])

  return (
    <div className={cn('relative overflow-hidden', className)}>
      <Image
        src={imgSrc}
        alt={alt || `${String(category)} image`}
        width={width}
        height={height}
        className={cn(
          'object-cover transition-opacity duration-200',
          hasError && 'opacity-50',
          isFallback && 'opacity-90'
        )}
        onError={handleError}
        priority={priority}
        quality={quality}
        unoptimized={isFallback} // Don't optimize static fallback images
      />
    </div>
  )
}

/**
 * Loading skeleton for sports images
 */
export function SportsImageSkeleton({
  width = 200,
  height = 200,
  className,
}: {
  width?: number
  height?: number
  className?: string
}) {
  return (
    <div className={cn('animate-pulse bg-muted rounded-lg', className)} style={{ width, height }} />
  )
}
