'use client'

import { useState, useEffect } from 'react'
import { CheckCircle, Loader2, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'

interface EnhancedLoadingProps {
  message?: string
  successMessage?: string
  showSuccess?: boolean
  size?: 'sm' | 'default' | 'lg'
  className?: string
}

export function EnhancedLoading({
  message = 'Loading...',
  successMessage = 'Success!',
  showSuccess = false,
  size = 'default',
  className,
}: EnhancedLoadingProps) {
  const [dots, setDots] = useState('')

  useEffect(() => {
    if (!showSuccess) {
      const interval = setInterval(() => {
        setDots(prev => (prev.length >= 3 ? '' : prev + '.'))
      }, 500)
      return () => clearInterval(interval)
    }
    return undefined
  }, [showSuccess])

  const sizeClasses = {
    sm: 'h-4 w-4',
    default: 'h-6 w-6',
    lg: 'h-8 w-8',
  }

  if (showSuccess) {
    return (
      <div className={cn('flex flex-col items-center gap-3', className)}>
        <div className="relative">
          <CheckCircle className={cn('text-green-500 animate-pulse', sizeClasses[size])} />
          <Sparkles className="absolute -top-1 -right-1 h-3 w-3 text-yellow-400 animate-bounce" />
        </div>
        <p className="text-sm text-green-600 font-medium animate-fade-in">{successMessage}</p>
      </div>
    )
  }

  return (
    <div className={cn('flex flex-col items-center gap-3', className)}>
      <div className="relative">
        <Loader2 className={cn('animate-spin text-emerald-500', sizeClasses[size])} />
        <div className="absolute inset-0 rounded-full border-2 border-emerald-200 animate-pulse" />
      </div>
      <p className="text-sm text-slate-600 font-medium">
        {message}
        {dots}
      </p>
    </div>
  )
}

interface AuthLoadingProps {
  step: 'signing-in' | 'creating-account' | 'success' | 'redirecting'
  className?: string
}

export function AuthLoading({ step, className }: AuthLoadingProps) {
  const [currentStep, setCurrentStep] = useState(step)

  useEffect(() => {
    setCurrentStep(step)
  }, [step])

  const stepConfig = {
    'signing-in': {
      message: 'Signing you in',
      icon: Loader2,
      color: 'text-emerald-500',
    },
    'creating-account': {
      message: 'Creating your account',
      icon: Loader2,
      color: 'text-emerald-500',
    },
    success: {
      message: 'Account created successfully!',
      icon: CheckCircle,
      color: 'text-green-500',
    },
    redirecting: {
      message: 'Redirecting to dashboard',
      icon: Loader2,
      color: 'text-emerald-500',
    },
  }

  const config = stepConfig[currentStep]
  const Icon = config.icon

  return (
    <div className={cn('flex flex-col items-center gap-4 p-6', className)}>
      <div className="relative">
        <Icon className={cn('h-8 w-8 animate-spin', config.color)} />
        {currentStep === 'success' && (
          <Sparkles className="absolute -top-1 -right-1 h-4 w-4 text-yellow-400 animate-bounce" />
        )}
      </div>
      <div className="text-center">
        <p className="text-lg font-medium text-slate-900">{config.message}</p>
        {currentStep === 'success' && (
          <p className="text-sm text-slate-600 mt-1">Welcome to ApexBets!</p>
        )}
      </div>
    </div>
  )
}

interface ProgressStepsProps {
  currentStep: number
  totalSteps: number
  steps: string[]
  className?: string
}

export function ProgressSteps({ currentStep, totalSteps, steps, className }: ProgressStepsProps) {
  return (
    <div className={cn('w-full', className)}>
      <div className="flex items-center justify-between mb-4">
        {steps.map((step, index) => (
          <div key={index} className="flex flex-col items-center">
            <div
              className={cn(
                'w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all duration-300',
                index < currentStep
                  ? 'bg-green-500 text-white'
                  : index === currentStep
                    ? 'bg-emerald-500 text-white animate-pulse'
                    : 'bg-slate-200 text-slate-500'
              )}
            >
              {index < currentStep ? <CheckCircle className="h-4 w-4" /> : index + 1}
            </div>
            <span
              className={cn(
                'text-xs mt-2 text-center transition-colors duration-300',
                index <= currentStep ? 'text-slate-900' : 'text-slate-500'
              )}
            >
              {step}
            </span>
          </div>
        ))}
      </div>
      <div className="w-full bg-slate-200 rounded-full h-2">
        <div
          className="bg-gradient-to-r from-emerald-500 to-green-500 h-2 rounded-full transition-all duration-500 ease-out"
          style={{ width: `${(currentStep / (totalSteps - 1)) * 100}%` }}
        />
      </div>
    </div>
  )
}
