"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth/auth-context'
import { LoginForm } from '@/components/auth/login-form'
import { SignupForm } from '@/components/auth/signup-form'
import { ForgotPasswordForm } from '@/components/auth/forgot-password-form'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Eye, EyeOff } from 'lucide-react'
import { SportsImage } from '@/components/ui/sports-image'

export default function LoginPage() {
  const [activeTab, setActiveTab] = useState('login')
  const [showPassword, setShowPassword] = useState(false)
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && user) {
      router.push('/')
    }
  }, [user, loading, router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
      </div>
    )
  }

  if (user) {
    return null
  }

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* Left Side - Branding & Image */}
      <div className="lg:w-1/2 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900"></div>
        <div className="absolute inset-0 bg-emerald-500/10"></div>
        
        {/* Animated Background Elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-emerald-500/20 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-emerald-400/15 rounded-full blur-3xl animate-pulse delay-1000"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-emerald-600/10 rounded-full blur-3xl animate-pulse delay-500"></div>
        </div>

        <div className="relative z-10 flex flex-col justify-center items-center h-full p-8 text-white">
          <div className="text-center space-y-6 max-w-md">
            <div className="flex justify-center">
              <div className="p-4 bg-white/10 backdrop-blur-sm rounded-2xl">
                <SportsImage 
                  src="https://images.unsplash.com/photo-1546519638-68e109498ffc?q=80&w=150&h=150&auto=format&fit=crop"
                  alt="Basketball sports icon"
                  width={64}
                  height={64}
                  className="w-16 h-16 text-white"
                  fallbackType="sports"
                />
              </div>
            </div>
            
            <div>
              <h1 className="text-4xl lg:text-5xl font-bold mb-4 bg-gradient-to-r from-white to-emerald-200 bg-clip-text text-transparent">
                ApexBets
              </h1>
              <p className="text-xl text-slate-200 mb-8">
                The Ultimate Sports Analytics Platform
              </p>
            </div>

            <div className="space-y-4 text-left">
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-emerald-400 rounded-full"></div>
                <span className="text-slate-200">Real-time sports data & analytics</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-emerald-400 rounded-full"></div>
                <span className="text-slate-200">Advanced predictions & insights</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-emerald-400 rounded-full"></div>
                <span className="text-slate-200">Multi-sport coverage & live updates</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-emerald-400 rounded-full"></div>
                <span className="text-slate-200">Professional-grade tools</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Auth Forms */}
      <div className="lg:w-1/2 flex items-center justify-center p-8 bg-slate-50">
        <div className="w-full max-w-md space-y-6">
          {/* Back to Home Button */}
          <Button
            variant="ghost"
            onClick={() => router.push('/')}
            className="mb-4 text-slate-600 hover:text-slate-900"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Button>

          {/* Auth Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3 bg-slate-100 p-1 rounded-lg">
              <TabsTrigger 
                value="login" 
                className="data-[state=active]:bg-white data-[state=active]:shadow-sm transition-all duration-200"
              >
                Login
              </TabsTrigger>
              <TabsTrigger 
                value="signup"
                className="data-[state=active]:bg-white data-[state=active]:shadow-sm transition-all duration-200"
              >
                Sign Up
              </TabsTrigger>
              <TabsTrigger 
                value="forgot"
                className="data-[state=active]:bg-white data-[state=active]:shadow-sm transition-all duration-200"
              >
                Forgot
              </TabsTrigger>
            </TabsList>

            <TabsContent value="login" className="mt-6 animate-fade-in">
              <Card className="border-0 shadow-xl transition-all duration-300 hover:shadow-2xl">
                <CardHeader className="space-y-1 pb-4">
                  <CardTitle className="text-2xl font-bold text-center bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
                    Welcome back
                  </CardTitle>
                  <CardDescription className="text-center text-slate-600">
                    Sign in to your ApexBets account
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <LoginForm />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="signup" className="mt-6 animate-fade-in">
              <Card className="border-0 shadow-xl transition-all duration-300 hover:shadow-2xl">
                <CardHeader className="space-y-1 pb-4">
                  <CardTitle className="text-2xl font-bold text-center bg-gradient-to-r from-emerald-600 to-emerald-700 bg-clip-text text-transparent">
                    Create account
                  </CardTitle>
                  <CardDescription className="text-center text-slate-600">
                    Join ApexBets and start your analytics journey
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <SignupForm />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="forgot" className="mt-6 animate-fade-in">
              <Card className="border-0 shadow-xl transition-all duration-300 hover:shadow-2xl">
                <CardHeader className="space-y-1 pb-4">
                  <CardTitle className="text-2xl font-bold text-center bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
                    Reset password
                  </CardTitle>
                  <CardDescription className="text-center text-slate-600">
                    Enter your email to receive reset instructions
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ForgotPasswordForm />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Footer */}
          <div className="text-center text-sm text-slate-500">
            <p>
              By continuing, you agree to our{' '}
              <a href="/terms" className="text-emerald-600 hover:underline">
                Terms of Service
              </a>{' '}
              and{' '}
              <a href="/privacy" className="text-emerald-600 hover:underline">
                Privacy Policy
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
