'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  BarChart3,
  Calendar,
  Home,
  Target,
  TrendingUp,
  Users,
  Bell,
  Settings,
  User,
  ChevronLeft,
  ChevronRight,
  Activity,
} from 'lucide-react'
import { NotificationSystem } from '@/components/notifications/notification-system'
import { UserProfile } from '@/components/auth/user-profile'
import { ThemeToggle } from '@/components/ui/theme-toggle'
import { useAuth } from '@/lib/auth/auth-context'
import { useIsMobile } from '@/hooks/use-mobile'
import { useRealTimeData } from '@/components/data/real-time-provider'

type NavItem = {
  title: string
  href: string
  icon: any
  description: string
  badge?: string
}

const navigationItems: NavItem[] = [
  {
    title: 'Home',
    href: '/',
    icon: Home,
    description: 'Sports analytics homepage',
  },
  {
    title: 'Games',
    href: '/games',
    icon: Calendar,
    description: 'Live and upcoming games',
  },
  {
    title: 'Players',
    href: '/players',
    icon: User,
    description: 'Player statistics and analysis',
  },
  {
    title: 'Teams',
    href: '/teams',
    icon: Users,
    description: 'Team statistics and rosters',
  },
  {
    title: 'Predictions',
    href: '/predictions',
    icon: Target,
    description: 'AI-powered predictions',
  },
  {
    title: 'Analytics',
    href: '/analytics',
    icon: BarChart3,
    description: 'Advanced analytics',
  },
  {
    title: 'Trends',
    href: '/trends',
    icon: TrendingUp,
    description: 'Market trends and patterns',
  },
  {
    title: 'Alerts',
    href: '/alerts',
    icon: Bell,
    description: 'Custom notifications',
  },
  {
    title: 'Settings',
    href: '/settings',
    icon: Settings,
    description: 'App configuration',
  },
]

export function SidebarNavigation() {
  const pathname = usePathname()
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [mounted, setMounted] = useState(false)
  const { user } = useAuth()
  const isMobile = useIsMobile()
  
  // Safely get real-time data with fallback
  let data: any = { games: [] }
  try {
    const realTimeData = useRealTimeData()
    data = realTimeData.data
  } catch (error) {
    // Context not available, use fallback data
    console.warn('RealTimeProvider context not available in SidebarNavigation:', error)
    data = { games: [] }
  }

  useEffect(() => {
    setMounted(true)
  }, [])

  // Don't render sidebar on mobile
  if (isMobile) {
    return null
  }

  if (!mounted) {
    return null
  }

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 z-40 h-screen bg-sidebar border-r border-sidebar-border transition-all duration-300',
        isCollapsed ? 'w-20' : 'w-80'
      )}
    >
      <div className="flex h-full flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-sidebar-border">
          {!isCollapsed && (
            <Link href="/" className="flex items-center space-x-3 group">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-lg group-hover:shadow-xl transition-all duration-300">
                <Target className="h-5 w-5" />
              </div>
              <div className="flex flex-col">
                <span className="text-lg font-bold text-sidebar-foreground">Project Apex</span>
                <span className="text-xs text-muted-foreground font-medium">Sports Analytics</span>
              </div>
            </Link>
          )}
          {isCollapsed && (
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-lg mx-auto">
              <Target className="h-5 w-5" />
            </div>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="h-8 w-8 p-0 hover:bg-sidebar-accent/10"
          >
            {isCollapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </Button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-2">
          {navigationItems.map(item => {
            const Icon = item.icon
            const isActive = pathname === item.href

            return (
              <Link key={item.href} href={item.href}>
                <div
                  className={cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group relative',
                    isActive
                      ? 'bg-sidebar-primary/10 text-sidebar-primary border-l-2 border-sidebar-primary'
                      : 'hover:bg-sidebar-accent/10 hover:text-sidebar-foreground'
                  )}
                >
                  <Icon className="h-5 w-5 flex-shrink-0" />
                  {!isCollapsed && (
                    <>
                      <span className="font-medium text-sm truncate">{item.title}</span>
                      {item.badge && (
                        <Badge
                          variant={item.badge === 'Live' ? 'destructive' : 'secondary'}
                          className="ml-auto text-xs px-1.5 py-0.5"
                        >
                          {item.badge}
                        </Badge>
                      )}
                    </>
                  )}
                  {isCollapsed && isActive && (
                    <div className="absolute left-0 top-1/2 transform -translate-y-1/2 w-1 h-6 bg-sidebar-primary rounded-r-full" />
                  )}
                </div>
              </Link>
            )
          })}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-sidebar-border space-y-4">
          {/* Quick Stats */}
          {!isCollapsed && (
            <div className="card-modern p-3">
              <div className="flex items-center gap-2 mb-2">
                <Activity className="h-4 w-4 text-accent" />
                <span className="text-xs font-medium text-muted-foreground">Live Now</span>
              </div>
              <div className="text-lg font-bold text-foreground">
                {Array.isArray(data.games) ? data.games.filter((game: any) => game.status === 'in_progress').length : 0} Games
              </div>
              <div className="text-xs text-muted-foreground">
                {Array.isArray(data.games) ? [
                  ...new Set(
                    data.games
                      .filter((game: any) => game.status === 'in_progress')
                      .map((game: any) => game.sport)
                  ),
                ].length : 0}{' '}
                sports active
              </div>
            </div>
          )}

          {/* User Section */}
          <div className="flex items-center gap-3">
            {user ? (
              <>
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground text-sm font-medium">
                  {user.user_metadata?.full_name?.[0] || user.email?.[0] || 'U'}
                </div>
                {!isCollapsed && (
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate text-sidebar-foreground">
                      {user.user_metadata?.full_name || user.email}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                  </div>
                )}
                <UserProfile />
              </>
            ) : (
              <Button asChild variant="outline" size="sm" className="w-full">
                <Link href="/login">Sign In</Link>
              </Button>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <NotificationSystem />
          </div>
        </div>
      </div>
    </aside>
  )
}
