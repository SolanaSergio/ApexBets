import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

export function DashboardSkeleton() {
  return (
    <div className="space-y-6 lg:space-y-8">
      {/* Header Skeleton */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="space-y-2">
          <div className="h-6 lg:h-8 w-48 lg:w-64 bg-muted rounded-xl animate-shimmer" />
          <div className="h-3 lg:h-4 w-32 lg:w-48 bg-muted rounded-lg animate-shimmer" />
        </div>
        <div className="h-10 w-full lg:w-32 bg-muted rounded-xl animate-shimmer" />
      </div>

      {/* Stats Cards Skeleton */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="glass-premium p-4 rounded-2xl border border-border/50">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 lg:w-10 lg:h-10 bg-muted rounded-xl animate-shimmer" />
              <div className="flex-1 space-y-2">
                <div className="h-3 lg:h-4 w-16 lg:w-20 bg-muted rounded animate-shimmer" />
                <div className="h-2 lg:h-3 w-12 lg:w-16 bg-muted rounded animate-shimmer" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Main Content Skeleton */}
      <div className="space-y-4 lg:space-y-6">
        {/* Large Chart Card */}
        <Card className="glass-premium">
          <CardHeader className="pb-4">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-2">
              <Skeleton className="h-5 lg:h-6 w-32 lg:w-48" />
              <Skeleton className="h-8 w-full lg:w-32" />
            </div>
          </CardHeader>
          <CardContent>
            <Skeleton className="h-48 lg:h-64 w-full rounded-xl" />
          </CardContent>
        </Card>

        {/* Two Column Layout */}
        <div className="grid gap-4 lg:gap-6 lg:grid-cols-2">
          <Card className="glass-premium">
            <CardHeader>
              <Skeleton className="h-5 lg:h-6 w-24 lg:w-32" />
            </CardHeader>
            <CardContent className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3 p-3 bg-muted/50 rounded-xl">
                  <Skeleton className="w-8 h-8 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-3 w-24" />
                    <Skeleton className="h-2 w-16" />
                  </div>
                  <Skeleton className="h-6 w-12" />
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="glass-premium">
            <CardHeader>
              <Skeleton className="h-5 lg:h-6 w-24 lg:w-32" />
            </CardHeader>
            <CardContent className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between p-3 bg-muted/50 rounded-xl"
                >
                  <div className="flex items-center gap-3">
                    <Skeleton className="w-6 h-6 rounded" />
                    <Skeleton className="h-3 w-20" />
                  </div>
                  <Skeleton className="h-4 w-8" />
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
