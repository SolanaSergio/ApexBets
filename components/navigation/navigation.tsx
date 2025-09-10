"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Badge } from "@/components/ui/badge"
import { BarChart3, Calendar, Home, Menu, Settings, Target, TrendingUp, Users, Bell, X, ChevronDown, User } from "lucide-react"
import { NotificationSystem } from "@/components/notifications/notification-system"
import { SportSelector, SportSelectorCompact } from "./sport-selector"

const navigationItems = [
  {
    title: "Dashboard",
    href: "/",
    icon: Home,
    description: "Overview and insights",
  },
  {
    title: "Games",
    href: "/games",
    icon: Calendar,
    description: "Live and upcoming games",
    badge: "Live",
  },
  {
    title: "Players",
    href: "/players",
    icon: User,
    description: "Player statistics and analysis",
    badge: "New",
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
  const [selectedSport, setSelectedSport] = useState("basketball")

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <header className={cn(
      "sticky top-0 z-50 w-full transition-all duration-200",
      scrolled 
        ? "bg-background/95 backdrop-blur-md border-b border-border/50 shadow-sm" 
        : "bg-background/80 backdrop-blur-sm border-b border-border/30"
    )}>
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-3 group">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-r from-primary to-accent text-primary-foreground shadow-lg group-hover:shadow-xl transition-all duration-200 group-hover:scale-105">
              <Target className="h-5 w-5" />
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                Project Apex
              </span>
              <span className="text-xs text-muted-foreground -mt-1">Sports Analytics</span>
            </div>
          </Link>

          {/* Sport Selector */}
          <div className="hidden lg:block">
            <SportSelector 
              selectedSport={selectedSport}
              onSportChange={setSelectedSport}
              className="w-64"
            />
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center space-x-1">
            {navigationItems.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href

              return (
                <Link key={item.href} href={item.href}>
                  <Button
                    variant={isActive ? "default" : "ghost"}
                    size="sm"
                    className={cn(
                      "flex items-center space-x-2 relative group transition-all duration-200",
                      isActive 
                        ? "bg-primary text-primary-foreground shadow-md" 
                        : "hover:bg-muted/50 hover:text-foreground"
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{item.title}</span>
                    {item.badge && (
                      <Badge 
                        variant={item.badge === "Live" ? "destructive" : "secondary"} 
                        className="ml-1 text-xs px-1.5 py-0.5"
                      >
                        {item.badge}
                      </Badge>
                    )}
                    {isActive && (
                      <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-primary-foreground rounded-full" />
                    )}
                  </Button>
                </Link>
              )
            })}
          </nav>

          {/* Desktop Actions */}
          <div className="hidden lg:flex items-center space-x-3">
            <NotificationSystem />
            <Button variant="outline" size="sm" className="gap-2">
              <Settings className="h-4 w-4" />
              <span className="hidden xl:inline">Settings</span>
            </Button>
          </div>

          {/* Mobile Navigation */}
          <div className="flex items-center space-x-2 lg:hidden">
            <NotificationSystem />
            <Sheet open={isOpen} onOpenChange={setIsOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="sm" className="relative">
                  <Menu className="h-5 w-5" />
                  <span className="sr-only">Toggle navigation menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-80 sm:w-96">
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

                  {/* Mobile Sport Selector */}
                  <div className="px-4 py-4 border-b border-border/50">
                    <SportSelectorCompact 
                      selectedSport={selectedSport}
                      onSportChange={setSelectedSport}
                    />
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
                  <div className="pt-6 border-t">
                    <Button variant="outline" className="w-full justify-start gap-2">
                      <Settings className="h-4 w-4" />
                      Settings
                    </Button>
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
