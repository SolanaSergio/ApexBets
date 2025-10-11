'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Icons } from '@/components/shared/icons'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'

const NAV_ITEMS = [
  { href: '/', label: 'Dashboard', icon: Icons.home },
  { href: '/games', label: 'Games', icon: Icons.swords, badge: 'Live' },
  { href: '/players', label: 'Players', icon: Icons.users },
  { href: '/teams', label: 'Teams', icon: Icons.shield },
  { href: '/predictions', label: 'Predictions', icon: Icons.brainCircuit },
  { href: '/analytics', label: 'Analytics', icon: Icons.lineChart },
  { href: '/settings', label: 'Settings', icon: Icons.settings },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <div className="hidden border-r bg-white md:block shadow-md">
      <div className="flex h-full max-h-screen flex-col gap-2">
        <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
          <Link href="/" className="flex items-center gap-2 font-semibold text-primary">
            <Icons.logo className="h-7 w-7" />
            <span className="text-lg">Project Apex</span>
          </Link>
        </div>
        <div className="flex-1 overflow-y-auto">
          <nav className="grid items-start px-2 text-sm font-medium lg:px-4 py-4">
            {NAV_ITEMS.map(({ href, label, icon: Icon, badge }) => {
              const isActive = pathname === href
              return (
                <Link
                  key={href}
                  href={href}
                  className={cn(
                    'flex items-center gap-3 rounded-lg px-3 py-2.5 text-muted-foreground transition-all hover:bg-primary/10 hover:text-primary',
                    { 'bg-primary/10 text-primary font-semibold': isActive }
                  )}
                >
                  <Icon className="h-5 w-5" />
                  {label}
                  {badge && <Badge className={`ml-auto ${isActive ? 'bg-primary text-primary-foreground' : ''}`}>{badge}</Badge>}
                </Link>
              )
            })}
          </nav>
        </div>
        <div className="mt-auto p-4 border-t">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gray-100 rounded-lg">
                <Icons.helpCircle className="h-5 w-5 text-muted-foreground" />
            </div>
            <div>
                <p className="text-sm font-medium">Help & Support</p>
                <a href="/docs" className="text-xs text-muted-foreground hover:text-primary">Contact us</a>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}