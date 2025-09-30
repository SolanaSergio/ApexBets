"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Badge } from "@/components/ui/badge"
import { BarChart3, Calendar, Home, Menu, Settings, Target, TrendingUp, Users, Bell, X, User } from "lucide-react"
import { NotificationSystem } from "@/components/notifications/notification-system"
import { UserProfileDropdown } from "@/components/auth/user-profile"
import { ThemeToggle } from "@/components/ui/theme-toggle"
import { useAuth } from "@/lib/auth/auth-context"
import { useIsMobile, useDeviceType, useIsTouchDevice } from "@/hooks/use-mobile"

type NavItem = {
  title: string
  href: string
  icon: any
  description: string
  badge?: string
}

const navigationItems: NavItem[] = [
  {
    title: "Home",
    href: "/",
    icon: Home,
    description: "Sports analytics homepage",
  },
  {
    title: "Games",
    href: "/games",
    icon: Calendar,
    description: "Live and upcoming games",
  },
  {
    title: "Players",
    href: "/players",
    icon: User,
    description: "Player statistics and analysis",
  },
  {
    title: "Teams",
    href: "/teams",
    icon: Users,
    description: "Team statistics and rosters",
  },
  {
    title: "Predictions",
    href: "/predictions",
    icon: Target,
    description: "AI-powered predictions",
  },
  {
    title: "Analytics",
    href: "/analytics",
    icon: BarChart3,
    description: "Advanced analytics",
  },
  {
    title: "Trends",
    href: "/trends",
    icon: TrendingUp,
    description: "Market trends and patterns",
  },
  {
    title: "Alerts",
    href: "/alerts",
    icon: Bell,
    description: "Custom notifications",
  },
  {
    title: "Settings",
    href: "/settings",
    icon: Settings,
    description: "App configuration",
  },
]

