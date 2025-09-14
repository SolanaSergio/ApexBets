"use client"

import { useEffect, useState } from "react"
import { cn } from "@/lib/utils"

interface Particle {
  id: number
  x: number
  y: number
  size: number
  color: string
  velocity: { x: number; y: number }
  opacity: number
}

interface DynamicBackgroundProps {
  variant?: "particles" | "waves" | "grid" | "bubbles"
  intensity?: "low" | "medium" | "high"
  colors?: string[]
  interactive?: boolean
  className?: string
}

export function DynamicBackground({
  variant = "particles",
  intensity = "medium",
  colors = ["#06b6d4", "#8b5cf6", "#10b981", "#3b82f6"],
  interactive = true,
  className
}: DynamicBackgroundProps) {
  const [particles, setParticles] = useState<Particle[]>([])
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })

  const particleCount = {
    low: 20,
    medium: 40,
    high: 80
  }[intensity]

  useEffect(() => {
    const initialParticles: Particle[] = Array.from({ length: particleCount }, (_, i) => ({
      id: i,
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      size: Math.random() * 4 + 2,
      color: colors[Math.floor(Math.random() * colors.length)],
      velocity: {
        x: (Math.random() - 0.5) * 2,
        y: (Math.random() - 0.5) * 2
      },
      opacity: Math.random() * 0.5 + 0.1
    }))

    setParticles(initialParticles)
  }, [particleCount, colors])

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY })
    }

    if (interactive) {
      window.addEventListener('mousemove', handleMouseMove)
      return () => window.removeEventListener('mousemove', handleMouseMove)
    }
  }, [interactive])

  useEffect(() => {
    const animateParticles = () => {
      setParticles(prevParticles => 
        prevParticles.map(particle => {
          let newX = particle.x + particle.velocity.x
          let newY = particle.y + particle.velocity.y

          // Bounce off edges
          if (newX <= 0 || newX >= window.innerWidth) {
            particle.velocity.x *= -1
            newX = Math.max(0, Math.min(window.innerWidth, newX))
          }
          if (newY <= 0 || newY >= window.innerHeight) {
            particle.velocity.y *= -1
            newY = Math.max(0, Math.min(window.innerHeight, newY))
          }

          // Mouse interaction
          if (interactive) {
            const dx = mousePosition.x - newX
            const dy = mousePosition.y - newY
            const distance = Math.sqrt(dx * dx + dy * dy)
            
            if (distance < 100) {
              const force = (100 - distance) / 100
              particle.velocity.x -= (dx / distance) * force * 0.5
              particle.velocity.y -= (dy / distance) * force * 0.5
            }
          }

          return {
            ...particle,
            x: newX,
            y: newY
          }
        })
      )
    }

    const interval = setInterval(animateParticles, 50)
    return () => clearInterval(interval)
  }, [mousePosition, interactive])

  const renderParticles = () => (
    <div className="absolute inset-0 overflow-hidden">
      {particles.map(particle => (
        <div
          key={particle.id}
          className="absolute rounded-full animate-pulse"
          style={{
            left: particle.x,
            top: particle.y,
            width: particle.size,
            height: particle.size,
            backgroundColor: particle.color,
            opacity: particle.opacity,
            transform: 'translate(-50%, -50%)',
            boxShadow: `0 0 ${particle.size * 2}px ${particle.color}`,
            transition: 'all 0.1s ease-out'
          }}
        />
      ))}
    </div>
  )

  const renderWaves = () => (
    <div className="absolute inset-0 overflow-hidden">
      <svg className="absolute inset-0 w-full h-full" viewBox="0 0 1200 800">
        <defs>
          <linearGradient id="wave1" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={colors[0]} stopOpacity="0.1" />
            <stop offset="50%" stopColor={colors[1]} stopOpacity="0.2" />
            <stop offset="100%" stopColor={colors[2]} stopOpacity="0.1" />
          </linearGradient>
          <linearGradient id="wave2" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={colors[1]} stopOpacity="0.1" />
            <stop offset="50%" stopColor={colors[2]} stopOpacity="0.2" />
            <stop offset="100%" stopColor={colors[3]} stopOpacity="0.1" />
          </linearGradient>
        </defs>
        <path
          d="M0,400 C300,300 600,500 1200,400 L1200,800 L0,800 Z"
          fill="url(#wave1)"
          className="animate-pulse"
        />
        <path
          d="M0,500 C300,400 600,600 1200,500 L1200,800 L0,800 Z"
          fill="url(#wave2)"
          className="animate-pulse"
          style={{ animationDelay: '1s' }}
        />
      </svg>
    </div>
  )

  const renderGrid = () => (
    <div className="absolute inset-0 opacity-20">
      <div 
        className="w-full h-full"
        style={{
          backgroundImage: `
            linear-gradient(${colors[0]} 1px, transparent 1px),
            linear-gradient(90deg, ${colors[0]} 1px, transparent 1px)
          `,
          backgroundSize: '50px 50px',
          animation: 'float 6s ease-in-out infinite'
        }}
      />
    </div>
  )

  const renderBubbles = () => (
    <div className="absolute inset-0 overflow-hidden">
      {Array.from({ length: particleCount / 2 }).map((_, i) => (
        <div
          key={i}
          className="absolute rounded-full animate-float"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            width: `${Math.random() * 60 + 20}px`,
            height: `${Math.random() * 60 + 20}px`,
            background: `radial-gradient(circle, ${colors[i % colors.length]}20, transparent)`,
            animationDelay: `${Math.random() * 5}s`,
            animationDuration: `${Math.random() * 10 + 5}s`
          }}
        />
      ))}
    </div>
  )

  const renderVariant = () => {
    switch (variant) {
      case "particles":
        return renderParticles()
      case "waves":
        return renderWaves()
      case "grid":
        return renderGrid()
      case "bubbles":
        return renderBubbles()
      default:
        return renderParticles()
    }
  }

  return (
    <div className={cn("fixed inset-0 -z-10 pointer-events-none", className)}>
      {renderVariant()}
    </div>
  )
}

