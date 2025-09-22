"use client"

import React, { useState, useCallback, useEffect } from 'react'
import Image from 'next/image'
import { cn } from '@/lib/utils'
import { 
  getTeamLogoUrl as getApiTeamLogoUrl, 
  getPlayerPhotoUrl, 
  getSportsImageUrl, 
  getFallbackImageUrl,
  IMAGE_SOURCES,
  type SportsLeague,
  type TeamLogoConfig,
  type PlayerPhotoConfig
} from '@/lib/services/image-service'
import { getTeamLogoData } from '@/lib/services/dynamic-team-service-client'

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
  league?: string
  teamName?: string
}

interface TeamLogoProps extends Omit<SportsImageProps, 'src'> {
  teamName: string
  league?: SportsLeague
  config?: Partial<TeamLogoConfig>
  sport?: string
  dynamicGeneration?: boolean // Enable for custom teams/leagues not in mappings
}

interface PlayerPhotoProps extends Omit<SportsImageProps, 'src'> {
  playerId: number | string
  league?: SportsLeague
  config?: Partial<PlayerPhotoConfig>
}

interface SportsImageGenericProps extends Omit<SportsImageProps, 'src'> {
  category: keyof typeof IMAGE_SOURCES
}

/**
 * Generic sports image component with fallback support
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
  quality = 80
}: SportsImageProps) {
  const [imgSrc, setImgSrc] = useState(src)
  const [hasError, setHasError] = useState(false)

  const handleError = useCallback(() => {
    if (!hasError) {
      setHasError(true)
      // Try Unsplash stock image first before falling back to placeholder
      if (fallbackType === 'team') {
        setImgSrc('https://images.unsplash.com/photo-1546519638-68e109498ffc?q=80&w=150&h=150&auto=format&fit=crop')
      } else if (fallbackType === 'sports') {
        setImgSrc('https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?q=80&w=400&h=250&auto=format&fit=crop')
      } else {
        setImgSrc(getFallbackImageUrl(fallbackType))
      }
      onError?.()
    }
  }, [hasError, fallbackType, onError])

  return (
    <div className={cn("relative overflow-hidden", className)}>
      <Image
        src={imgSrc || getFallbackImageUrl(fallbackType)}
        alt={alt}
        width={width}
        height={height}
        className={cn(
          "object-contain transition-opacity duration-200",
          hasError && "opacity-50"
        )}
        onError={handleError}
        priority={priority}
        quality={quality}
        unoptimized={!!(src?.includes('cdn.nba.com') || src?.includes('espncdn.com'))}
      />
    </div>
  )
}

/**
 * Team logo component with league support
 */
