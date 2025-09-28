"use client"

import { usePathname } from 'next/navigation'

interface PageTransitionProps {
  children: React.ReactNode
}

export function PageTransition({ children }: PageTransitionProps) {
  const pathname = usePathname()

  return (
    <div 
      key={pathname}
      className="w-full animate-fade-in"
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
  return (
    <div className={`animate-fade-in ${className}`}>
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
  return (
    <div className={`animate-fade-in ${className}`}>
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
  return (
    <div className={`animate-fade-in ${className}`}>
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
  return (
    <div className={`animate-fade-in ${className}`}>
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
  return (
    <div className={`animate-fade-in ${className}`}>
      {children}
    </div>
  )
}
