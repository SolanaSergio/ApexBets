"use client"

import { useEffect } from 'react'

export function SyncInitializer() {
  useEffect(() => {
    // Initialize sync service on client side
    const initializeSync = async () => {
      try {
        const response = await fetch('/api/sync?action=start', {
          method: 'GET'
        })
        
        if (response.ok) {
          console.log('Data sync service initialized')
        }
      } catch (error) {
        console.error('Failed to initialize sync service:', error)
      }
    }

    // Only initialize in production or when explicitly enabled
    if (process.env.NODE_ENV === 'production' || process.env.NEXT_PUBLIC_ENABLE_SYNC === 'true') {
      initializeSync()
    }
  }, [])

  return null // This component doesn't render anything
}
