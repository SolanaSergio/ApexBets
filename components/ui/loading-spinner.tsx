import { cn } from "@/lib/utils"

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg"
  className?: string
}

export function LoadingSpinner({ size = "md", className }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-8 w-8", 
    lg: "h-12 w-12"
  }

  return (
    <div className={cn("flex items-center justify-center", className)}>
      <div
        className={cn(
          "animate-spin rounded-full border-2 border-muted border-t-primary",
          sizeClasses[size]
        )}
      />
    </div>
  )
}

interface LoadingDotsProps {
  className?: string
}

export function LoadingDots({ className }: LoadingDotsProps) {
  return (
    <div className={cn("flex space-x-1", className)}>
      <div className="h-2 w-2 bg-primary rounded-full animate-bounce [animation-delay:-0.3s]"></div>
      <div className="h-2 w-2 bg-primary rounded-full animate-bounce [animation-delay:-0.15s]"></div>
      <div className="h-2 w-2 bg-primary rounded-full animate-bounce"></div>
    </div>
  )
}

interface LoadingPulseProps {
  className?: string
}

export function LoadingPulse({ className }: LoadingPulseProps) {
  return (
    <div className={cn("flex space-x-2", className)}>
      <div className="h-3 w-3 bg-primary rounded-full animate-pulse"></div>
      <div className="h-3 w-3 bg-accent rounded-full animate-pulse [animation-delay:0.2s]"></div>
      <div className="h-3 w-3 bg-primary rounded-full animate-pulse [animation-delay:0.4s]"></div>
    </div>
  )
}