// Floating Elements Component
interface FloatingElementProps {
  children: React.ReactNode
  delay?: number
  duration?: number
  className?: string
}

export function FloatingElement({ 
  children, 
  delay = 0, 
  duration = 6,
  className 
}: FloatingElementProps) {
  return (
    <div 
      className={cn("animate-float", className)}
      style={{
        animationDelay: `${delay}s`,
        animationDuration: `${duration}s`
      }}
    >
      {children}
    </div>
  )
}

// Glowing Orb Component
interface GlowingOrbProps {
  size?: "sm" | "md" | "lg"
  color?: string
  intensity?: "low" | "medium" | "high"
  className?: string
}

export function GlowingOrb({
  size = "md",
  color = "#06b6d4",
  intensity = "medium",
  className
}: GlowingOrbProps) {
  const sizeClasses = {
    sm: "w-16 h-16",
    md: "w-32 h-32",
    lg: "w-48 h-48"
  }

  const glowIntensity = {
    low: "blur-xl",
    medium: "blur-2xl",
    high: "blur-3xl"
  }

  return (
    <div className={cn("relative", className)}>
      <div 
        className={cn(
          "absolute rounded-full animate-pulse",
          sizeClasses[size],
          glowIntensity[intensity]
        )}
        style={{
          background: `radial-gradient(circle, ${color}40, ${color}20, transparent)`,
          filter: 'blur(20px)'
        }}
      />
      <div 
        className={cn(
          "absolute rounded-full animate-pulse",
          sizeClasses[size]
        )}
        style={{
          background: `radial-gradient(circle, ${color}20, transparent)`,
          animationDelay: '1s'
        }}
      />
    </div>
  )
}
