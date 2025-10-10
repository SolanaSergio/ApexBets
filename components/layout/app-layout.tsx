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
      {!isMobile && <SidebarNavigation />}
      
      {/* Mobile navigation */}
      {isMobile && <Navigation />}
      
      {/* Main content */}
      <main className={isMobile ? "pt-16 pb-20" : "ml-80"}>
        <div className="min-h-screen">
          {children}
        </div>
      </main>
    </div>
  )
}
