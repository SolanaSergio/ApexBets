import { Suspense } from 'react'
import ResetPasswordClient from './reset-password-client'

// Force dynamic rendering
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

interface ResetPasswordPageProps {
  searchParams: {
    access_token?: string
    refresh_token?: string
  }
}

export default function ResetPasswordPage({ searchParams }: ResetPasswordPageProps) {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4">
        <div className="text-white">Loading...</div>
      </div>
    }>
      <ResetPasswordClient 
        accessToken={searchParams.access_token}
        refreshToken={searchParams.refresh_token}
      />
    </Suspense>
  )
}
