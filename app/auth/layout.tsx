import { Suspense } from 'react'

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-emerald-900 to-slate-900 p-4">
        <div className="text-center space-y-4">
          <div className="h-8 w-8 animate-spin mx-auto text-blue-600 border-2 border-blue-600 border-t-transparent rounded-full" />
          <p className="text-slate-600">Loading...</p>
        </div>
      </div>
    }>
      {children}
    </Suspense>
  )
}
