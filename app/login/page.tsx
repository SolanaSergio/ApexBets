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
import { ArrowLeft } from 'lucide-react'
import { SportsImage } from '@/components/ui/sports-image'

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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-white via-cyan-50/30 to-purple-50/30">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-emerald-200 border-t-emerald-500"></div>
          <p className="text-gray-600 font-medium">Loading Project Apex...</p>
        </div>
      </div>
    )
  }

  if (user) {
    return null
  }

  return (
    <div className="min-h-screen flex flex-col lg:flex-row overflow-hidden bg-gradient-to-br from-white via-cyan-50/30 to-purple-50/30 bright-pattern">
      {/* Left Side - Enhanced Mobile-First Branding */}
      <div className="lg:w-1/2 relative overflow-hidden min-h-[35vh] sm:min-h-[40vh] lg:min-h-screen">
        <div className="absolute inset-0 bg-gradient-to-br from-cyan-100/80 via-white to-purple-100/80"></div>
        <div className="absolute inset-0 bg-gradient-to-tr from-cyan-200/40 via-transparent to-purple-200/40"></div>

        {/* Optimized Mobile Background Elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-20 sm:-top-40 -right-20 sm:-right-40 w-40 sm:w-80 h-40 sm:h-80 bg-gradient-to-br from-cyan-300/40 to-blue-400/30 rounded-lg blur-3xl bright-float"></div>
          <div className="absolute -bottom-20 sm:-bottom-40 -left-20 sm:-left-40 w-40 sm:w-80 h-40 sm:h-80 bg-gradient-to-br from-purple-300/40 to-indigo-400/30 rounded-lg blur-3xl bright-float-delay-1"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-48 sm:w-96 h-48 sm:h-96 bg-gradient-to-br from-cyan-200/30 to-purple-200/30 rounded-lg blur-3xl bright-float-delay-2"></div>
          <div className="absolute top-10 sm:top-20 left-10 sm:left-20 w-16 sm:w-32 h-16 sm:h-32 bg-cyan-300/30 rounded-lg blur-2xl animate-pulse"></div>
          <div className="absolute bottom-10 sm:bottom-20 right-10 sm:right-20 w-12 sm:w-24 h-12 sm:h-24 bg-purple-300/30 rounded-lg blur-xl animate-pulse delay-700"></div>
          <div className="absolute top-1/3 right-1/4 w-8 sm:w-16 h-8 sm:h-16 bg-blue-400/20 rounded-lg blur-lg animate-pulse delay-300"></div>
          <div className="absolute bottom-1/3 left-1/4 w-10 sm:w-20 h-10 sm:h-20 bg-indigo-400/20 rounded-lg blur-lg animate-pulse delay-900"></div>
        </div>

        <div className="relative z-10 flex flex-col justify-center items-center h-full p-3 sm:p-4 lg:p-8">
          <div className="text-center space-y-4 sm:space-y-6 lg:space-y-8 max-w-lg w-full">
            <div className="flex justify-center animate-scale-in">
              <div className="p-4 sm:p-6 lg:p-8 bg-white/90 backdrop-blur-sm rounded-lg border-2 border-cyan-200/50 shadow-2xl shadow-cyan-500/10 bright-glow">
                <SportsImage
                  src="https://images.unsplash.com/photo-1546519638-68e109498ffc?q=80&w=150&h=150&auto=format&fit=crop"
                  alt="Basketball sports icon"
                  width={80}
                  height={80}
                  className="w-16 h-16 sm:w-20 sm:h-20 lg:w-24 lg:h-24 text-cyan-500"
                  fallbackType="sports"
                />
              </div>
            </div>

            <div className="space-y-3 sm:space-y-4 lg:space-y-6 animate-slide-in-up px-2">
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold bright-gradient-text leading-tight">
                Project Apex
              </h1>
              <p className="text-lg sm:text-xl md:text-2xl lg:text-3xl text-gray-700 font-semibold leading-relaxed">
                The Ultimate Sports Analytics Platform
              </p>
              <p className="text-sm sm:text-base text-gray-600 max-w-md mx-auto leading-relaxed">
                Powered by advanced AI and real-time data to give you the edge in sports analytics
              </p>
            </div>

            <div className="space-y-3 sm:space-y-4 text-left animate-slide-in-up">
              <div className="flex items-center space-x-3 sm:space-x-4 group bright-feature-card p-2.5 sm:p-3 rounded-xl min-h-[44px] touch-manipulation">
                <div className="w-3.5 sm:w-4 h-3.5 sm:h-4 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-sm group-hover:scale-125 transition-transform shadow-lg flex-shrink-0"></div>
                <span className="text-gray-700 font-semibold text-sm sm:text-base">Real-time sports data & analytics</span>
              </div>
              <div className="flex items-center space-x-3 sm:space-x-4 group bright-feature-card p-2.5 sm:p-3 rounded-xl min-h-[44px] touch-manipulation">
                <div className="w-3.5 sm:w-4 h-3.5 sm:h-4 bg-gradient-to-r from-purple-500 to-indigo-600 rounded-sm group-hover:scale-125 transition-transform shadow-lg flex-shrink-0"></div>
                <span className="text-gray-700 font-semibold text-sm sm:text-base">Advanced AI predictions & insights</span>
              </div>
              <div className="flex items-center space-x-3 sm:space-x-4 group bright-feature-card p-2.5 sm:p-3 rounded-xl min-h-[44px] touch-manipulation">
                <div className="w-3.5 sm:w-4 h-3.5 sm:h-4 bg-gradient-to-r from-green-500 to-emerald-600 rounded-sm group-hover:scale-125 transition-transform shadow-lg flex-shrink-0"></div>
                <span className="text-gray-700 font-semibold text-sm sm:text-base">Multi-sport coverage & live updates</span>
              </div>
              <div className="flex items-center space-x-3 sm:space-x-4 group bright-feature-card p-2.5 sm:p-3 rounded-xl min-h-[44px] touch-manipulation">
                <div className="w-3.5 sm:w-4 h-3.5 sm:h-4 bg-gradient-to-r from-blue-500 to-cyan-600 rounded-sm group-hover:scale-125 transition-transform shadow-lg flex-shrink-0"></div>
                <span className="text-gray-700 font-semibold text-sm sm:text-base">Professional-grade analytics tools</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Enhanced Mobile-First Auth Forms */}
      <div className="lg:w-1/2 flex items-center justify-center p-3 sm:p-4 lg:p-8 bg-gradient-to-bl from-white via-cyan-50/20 to-purple-50/20 relative min-h-[65vh] lg:min-h-screen">
        <div className="absolute inset-0 bg-gradient-to-bl from-cyan-100/30 via-white/50 to-purple-100/30"></div>
        <div className="w-full max-w-lg space-y-3 sm:space-y-4 lg:space-y-6 relative z-10">
          {/* Enhanced Back to Home Button */}
          <Button
            variant="ghost"
            onClick={() => router.push('/')}
            className="mb-4 sm:mb-6 text-gray-600 hover:text-gray-800 hover:bg-white/60 hover:scale-105 transition-all duration-200 backdrop-blur-sm min-h-[44px] touch-manipulation"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            <span className="text-sm sm:text-base">Back to Home</span>
          </Button>

          {/* Auth Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3 bg-white/80 backdrop-blur-sm p-1 rounded-xl border border-cyan-200/30 shadow-lg">
              <TabsTrigger
                value="login"
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-cyan-500 data-[state=active]:to-blue-600 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-300 text-gray-700 font-medium"
              >
                Login
              </TabsTrigger>
              <TabsTrigger
                value="signup"
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-indigo-600 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-300 text-gray-700 font-medium"
              >
                Sign Up
              </TabsTrigger>
              <TabsTrigger
                value="forgot"
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-500 data-[state=active]:to-emerald-600 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-300 text-gray-700 font-medium"
              >
                Forgot
              </TabsTrigger>
            </TabsList>

            <TabsContent value="login" className="mt-8 animate-scale-in">
              <Card className="bright-card bright-glow transition-all duration-300 hover:shadow-3xl hover:border-cyan-300/60">
                <CardHeader className="space-y-3 pb-6">
                  <CardTitle className="text-3xl font-bold text-center bg-gradient-to-r from-cyan-600 to-blue-500 bg-clip-text text-transparent">
                    Welcome back
                  </CardTitle>
                  <CardDescription className="text-center text-gray-600 text-lg font-medium">
                    Sign in to your Project Apex account
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <LoginForm />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="signup" className="mt-8 animate-scale-in">
              <Card className="bright-card bright-glow-cyan transition-all duration-300 hover:shadow-3xl hover:border-cyan-300/60">
                <CardHeader className="space-y-3 pb-6">
                  <CardTitle className="text-3xl font-bold text-center bg-gradient-to-r from-cyan-600 to-cyan-500 bg-clip-text text-transparent">
                    Create account
                  </CardTitle>
                  <CardDescription className="text-center text-gray-600 text-lg font-medium">
                    Join Project Apex and start your analytics journey
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <SignupForm />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="forgot" className="mt-8 animate-scale-in">
              <Card className="bright-card shadow-2xl transition-all duration-300 hover:shadow-3xl hover:border-gray-300/60">
                <CardHeader className="space-y-3 pb-6">
                  <CardTitle className="text-3xl font-bold text-center bg-gradient-to-r from-gray-700 to-gray-600 bg-clip-text text-transparent">
                    Reset password
                  </CardTitle>
                  <CardDescription className="text-center text-gray-600 text-lg font-medium">
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
          <div className="text-center text-sm text-gray-600 bg-white/60 backdrop-blur-sm rounded-xl p-4 border border-gray-200/30">
            <p>
              By continuing, you agree to our{' '}
              <a href="/terms" className="text-cyan-600 hover:text-cyan-700 hover:underline font-medium transition-colors">
                Terms of Service
              </a>{' '}
              and{' '}
              <a href="/privacy" className="text-cyan-600 hover:text-cyan-700 hover:underline font-medium transition-colors">
                Privacy Policy
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
