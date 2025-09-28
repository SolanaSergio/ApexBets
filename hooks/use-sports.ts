/**
 * Sports Hook - Loads sports data dynamically from database
 * Replaces hardcoded SportConfigManager with real database data
 */

import { useState, useEffect } from 'react'

export interface Sport {
  id: string
  name: string
  display_name: string
  description?: string
  icon_url?: string
  color_primary?: string
  color_secondary?: string
  is_active: boolean
  data_types: string[]
  api_providers: string[]
  refresh_intervals: Record<string, number>
  rate_limits: Record<string, number>
  season_config: Record<string, any>
  current_season?: string
  created_at: string
  updated_at: string
}

export interface UseSportsReturn {
  sports: Sport[]
  loading: boolean
  error: string | null
  refreshSports: () => Promise<void>
}

export function useSports(): UseSportsReturn {
  const [sports, setSports] = useState<Sport[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchSports = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch('/api/sports')
      
      if (!response.ok) {
        throw new Error(`Failed to fetch sports: ${response.status} ${response.statusText}`)
      }
      
      const result = await response.json()
      
      // Handle both response formats: with success field and without
      let sportsData: Sport[] = []
      
      if (result.success && Array.isArray(result.data)) {
        // Format: { success: true, data: [...] }
        sportsData = result.data
      } else if (Array.isArray(result.data)) {
        // Format: { data: [...] }
        sportsData = result.data
      } else {
        throw new Error('Invalid sports data format')
      }
      
      // Filter only active sports
      const activeSports = sportsData.filter((sport: Sport) => sport.is_active)
      setSports(activeSports)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load sports'
      console.error('Error loading sports:', errorMessage)
      setError(errorMessage)
      
      // Fallback to empty array on error
      setSports([])
    } finally {
      setLoading(false)
    }
  }

  const refreshSports = async () => {
    await fetchSports()
  }

  useEffect(() => {
    fetchSports()
  }, [])

  return {
    sports,
    loading,
    error,
    refreshSports
  }
}

// Hook for getting a specific sport by name
export function useSport(sportName: string): Sport | null {
  const { sports } = useSports()
  return sports.find(sport => sport.name === sportName) || null
}

// Hook for getting active sports only
export function useActiveSports(): Sport[] {
  const { sports } = useSports()
  return sports.filter(sport => sport.is_active)
}
