"use client"

import { useState } from 'react'
import { useAuth } from '@/lib/auth/auth-context'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, CheckCircle, ArrowLeft } from 'lucide-react'
import { useRouter } from 'next/navigation'

export function ForgotPasswordForm() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const { resetPassword } = useAuth()
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    if (!email) {
      setError('Please enter your email address')
      setLoading(false)
      return
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address')
      setLoading(false)
      return
    }

    const { error: resetError } = await resetPassword(email)
    
    if (resetError) {
      setError(resetError.message)
    } else {
      setSuccess(true)
    }
    
    setLoading(false)
  }

  if (success) {
    return (
      <div className="text-center space-y-4">
        <div className="flex justify-center">
          <CheckCircle className="h-16 w-16 text-green-500" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-slate-900">Check your email</h3>
          <p className="text-sm text-slate-600 mt-2">
            We've sent you a password reset link at <strong>{email}</strong>
          </p>
          <p className="text-xs text-slate-500 mt-2">
            Didn't receive the email? Check your spam folder or try again.
          </p>
        </div>
        <div className="flex flex-col space-y-2">
          <Button
            variant="outline"
            onClick={() => {
              setSuccess(false)
              setEmail('')
            }}
            className="w-full"
          >
            Try another email
          </Button>
          <Button
            variant="ghost"
            onClick={() => router.push('/login?tab=login')}
            className="w-full"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to login
          </Button>
        </div>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="text-center space-y-2 mb-6">
        <p className="text-sm text-slate-600">
          Enter your email address and we'll send you a link to reset your password.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          placeholder="Enter your email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="h-11"
        />
      </div>

      <Button
        type="submit"
        className="w-full h-11 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white font-medium"
        disabled={loading}
      >
        {loading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Sending reset link...
          </>
        ) : (
          'Send reset link'
        )}
      </Button>

      <div className="text-center text-sm text-slate-600">
        Remember your password?{' '}
        <Button
          type="button"
          variant="link"
          className="p-0 h-auto text-blue-600 hover:text-blue-800"
          onClick={() => router.push('/login?tab=login')}
        >
          Sign in
        </Button>
      </div>
    </form>
  )
}
