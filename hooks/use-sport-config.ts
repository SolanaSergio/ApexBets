import { useState, useEffect } from 'react'
import { SportConfigManager } from '@/lib/services/core/sport-config'

export function useSportConfig(sport?: string) {
  const [config, setConfig] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadConfig() {
      try {
        setLoading(true)
        setError(null)
        
        if (sport) {
          const sportConfig = await SportConfigManager.getSportConfig(sport)
          setConfig(sportConfig)
        } else {
          const allConfigs = await SportConfigManager.getAllSportConfigs()
          setConfig(allConfigs)
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load sport config')
        setConfig(null)
      } finally {
        setLoading(false)
      }
    }

    loadConfig()
  }, [sport])

  return { config, loading, error }
}

export function useSportConfigs() {
  const [configs, setConfigs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadConfigs() {
      try {
        setLoading(true)
        setError(null)
        
        const allConfigs = await SportConfigManager.getAllSportConfigs()
        setConfigs(allConfigs)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load sport configs')
        setConfigs([])
      } finally {
        setLoading(false)
      }
    }

    loadConfigs()
  }, [])

  return { configs, loading, error }
}
