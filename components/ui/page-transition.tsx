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

export function FadeIn({ children, className }: FadeInProps) {
  return (
    <div className={`animate-fade-in ${className}`}>
      {children}
    </div>
  )
}

interface SlideInProps {
  children: React.ReactNode
  className?: string
}

export function SlideIn({ 
  children,
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
}

export function StaggerItem({ 
  children, 
  className
}: StaggerItemProps) {
  return (
    <div className={`animate-fade-in ${className}`}>
      {children}
    </div>
  )
}

interface ScaleInProps {
  children: React.ReactNode
  className?: string
}

export function ScaleIn({ children, className }: ScaleInProps) {
  return (
    <div className={`animate-fade-in ${className}`}>
      {children}
    </div>
  )
}

interface BounceInProps {
  children: React.ReactNode
  className?: string
}

export function BounceIn({ children, className }: BounceInProps) {
  return (
    <div className={`animate-fade-in ${className}`}>
      {children}
    </div>
  )
}
