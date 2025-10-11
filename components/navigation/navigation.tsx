'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { Badge } from '@/components/ui/badge'
import {
  BarChart3,
  Calendar,
  Home,
  Menu,
  Settings,
  Target,
  TrendingUp,
  Users,
  Bell,
  X,
  User,
} from 'lucide-react'
import { NotificationSystem } from '@/components/notifications/notification-system'
import { UserMenu } from '@/components/auth/user-menu'
import { ThemeToggle } from '@/components/ui/theme-toggle'
import { useAuth } from '@/lib/auth/auth-context'
import { useIsMobile } from '@/hooks/use-mobile'

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

export function Navigation() {
  const pathname = usePathname()
  const [isOpen, setIsOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const { user } = useAuth()
  const isMobile = useIsMobile()

  useEffect(() => {
    setMounted(true)
  }, [])

  // Only render on mobile
  if (!isMobile) {
    return null
  }

  if (!mounted) {
    return null
  }

  return (
    <header className="sticky top-0 z-50 w-full bg-card border-b border-border">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Mobile Logo */}
          <Link href="/" className="flex items-center space-x-2 group flex-shrink-0">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-lg group-hover:shadow-xl transition-all duration-300">
              <Target className="h-5 w-5" />
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-bold text-foreground">Project Apex</span>
              <span className="text-xs text-muted-foreground font-medium -mt-1">
                Sports Analytics
              </span>
            </div>
          </Link>

          {/* Mobile Actions */}
          <div className="flex items-center space-x-2">
            <ThemeToggle />
            <NotificationSystem />
            <Sheet open={isOpen} onOpenChange={setIsOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="sm" className="h-10 w-10 p-0">
                  <Menu className="h-5 w-5" />
                  <span className="sr-only">Toggle navigation menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-80">
                <div className="flex flex-col h-full">
                  {/* Mobile Header */}
                  <div className="flex items-center justify-between pb-6 border-b border-border">
                    <div className="flex items-center space-x-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                        <Target className="h-5 w-5" />
                      </div>
                      <div>
                        <h2 className="text-lg font-bold">Project Apex</h2>
                        <p className="text-sm text-muted-foreground">Sports Analytics Platform</p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsOpen(false)}
                      className="h-8 w-8 p-0"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>

                  {/* Mobile Navigation */}
                  <nav className="flex-1 py-6 space-y-2">
                    {navigationItems.map(item => {
                      const Icon = item.icon
                      const isActive = pathname === item.href

                      return (
                        <Link key={item.href} href={item.href} onClick={() => setIsOpen(false)}>
                          <div
                            className={cn(
                              'flex items-center justify-between p-3 rounded-lg transition-all duration-200',
                              isActive
                                ? 'bg-primary text-primary-foreground shadow-md'
                                : 'hover:bg-muted hover:text-foreground'
                            )}
                          >
                            <div className="flex items-center space-x-3">
                              <Icon className="h-5 w-5" />
                              <div>
                                <div className="font-medium">{item.title}</div>
                                <div
                                  className={cn(
                                    'text-xs',
                                    isActive
                                      ? 'text-primary-foreground/70'
                                      : 'text-muted-foreground'
                                  )}
                                >
                                  {item.description}
                                </div>
                              </div>
                            </div>
                            {item.badge && (
                              <Badge
                                variant={item.badge === 'Live' ? 'destructive' : 'secondary'}
                                className="text-xs"
                              >
                                {item.badge}
                              </Badge>
                            )}
                          </div>
                        </Link>
                      )
                    })}
                  </nav>

                  {/* Mobile Footer */}
                  <div className="pt-6 border-t border-border space-y-4">
                    {user ? (
                      <div className="flex items-center space-x-3 p-3 rounded-lg bg-muted">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground text-sm font-medium">
                          {user.user_metadata?.full_name?.[0] || user.email?.[0] || 'U'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">
                            {user.user_metadata?.full_name || user.email}
                          </p>
                          <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                        </div>
                        <UserMenu />
                      </div>
                    ) : (
                      <Button asChild variant="outline" className="w-full">
                        <Link href="/login" onClick={() => setIsOpen(false)}>
                          Sign In
                        </Link>
                      </Button>
                    )}
                    <p className="text-xs text-muted-foreground text-center">Version 1.0.0</p>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  )
}
