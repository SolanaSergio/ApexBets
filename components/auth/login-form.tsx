"use client"

import { useState } from 'react'
import { useAuth } from '@/lib/auth/auth-context'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Eye, EyeOff, Sparkles } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { AuthLoading } from '@/components/ui/enhanced-loading'

export function LoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const { signIn } = useAuth()
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    if (!email || !password) {
      setError('Please fill in all fields')
      setLoading(false)
      return
    }

    const { error: signInError } = await signIn(email, password)
    
    if (signInError) {
      setError(signInError.message)
      setLoading(false)
    } else {
      // Small delay to show loading state
      setTimeout(() => {
        router.push('/')
      }, 500)
    }
  }

  // Show loading state
  if (loading) {
    return <AuthLoading step="signing-in" />
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <Alert variant="destructive" className="animate-fade-in">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-2 animate-fade-in">
        <Label htmlFor="email" className="text-sm font-medium text-slate-700">Email</Label>
        <Input
          id="email"
          type="email"
          placeholder="Enter your email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="h-11 transition-all duration-200 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
        />
      </div>

      <div className="space-y-2 animate-fade-in">
        <Label htmlFor="password" className="text-sm font-medium text-slate-700">Password</Label>
        <div className="relative">
          <Input
            id="password"
            type={showPassword ? 'text' : 'password'}
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="h-11 pr-10 transition-all duration-200 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
          />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent transition-colors duration-200"
            onClick={() => setShowPassword(!showPassword)}
          >
            {showPassword ? (
              <EyeOff className="h-4 w-4 text-slate-500" />
            ) : (
              <Eye className="h-4 w-4 text-slate-500" />
            )}
          </Button>
        </div>
      </div>

      <div className="flex items-center justify-between animate-fade-in">
        <div className="flex items-center space-x-2">
          <input
            id="remember"
            type="checkbox"
            className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 transition-colors duration-200"
          />
          <Label htmlFor="remember" className="text-sm text-slate-600">
            Remember me
          </Label>
        </div>
        <Button
          type="button"
          variant="link"
          className="p-0 h-auto text-sm text-emerald-600 hover:text-emerald-800 transition-colors duration-200"
          onClick={() => router.push('/login?tab=forgot')}
        >
          Forgot password?
        </Button>
      </div>

      <Button
        type="submit"
        className="w-full h-11 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white font-medium transition-all duration-300 hover:scale-[1.02] hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
        disabled={loading}
      >
        <span className="flex items-center justify-center">
          <Sparkles className="mr-2 h-4 w-4" />
          Sign in
        </span>
      </Button>

      <div className="text-center text-sm text-slate-600">
        Don't have an account?{' '}
        <Button
          type="button"
          variant="link"
          className="p-0 h-auto text-emerald-600 hover:text-emerald-800"
          onClick={() => router.push('/login?tab=signup')}
        >
          Sign up
        </Button>
      </div>
    </form>
  )
}