export function TeamLogo({ 
  teamName, 
  league,
  config = {},
  alt,
  width = 200,
  height = 200,
  className,
  fallbackType = 'team',
  onError,
  priority = false,
  quality = 80
}: TeamLogoProps) {
  const [imgSrc, setImgSrc] = useState<string>('')
  const [hasError, setHasError] = useState(false)

  // Load logo using dynamic service
  useEffect(() => {
    const loadLogo = async () => {
      try {
        const result = await getTeamLogoData(teamName, league)
        setImgSrc(result.logoUrl)
      } catch (error) {
        console.warn('Failed to load team logo:', error)
        // Fallback to API service
        const fallbackUrl = await getApiTeamLogoUrl(teamName, league)
        setImgSrc(fallbackUrl)
      }
    }

    if (teamName) {
      loadLogo()
    }
  }, [teamName, league, config])

  const handleError = useCallback(() => {
    if (!hasError) {
      setHasError(true)
      // Try multiple fallback sources before giving up
      if (fallbackType === 'team') {
        const fallbacks = [
          'https://images.unsplash.com/photo-1546519638-68e109498ffc?q=80&w=150&h=150&auto=format&fit=crop', // Basketball
          'https://images.unsplash.com/photo-1551698618-1dfe5d97d256?q=80&w=150&h=150&auto=format&fit=crop', // Sports
          getFallbackImageUrl(fallbackType) // Local placeholder
        ]
        // Try the first fallback, if that fails, the component will call handleError again
        setImgSrc(fallbacks[0])
        setHasError(false) // Allow another try with fallback
      } else {
        setImgSrc(getFallbackImageUrl(fallbackType))
      }
      onError?.()
    } else if (fallbackType === 'team' && imgSrc === 'https://images.unsplash.com/photo-1546519638-68e109498ffc?q=80&w=150&h=150&auto=format&fit=crop') {
      // Second attempt failed, try final fallback
      setImgSrc('https://images.unsplash.com/photo-1551698618-1dfe5d97d256?q=80&w=150&h=150&auto=format&fit=crop')
      setHasError(true)
    } else if (fallbackType === 'team') {
      // Final fallback failed, use local
      setImgSrc(getFallbackImageUrl(fallbackType))
      setHasError(true)
    }
  }, [hasError, fallbackType, onError, imgSrc])

  return (
    <div className={cn("relative overflow-hidden", className)}>
      {imgSrc ? (
        <Image
          src={imgSrc}
          alt={alt || `${teamName} logo`}
          width={width}
          height={height}
          className={cn(
            "object-contain transition-opacity duration-200",
            hasError && "opacity-50"
          )}
          onError={handleError}
          priority={priority}
          quality={quality}
          unoptimized={imgSrc.includes('cdn.nba.com') || imgSrc.includes('espncdn.com')}
        />
      ) : (
        <SportsImageSkeleton width={width} height={height} />
      )}
    </div>
  )
}

/**
 * Player photo component with league support
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
  quality = 80
}: PlayerPhotoProps) {
  const [imgSrc, setImgSrc] = useState<string>('')
  const [hasError, setHasError] = useState(false)

  useEffect(() => {
    const load = async () => {
      try {
        const url = await getPlayerPhotoUrl(String(playerId))
        setImgSrc(url)
      } catch {
        setImgSrc(getFallbackImageUrl('player'))
      }
    }
    load()
  }, [playerId])

  const handleError = useCallback(() => {
    if (!hasError) {
      setHasError(true)
      setImgSrc(getFallbackImageUrl(fallbackType))
      onError?.()
    }
  }, [hasError, fallbackType, onError])

  return (
    <div className={cn("relative overflow-hidden", className)}>
      <Image
        src={imgSrc}
        alt={alt || `Player ${playerId}`}
        width={width}
        height={height}
        className={cn(
          "object-cover transition-opacity duration-200",
          hasError && "opacity-50"
        )}
        onError={handleError}
        priority={priority}
        quality={quality}
        unoptimized={imgSrc.includes('cdn.nba.com') || imgSrc.includes('espncdn.com')}
      />
    </div>
  )
}

/**
 * Sports category image component
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
  quality = 80
}: SportsImageGenericProps) {
  const [imgSrc, setImgSrc] = useState(() => getSportsImageUrl(String(category), { width, height }))
  const [hasError, setHasError] = useState(false)

  const handleError = useCallback(() => {
    if (!hasError) {
      setHasError(true)
      setImgSrc(getFallbackImageUrl(fallbackType))
      onError?.()
    }
  }, [hasError, fallbackType, onError])

  return (
    <div className={cn("relative overflow-hidden", className)}>
      <Image
        src={imgSrc}
        alt={alt || `${String(category)} image`}
        width={width}
        height={height}
        className={cn(
          "object-cover transition-opacity duration-200",
          hasError && "opacity-50"
        )}
        onError={handleError}
        priority={priority}
        quality={quality}
        unoptimized={imgSrc.includes('unsplash.com') || imgSrc.includes('pexels.com')}
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
  className 
}: { 
  width?: number
  height?: number
  className?: string 
}) {
  return (
    <div 
      className={cn(
        "animate-pulse bg-muted rounded-lg",
        className
      )}
      style={{ width, height }}
    />
  )
}
