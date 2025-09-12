"use client"

import { useState } from "react"
import { cn } from "@/lib/utils"

interface TeamLogoProps {
  logoUrl?: string | null
  teamName: string
  abbreviation?: string
  size?: "sm" | "md" | "lg" | "xl"
  className?: string
  fallbackIcon?: React.ReactNode
}

const sizeClasses = {
  sm: "h-6 w-6",
  md: "h-8 w-8", 
  lg: "h-12 w-12",
  xl: "h-16 w-16"
}

export function TeamLogo({ 
  logoUrl, 
  teamName, 
  abbreviation, 
  size = "md", 
  className,
  fallbackIcon
}: TeamLogoProps) {
  const [imageError, setImageError] = useState(false)
  const [imageLoading, setImageLoading] = useState(true)

  const handleImageError = () => {
    setImageError(true)
    setImageLoading(false)
  }

  const handleImageLoad = () => {
    setImageLoading(false)
  }

  if (imageError || !logoUrl) {
    return (
      <div 
        className={cn(
          "flex items-center justify-center rounded-full bg-muted text-muted-foreground font-semibold",
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

  return (
    <div className={cn("relative", sizeClasses[size], className)}>
      {imageLoading && (
        <div className="absolute inset-0 flex items-center justify-center rounded-full bg-muted animate-pulse">
          <span className="text-xs font-bold text-muted-foreground">
            {abbreviation?.slice(0, 2).toUpperCase() || teamName.slice(0, 2).toUpperCase()}
          </span>
        </div>
      )}
      <img
        src={logoUrl}
        alt={`${teamName} logo`}
        className={cn(
          "rounded-full object-cover transition-opacity duration-200",
          sizeClasses[size],
          imageLoading ? "opacity-0" : "opacity-100"
        )}
        onError={handleImageError}
        onLoad={handleImageLoad}
        title={teamName}
      />
    </div>
  )
}
