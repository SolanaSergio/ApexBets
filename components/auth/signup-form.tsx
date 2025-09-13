"use client"

import { useState } from 'react'
import { useAuth } from '@/lib/auth/auth-context'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Eye, EyeOff, CheckCircle, Sparkles } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { AuthLoading, ProgressSteps } from '@/components/ui/enhanced-loading'

export function SignupForm() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: ''
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)
  const { signUp } = useAuth()
  const router = useRouter()

  const steps = ['Account Details', 'Verification', 'Complete']

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }))
  }

  const validateForm = () => {
    if (!formData.email || !formData.password || !formData.confirmPassword || !formData.firstName || !formData.lastName) {
      setError('Please fill in all fields')
      return false
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match')
      return false
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long')
      return false
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(formData.email)) {
      setError('Please enter a valid email address')
      return false
    }

    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setCurrentStep(1)

    if (!validateForm()) {
      setLoading(false)
      setCurrentStep(0)
      return
    }

    // Simulate step progression
    setTimeout(() => setCurrentStep(2), 1000)

    const { error: signUpError } = await signUp(formData.email, formData.password, {
      first_name: formData.firstName,
      last_name: formData.lastName,
      full_name: `${formData.firstName} ${formData.lastName}`
    })
    
    if (signUpError) {
      setError(signUpError.message)
      setCurrentStep(0)
      setLoading(false)
    } else {
      // Show success state
      setSuccess(true)
      setCurrentStep(3)
      
      // Redirect after showing success
      setTimeout(() => {
        router.push('/')
      }, 2000)
    }
  }


  // Show loading state
  if (loading) {
    return (
      <div className="space-y-6">
        <ProgressSteps 
          currentStep={currentStep} 
          totalSteps={steps.length} 
          steps={steps}
        />
        <AuthLoading 
          step={currentStep === 3 ? 'success' : 'creating-account'}
        />
      </div>
    )
  }

  // Show success state
  if (success) {
    return (
      <div className="text-center space-y-4 py-8">
        <div className="relative inline-block">
          <CheckCircle className="h-16 w-16 text-green-500 mx-auto animate-pulse" />
          <Sparkles className="absolute -top-2 -right-2 h-6 w-6 text-yellow-400 animate-bounce" />
        </div>
        <div>
          <h3 className="text-xl font-semibold text-green-600 mb-2">
            Account Created Successfully!
          </h3>
          <p className="text-slate-600">
            Welcome to ApexBets, {formData.firstName}! Redirecting to dashboard...
          </p>
        </div>
        <div className="w-full bg-slate-200 rounded-full h-2">
          <div className="bg-gradient-to-r from-emerald-500 to-green-500 h-2 rounded-full animate-pulse" />
        </div>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <Alert variant="destructive" className="animate-fade-in">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}


      <div className="grid grid-cols-2 gap-4 animate-fade-in">
        <div className="space-y-2">
          <Label htmlFor="firstName" className="text-sm font-medium text-slate-700">First Name</Label>
          <Input
            id="firstName"
            name="firstName"
            type="text"
            placeholder="John"
            value={formData.firstName}
            onChange={handleChange}
            required
            className="h-11 transition-all duration-200 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="lastName" className="text-sm font-medium text-slate-700">Last Name</Label>
          <Input
            id="lastName"
            name="lastName"
            type="text"
            placeholder="Doe"
            value={formData.lastName}
            onChange={handleChange}
            required
            className="h-11 transition-all duration-200 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
          />
        </div>
      </div>

      <div className="space-y-2 animate-fade-in">
        <Label htmlFor="email" className="text-sm font-medium text-slate-700">Email</Label>
        <Input
          id="email"
          name="email"
          type="email"
          placeholder="john@example.com"
          value={formData.email}
          onChange={handleChange}
          required
          className="h-11 transition-all duration-200 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
        />
      </div>

      <div className="space-y-2 animate-fade-in">
        <Label htmlFor="password" className="text-sm font-medium text-slate-700">Password</Label>
        <div className="relative">
          <Input
            id="password"
            name="password"
            type={showPassword ? 'text' : 'password'}
            placeholder="Create a password"
            value={formData.password}
            onChange={handleChange}
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
        <p className="text-xs text-slate-500">
          Must be at least 6 characters long
        </p>
      </div>

      <div className="space-y-2 animate-fade-in">
        <Label htmlFor="confirmPassword" className="text-sm font-medium text-slate-700">Confirm Password</Label>
        <div className="relative">
          <Input
            id="confirmPassword"
            name="confirmPassword"
            type={showConfirmPassword ? 'text' : 'password'}
            placeholder="Confirm your password"
            value={formData.confirmPassword}
            onChange={handleChange}
            required
            className="h-11 pr-10 transition-all duration-200 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
          />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent transition-colors duration-200"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
          >
            {showConfirmPassword ? (
              <EyeOff className="h-4 w-4 text-slate-500" />
            ) : (
              <Eye className="h-4 w-4 text-slate-500" />
            )}
          </Button>
        </div>
      </div>

      <div className="flex items-start space-x-2 animate-fade-in">
        <input
          id="terms"
          type="checkbox"
          required
          className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 mt-1 transition-colors duration-200"
        />
        <Label htmlFor="terms" className="text-sm text-slate-600 leading-relaxed">
          I agree to the{' '}
          <a href="/terms" className="text-emerald-600 hover:underline transition-colors duration-200">
            Terms of Service
          </a>{' '}
          and{' '}
          <a href="/privacy" className="text-emerald-600 hover:underline transition-colors duration-200">
            Privacy Policy
          </a>
        </Label>
      </div>

      <Button
        type="submit"
        className="w-full h-11 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white font-medium transition-all duration-300 hover:scale-[1.02] hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
        disabled={loading}
      >
        <span className="flex items-center justify-center">
          <Sparkles className="mr-2 h-4 w-4" />
          Create account
        </span>
      </Button>

      <div className="text-center text-sm text-slate-600">
        Already have an account?{' '}
        <Button
          type="button"
          variant="link"
          className="p-0 h-auto text-emerald-600 hover:text-emerald-800"
          onClick={() => router.push('/login?tab=login')}
        >
          Sign in
        </Button>
      </div>
    </form>
  )
}
