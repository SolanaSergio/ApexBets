"use client"

import { SidebarNavigation } from "@/components/navigation/sidebar-navigation"
import { Navigation } from "@/components/navigation/navigation"
import { useIsMobile } from "@/hooks/use-mobile"

interface AppLayoutProps {
  children: React.ReactNode
}

export function AppLayout({ children }: AppLayoutProps) {
  const isMobile = useIsMobile()

  return (
    <div className="min-h-screen bg-background">
      {/* Sidebar for desktop */}
      <SidebarNavigation />
      
      {/* Mobile navigation */}
      <Navigation />
      
      {/* Main content */}
      <main className={isMobile ? "pt-16" : "ml-80"}>
        {children}
      </main>
    </div>
  )
}
