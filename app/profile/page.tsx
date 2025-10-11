'use client'

import { useAuth } from '@/lib/auth/auth-context'
import { UserProfile } from '@/components/auth/user-profile'
import { AppLayout } from '@/components/layout/app-layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Settings, Shield, Bell, Star, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function ProfilePage() {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
    }
  }, [user, loading, router])

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <AppLayout>
      <div className="p-4 sm:p-6 lg:p-8 space-y-8">
        <Header />
        <div className="grid gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <UserProfile />
          </div>
          <div className="space-y-6">
            <QuickActions />
            <UpgradeCard />
          </div>
        </div>
      </div>
    </AppLayout>
  )
}

// --- Sub-components ---

function Header() {
  return (
    <div className="border-b pb-6">
      <h1 className="text-3xl md:text-4xl font-bold text-gray-900">My Profile</h1>
      <p className="mt-2 text-lg text-muted-foreground">View and manage your personal information and account security.</p>
    </div>
  )
}

function QuickActions() {
  const actions = [
    { label: 'App Settings', href: '/settings', icon: Settings },
    { label: 'Notifications', href: '/settings?tab=notifications', icon: Bell },
    { label: 'Privacy', href: '/settings?tab=privacy', icon: Shield },
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle>Quick Actions</CardTitle>
        <CardDescription>Navigate to other settings pages.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        {actions.map(action => (
          <Button key={action.label} variant="outline" className="w-full justify-start" asChild>
            <Link href={action.href}>
              <action.icon className="h-4 w-4 mr-3" />
              {action.label}
            </Link>
          </Button>
        ))}
      </CardContent>
    </Card>
  )
}

function UpgradeCard() {
  return (
    <Card className="bg-gradient-to-br from-primary to-blue-600 text-white shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><Star /> Upgrade to Pro</CardTitle>
        <CardDescription className="text-blue-100">Unlock exclusive features and gain a competitive edge.</CardDescription>
      </CardHeader>
      <CardContent>
        <ul className="text-sm space-y-2 mb-6">
          <li className="flex items-center gap-2"><Star className="h-4 w-4 text-yellow-300" /> Advanced Analytics</li>
          <li className="flex items-center gap-2"><Star className="h-4 w-4 text-yellow-300" /> Real-time Value Bet Alerts</li>
          <li className="flex items-center gap-2"><Star className="h-4 w-4 text-yellow-300" /> Unlimited Custom Dashboards</li>
        </ul>
        <Button className="w-full bg-white text-primary hover:bg-gray-100 font-bold">
          Explore Pro Plans <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </CardContent>
    </Card>
  )
}