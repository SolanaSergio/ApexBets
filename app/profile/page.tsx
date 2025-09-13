"use client"

import { useAuth } from '@/lib/auth/auth-context'
import { UserProfile } from '@/components/auth/user-profile'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowLeft, User, Settings, Shield, Bell } from 'lucide-react'
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Link>
            </Button>
          </div>
          <h1 className="text-3xl font-bold text-slate-900">Profile Settings</h1>
          <p className="text-slate-600 mt-2">
            Manage your account settings and preferences
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main Profile Section */}
          <div className="lg:col-span-2">
            <UserProfile />
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Stats */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Account Stats
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-600">Member since</span>
                  <span className="text-sm font-medium">
                    {new Date(user.created_at).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-600">Account type</span>
                  <span className="text-sm font-medium">Free</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-600">Last login</span>
                  <span className="text-sm font-medium">
                    {user.last_sign_in_at 
                      ? new Date(user.last_sign_in_at).toLocaleDateString()
                      : 'Never'
                    }
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>
                  Common account tasks
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button variant="outline" className="w-full justify-start" asChild>
                  <Link href="/settings">
                    <Settings className="h-4 w-4 mr-2" />
                    App Settings
                  </Link>
                </Button>
                <Button variant="outline" className="w-full justify-start" asChild>
                  <Link href="/notifications">
                    <Bell className="h-4 w-4 mr-2" />
                    Notifications
                  </Link>
                </Button>
                <Button variant="outline" className="w-full justify-start" asChild>
                  <Link href="/security">
                    <Shield className="h-4 w-4 mr-2" />
                    Security
                  </Link>
                </Button>
              </CardContent>
            </Card>

            {/* Upgrade Card */}
            <Card className="bg-gradient-to-br from-blue-50 to-purple-50 border-blue-200">
              <CardHeader>
                <CardTitle className="text-blue-900">Upgrade to Pro</CardTitle>
                <CardDescription className="text-blue-700">
                  Unlock advanced features and analytics
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="text-sm text-blue-800 space-y-2 mb-4">
                  <li>• Advanced analytics & insights</li>
                  <li>• Real-time notifications</li>
                  <li>• Custom dashboards</li>
                  <li>• Priority support</li>
                </ul>
                <Button className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                  Upgrade Now
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