export function Navigation() {
  const pathname = usePathname()
  const [isOpen, setIsOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [mounted, setMounted] = useState(false)
  const { user } = useAuth()
  const isMobile = useIsMobile()
  const deviceType = useDeviceType()
  const isTouchDevice = useIsTouchDevice()

  useEffect(() => {
    setMounted(true)
    const handleScroll = () => {
      setScrolled(window.scrollY > 10)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <header className={cn(
      "sticky top-0 z-50 w-full transition-all duration-500",
      mounted && scrolled
        ? "glass-card shadow-2xl border-b border-white/30"
        : "glass border-b border-white/20"
    )}>
        <div className="container mx-auto px-4">
          <div className="flex h-20 items-center justify-between gap-4">
            {/* Enhanced Mobile-First Logo */}
            <Link href="/" className="flex items-center space-x-2 sm:space-x-4 group flex-shrink-0">
              <div className="flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-xl group-hover:shadow-2xl transition-all duration-500 group-hover:scale-110">
                <Target className="h-6 w-6 sm:h-8 sm:w-8" />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-lg sm:text-2xl font-black text-gradient truncate">
                  Project Apex
                </span>
                <span className="text-xs sm:text-sm text-muted-foreground -mt-1 font-bold truncate">Sports Analytics</span>
              </div>
            </Link>


          {/* Enhanced Desktop Navigation */}
          <nav className="hidden lg:flex items-center space-x-1 xl:space-x-2 flex-shrink-0">
            {navigationItems.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href

              return (
                <Link key={item.href} href={item.href}>
                  <Button
                    variant={isActive ? "default" : "ghost"}
                    size="sm"
                    className={cn(
                      "flex items-center space-x-2 xl:space-x-3 relative group transition-all duration-500 px-3 xl:px-6 py-2 xl:py-3 rounded-lg min-h-[44px] touch-manipulation",
                      isActive
                        ? "bg-primary text-primary-foreground shadow-xl"
                        : "hover:bg-muted hover:text-foreground hover:scale-105 hover:shadow-lg",
                      isTouchDevice && "touch-feedback",
                      deviceType === 'mobile' && "text-sm px-2 py-2",
                      deviceType === 'tablet' && "text-base px-4 py-3"
                    )}
                  >
                    <Icon className="h-4 w-4 xl:h-5 xl:w-5 flex-shrink-0" />
                    <span className="font-bold text-sm xl:text-base truncate">{item.title}</span>
                    {item.badge && (
                      <Badge
                        variant={item.badge === "Live" ? "destructive" : "secondary"}
                        className="ml-1 xl:ml-2 text-xs px-1.5 xl:px-2 py-0.5 xl:py-1 rounded-md font-bold flex-shrink-0"
                      >
                        {item.badge}
                      </Badge>
                    )}
                    {isActive && (
                      <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-white rounded-sm premium-glow" />
                    )}
                  </Button>
                </Link>
              )
            })}
          </nav>

          {/* Enhanced Desktop Actions */}
          <div className="hidden lg:flex items-center space-x-2 xl:space-x-3">
            <ThemeToggle />
            <NotificationSystem />
            {user ? (
              <UserProfileDropdown />
            ) : (
              <Button asChild variant="outline" size="sm" className="min-h-[44px] touch-manipulation">
                <Link href="/login" className="text-sm xl:text-base">Sign In</Link>
              </Button>
            )}
          </div>

          {/* Enhanced Mobile Navigation */}
          <div className="flex items-center space-x-1 sm:space-x-2 lg:hidden">
            <ThemeToggle />
            <NotificationSystem />
            <Sheet open={isOpen} onOpenChange={setIsOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="sm" className="relative min-h-[44px] min-w-[44px] touch-manipulation">
                  <Menu className="h-5 w-5" />
                  <span className="sr-only">Toggle navigation menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent
                side="right"
                className={cn(
                  "w-80 sm:w-96",
                  isMobile && "w-full max-w-sm",
                  deviceType === 'mobile' && "mobile-safe-area"
                )}
              >
                <div className="flex flex-col h-full">
                  {/* Mobile Header */}
                  <div className="flex items-center justify-between pb-6 border-b">
                    <div className="flex items-center space-x-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-r from-primary to-accent text-primary-foreground">
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
                    {navigationItems.map((item) => {
                      const Icon = item.icon
                      const isActive = pathname === item.href

                      return (
                        <Link key={item.href} href={item.href} onClick={() => setIsOpen(false)}>
                          <div className={cn(
                            "flex items-center justify-between p-3 rounded-lg transition-all duration-200 group",
                            isActive 
                              ? "bg-primary text-primary-foreground shadow-md" 
                              : "hover:bg-muted/50 hover:text-foreground"
                          )}>
                            <div className="flex items-center space-x-3">
                              <Icon className="h-5 w-5" />
                              <div>
                                <div className="font-medium">{item.title}</div>
                                <div className={cn(
                                  "text-xs",
                                  isActive ? "text-primary-foreground/70" : "text-muted-foreground"
                                )}>
                                  {item.description}
                                </div>
                              </div>
                            </div>
                            {item.badge && (
                              <Badge 
                                variant={item.badge === "Live" ? "destructive" : "secondary"} 
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
                  <div className="pt-6 border-t space-y-4">
                    {user ? (
                      <div className="flex items-center space-x-3 p-3 rounded-lg bg-muted/50">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground text-sm font-medium">
                          {user.user_metadata?.full_name?.[0] || user.email?.[0] || 'U'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">
                            {user.user_metadata?.full_name || user.email}
                          </p>
                          <p className="text-xs text-muted-foreground truncate">
                            {user.email}
                          </p>
                        </div>
                        <UserProfileDropdown />
                      </div>
                    ) : (
                      <Button asChild variant="outline" className="w-full">
                        <Link href="/login" onClick={() => setIsOpen(false)}>Sign In</Link>
                      </Button>
                    )}
                    <p className="text-xs text-muted-foreground text-center">
                      Version 1.0.0
                    </p>
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
