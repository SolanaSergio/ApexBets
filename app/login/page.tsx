'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth/auth-context'
import { LoginForm } from '@/components/auth/login-form'
import { SignupForm } from '@/components/auth/signup-form'
import { ForgotPasswordForm } from '@/components/auth/forgot-password-form'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Zap, TrendingUp, Activity, Target } from 'lucide-react'

export default function LoginPage() {
  const [activeTab, setActiveTab] = useState('login')
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && user) {
      router.push('/')
    }
  }, [user, loading, router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center space-y-6">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-primary/30 border-t-primary"></div>
            <div className="absolute inset-0 rounded-full bg-primary/10 animate-pulse"></div>
          </div>
          <div className="text-center space-y-2">
            <h2 className="text-xl font-semibold text-foreground">Loading Apex</h2>
            <p className="text-muted-foreground">Preparing your analytics dashboard...</p>
          </div>
        </div>
      </div>
    )
  }

  if (user) {
    return null
  }

  return (
    <div className="min-h-screen flex flex-col xl:flex-row bg-background">
      {/* Hero Section - Modern Clean Design */}
      <div className="xl:w-1/2 flex flex-col justify-center items-center px-8 py-16 xl:min-h-screen bg-card relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-20 left-20 w-32 h-32 rounded-full bg-primary blur-3xl"></div>
          <div className="absolute bottom-20 right-20 w-40 h-40 rounded-full bg-accent blur-3xl"></div>
          <div className="absolute top-1/2 left-1/2 w-48 h-48 rounded-full bg-secondary blur-3xl transform -translate-x-1/2 -translate-y-1/2"></div>
        </div>

        <div className="relative z-10 text-center space-y-8 max-w-2xl w-full">
          {/* Logo Section */}
          <div className="flex justify-center">
            <div className="p-6 bg-primary/5 rounded-2xl border border-border shadow-lg">
              <div className="w-20 h-20 bg-gradient-to-r from-primary to-accent rounded-xl flex items-center justify-center">
                <Activity className="w-12 h-12 text-primary-foreground" />
              </div>
            </div>
          </div>

          {/* Heading */}
          <div className="space-y-4">
            <h1 className="text-5xl xl:text-7xl font-bold bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent leading-tight">
              Apex Analytics
            </h1>
            <p className="text-2xl xl:text-3xl text-muted-foreground font-medium max-w-xl mx-auto leading-relaxed">
              Advanced Sports Intelligence Platform
            </p>
            <p className="text-lg text-muted-foreground max-w-xl mx-auto leading-relaxed">
              Transform data into decisions with AI-powered insights, real-time analytics, and
              professional-grade tools.
            </p>
          </div>

          {/* Feature Grid */}
          <div className="grid grid-cols-2 gap-4 max-w-lg mx-auto">
            <div className="flex flex-col items-center p-6 bg-card border border-border rounded-xl shadow-sm hover:shadow-lg transition-all duration-200 group">
              <div className="w-12 h-12 bg-gradient-to-r from-primary to-accent rounded-lg flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                <Zap className="w-6 h-6 text-primary-foreground" />
              </div>
              <h3 className="font-semibold text-foreground text-sm">Real-time Data</h3>
            </div>
            <div className="flex flex-col items-center p-6 bg-card border border-border rounded-xl shadow-sm hover:shadow-lg transition-all duration-200 group">
              <div className="w-12 h-12 bg-gradient-to-r from-accent to-secondary rounded-lg flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                <TrendingUp className="w-6 h-6 text-accent-foreground" />
              </div>
              <h3 className="font-semibold text-foreground text-sm">AI Insights</h3>
            </div>
            <div className="flex flex-col items-center p-6 bg-card border border-border rounded-xl shadow-sm hover:shadow-lg transition-all duration-200 group">
              <div className="w-12 h-12 bg-gradient-to-r from-secondary to-primary rounded-lg flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                <Activity className="w-6 h-6 text-secondary-foreground" />
              </div>
              <h3 className="font-semibold text-foreground text-sm">Live Updates</h3>
            </div>
            <div className="flex flex-col items-center p-6 bg-card border border-border rounded-xl shadow-sm hover:shadow-lg transition-all duration-200 group">
              <div className="w-12 h-12 bg-gradient-to-r from-destructive to-accent rounded-lg flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                <Target className="w-6 h-6 text-destructive-foreground" />
              </div>
              <h3 className="font-semibold text-foreground text-sm">Pro Tools</h3>
            </div>
          </div>
        </div>
      </div>

      {/* Auth Section - Clean Modern Design */}
      <div className="xl:w-1/2 flex items-center justify-center px-8 py-16 bg-muted xl:min-h-screen">
        <div className="w-full max-w-md space-y-8">
          {/* Header */}
          <div className="text-center space-y-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push('/')}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Home
            </Button>
            <h2 className="text-3xl font-bold text-foreground">Welcome to Apex</h2>
            <p className="text-muted-foreground">Sign in to access your analytics dashboard</p>
          </div>

          {/* Auth Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-8 bg-muted">
              <TabsTrigger
                value="login"
                className="data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all duration-200"
              >
                Sign In
              </TabsTrigger>
              <TabsTrigger
                value="signup"
                className="data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all duration-200"
              >
                Sign Up
              </TabsTrigger>
              <TabsTrigger
                value="forgot"
                className="data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all duration-200"
              >
                Reset
              </TabsTrigger>
            </TabsList>

            {/* Forms */}
            <TabsContent value="login" className="space-y-6">
              <Card className="border-0 shadow-xl bg-card">
                <CardHeader className="space-y-2">
                  <CardTitle className="text-2xl font-bold text-foreground">Sign In</CardTitle>
                  <CardDescription className="text-muted-foreground">
                    Enter your credentials to access your account
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <LoginForm />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="signup" className="space-y-6">
              <Card className="border-0 shadow-xl bg-card">
                <CardHeader className="space-y-2">
                  <CardTitle className="text-2xl font-bold text-foreground">
                    Create Account
                  </CardTitle>
                  <CardDescription className="text-muted-foreground">
                    Join thousands of sports analytics professionals
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <SignupForm />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="forgot" className="space-y-6">
              <Card className="border-0 shadow-xl bg-card">
                <CardHeader className="space-y-2">
                  <CardTitle className="text-2xl font-bold text-foreground">
                    Reset Password
                  </CardTitle>
                  <CardDescription className="text-muted-foreground">
                    We'll send you a reset link to get back in
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ForgotPasswordForm />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Footer */}
          <div className="text-center text-sm text-muted-foreground">
            <p>
              By continuing, you agree to our{' '}
              <a
                href="/terms"
                className="text-primary hover:text-primary/80 font-medium transition-colors"
              >
                Terms
              </a>{' '}
              and{' '}
              <a
                href="/privacy"
                className="text-primary hover:text-primary/80 font-medium transition-colors"
              >
                Privacy Policy
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
