"use client"

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'

interface PageTransitionProps {
  children: React.ReactNode
}

export function PageTransition({ children }: PageTransitionProps) {
  const pathname = usePathname()
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    setIsLoading(true)
    const timer = setTimeout(() => setIsLoading(false), 300)
    return () => clearTimeout(timer)
  }, [pathname])

  return (
    <div 
      key={pathname}
      className={`w-full transition-all duration-300 ${
        isLoading ? 'opacity-0 translate-y-4' : 'opacity-100 translate-y-0'
      }`}
    >
      {children}
    </div>
  )
}

interface FadeInProps {
  children: React.ReactNode
  delay?: number
  className?: string
}

export function FadeIn({ children, delay = 0, className }: FadeInProps) {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), delay * 1000)
    return () => clearTimeout(timer)
  }, [delay])

  return (
    <div 
      className={`transition-all duration-500 ease-out ${
        isVisible 
          ? 'opacity-100 translate-y-0' 
          : 'opacity-0 translate-y-4'
      } ${className}`}
    >
      {children}
    </div>
  )
}

interface SlideInProps {
  children: React.ReactNode
  direction?: 'left' | 'right' | 'up' | 'down'
  delay?: number
  className?: string
}

export function SlideIn({ 
  children, 
  direction = 'left', 
  delay = 0, 
  className 
}: SlideInProps) {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), delay * 1000)
    return () => clearTimeout(timer)
  }, [delay])

  const directionClasses = {
    left: isVisible ? 'translate-x-0' : '-translate-x-8',
    right: isVisible ? 'translate-x-0' : 'translate-x-8',
    up: isVisible ? 'translate-y-0' : '-translate-y-8',
    down: isVisible ? 'translate-y-0' : 'translate-y-8'
  }

  return (
    <div 
      className={`transition-all duration-500 ease-out ${
        isVisible ? 'opacity-100' : 'opacity-0'
      } ${directionClasses[direction]} ${className}`}
    >
      {children}
    </div>
  )
}

interface StaggerContainerProps {
  children: React.ReactNode
  className?: string
  staggerDelay?: number
}

export function StaggerContainer({ 
  children, 
  className
}: StaggerContainerProps) {
  return (
    <div className={className}>
      {children}
    </div>
  )
}

interface StaggerItemProps {
  children: React.ReactNode
  className?: string
  index?: number
  staggerDelay?: number
}

export function StaggerItem({ 
  children, 
  className, 
  index = 0, 
  staggerDelay = 0.1 
}: StaggerItemProps) {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), index * staggerDelay * 1000)
    return () => clearTimeout(timer)
  }, [index, staggerDelay])

  return (
    <div 
      className={`transition-all duration-500 ease-out ${
        isVisible 
          ? 'opacity-100 translate-y-0' 
          : 'opacity-0 translate-y-4'
      } ${className}`}
    >
      {children}
    </div>
  )
}

interface ScaleInProps {
  children: React.ReactNode
  delay?: number
  className?: string
}

export function ScaleIn({ children, delay = 0, className }: ScaleInProps) {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), delay * 1000)
    return () => clearTimeout(timer)
  }, [delay])

  return (
    <div 
      className={`transition-all duration-500 ease-out ${
        isVisible 
          ? 'opacity-100 scale-100' 
          : 'opacity-0 scale-95'
      } ${className}`}
    >
      {children}
    </div>
  )
}

interface BounceInProps {
  children: React.ReactNode
  delay?: number
  className?: string
}

export function BounceIn({ children, delay = 0, className }: BounceInProps) {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), delay * 1000)
    return () => clearTimeout(timer)
  }, [delay])

  return (
    <div 
      className={`transition-all duration-700 ease-out ${
        isVisible 
          ? 'opacity-100 scale-100' 
          : 'opacity-0 scale-75'
      } ${isVisible ? 'animate-bounce-gentle' : ''} ${className}`}
    >
      {children}
    </div>
  )
}
