/**
 * SEASON MANAGER
 * Dynamic season management for all sports
 * Replaces hardcoded season years with dynamic calculation
 */

export interface SeasonInfo {
  current: string
  available: string[]
  startDate: Date
  endDate: Date
}

export class SeasonManager {
  /**
   * Get current season for a specific sport
   */
  static async getCurrentSeason(sport: string): Promise<string> {
    try {
      // Get season configuration from database
      const { createClient } = await import('@/lib/supabase/client')
      const supabase = createClient()

      const response = await supabase
        ?.from('sports')
        .select('name, season_start_month, season_format')
        .eq('name', sport)
        .eq('is_active', true)
        .single()

      if (response && !response.error && response.data) {
        const seasonConfig = response.data
        const now = new Date()
        const year = now.getFullYear()
        const month = now.getMonth() + 1

        if (seasonConfig.season_format === 'year-year') {
          // For sports with year-year format (basketball, football, hockey)
          return month >= (seasonConfig.season_start_month || 8)
            ? `${year}-${(year + 1).toString().slice(-2)}`
            : `${year - 1}-${year.toString().slice(-2)}`
        } else {
          // For sports with single year format (baseball, soccer)
          return year.toString()
        }
      }
    } catch (error) {
      console.warn(`Failed to get season configuration for ${sport}:`, error)
    }

    // Fallback to current year
    return new Date().getFullYear().toString()
  }

  /**
   * Get available seasons for a specific sport
   */
  static async getAvailableSeasons(sport: string, yearsBack: number = 3): Promise<string[]> {
    const current = await this.getCurrentSeason(sport)
    const seasons = [current]

    const currentYear = new Date().getFullYear()

    try {
      // Get season format from database
      const { createClient } = await import('@/lib/supabase/client')
      const supabase = createClient()

      const response = await supabase
        ?.from('sports')
        .select('name, season_format')
        .eq('name', sport)
        .eq('is_active', true)
        .single()

      const seasonFormat = response?.data?.season_format || 'year'

      for (let i = 1; i <= yearsBack; i++) {
        if (seasonFormat === 'year-year') {
          seasons.push(`${currentYear - i}-${(currentYear - i + 1).toString().slice(-2)}`)
        } else {
          seasons.push((currentYear - i).toString())
        }
      }
    } catch (error) {
      console.warn(`Failed to get season format for ${sport}:`, error)
      // Fallback to year-year format
      for (let i = 1; i <= yearsBack; i++) {
        seasons.push(`${currentYear - i}-${(currentYear - i + 1).toString().slice(-2)}`)
      }
    }

    return seasons.sort().reverse() // Most recent first
  }

  /**
   * Get season information including dates
   */
  static async getSeasonInfo(sport: string, season: string): Promise<SeasonInfo> {
    const available = await this.getAvailableSeasons(sport)
    const current = await this.getCurrentSeason(sport)

    // Calculate season dates based on sport configuration
    let startDate: Date
    let endDate: Date

    try {
      // Get sport configuration from database
      const { createClient } = await import('@/lib/supabase/client')
      const supabase = createClient()

      const response = await supabase
        ?.from('sports')
        .select('name, season_start_month, season_end_month')
        .eq('name', sport)
        .eq('is_active', true)
        .single()

      const seasonConfig = response?.data

      if (season.includes('-')) {
        // Format: 2024-25
        const [startYear, endYear] = season.split('-')
        const fullStartYear = parseInt('20' + startYear)
        const fullEndYear = parseInt('20' + endYear)

        const startMonth = seasonConfig?.season_start_month || 0
        const endMonth = seasonConfig?.season_end_month || 11

        startDate = new Date(fullStartYear, startMonth, 1)
        endDate = new Date(fullEndYear, endMonth, 31)
      } else {
        // Format: 2024
        const year = parseInt(season)
        const startMonth = seasonConfig?.season_start_month || 0
        const endMonth = seasonConfig?.season_end_month || 11

        startDate = new Date(year, startMonth, 1)
        endDate = new Date(year, endMonth, 31)
      }
    } catch (error) {
      console.warn(`Failed to get season configuration for ${sport}:`, error)
      // Fallback to default dates
      if (season.includes('-')) {
        const [startYear, endYear] = season.split('-')
        const fullStartYear = parseInt('20' + startYear)
        const fullEndYear = parseInt('20' + endYear)
        startDate = new Date(fullStartYear, 0, 1)
        endDate = new Date(fullEndYear, 11, 31)
      } else {
        const year = parseInt(season)
        startDate = new Date(year, 0, 1)
        endDate = new Date(year, 11, 31)
      }
    }

    return {
      current,
      available,
      startDate,
      endDate,
    }
  }

  /**
   * Check if a season is currently active
   */
  static async isSeasonActive(sport: string, season: string): Promise<boolean> {
    const now = new Date()
    const seasonInfo = await this.getSeasonInfo(sport, season)

    return now >= seasonInfo.startDate && now <= seasonInfo.endDate
  }

  /**
   * Get the next upcoming season
   */
  static async getNextSeason(sport: string): Promise<string> {
    const current = await this.getCurrentSeason(sport)
    const available = await this.getAvailableSeasons(sport, 1)

    // Find current season index and return next one
    const currentIndex = available.indexOf(current)
    if (currentIndex > 0) {
      return available[currentIndex - 1]
    }

    // If current is the latest, generate next season
    const currentYear = new Date().getFullYear()

    try {
      // Get season format from database
      const { createClient } = await import('@/lib/supabase/client')
      const supabase = createClient()

      const response = await supabase
        ?.from('sports')
        .select('name, season_format')
        .eq('name', sport)
        .eq('is_active', true)
        .single()

      const seasonFormat = response?.data?.season_format || 'year'

      if (seasonFormat === 'year-year') {
        return `${currentYear + 1}-${(currentYear + 2).toString().slice(-2)}`
      } else {
        return (currentYear + 1).toString()
      }
    } catch (error) {
      console.warn(`Failed to get season format for ${sport}:`, error)
      // Fallback to year-year format
      return `${currentYear + 1}-${(currentYear + 2).toString().slice(-2)}`
    }
  }

  /**
   * Get previous season for comparison
   */
  static getPreviousSeason(_sport: string, currentSeason: string): string {
    // const now = new Date()
    // const year = now.getFullYear()
    // const month = now.getMonth() + 1

    // For sports with year-year format (basketball, football, hockey)
    if (currentSeason.includes('-')) {
      const [startYear, endYear] = currentSeason.split('-')
      const prevStartYear = parseInt(startYear) - 1
      const prevEndYear = parseInt(endYear) - 1
      return `${prevStartYear}-${prevEndYear.toString().slice(-2)}`
    }

    // For sports with single year format (baseball, soccer)
    const currentYear = parseInt(currentSeason)
    return (currentYear - 1).toString()
  }

  /**
   * Get season display name
   */
  static getSeasonDisplayName(_sport: string, season: string): string {
    if (season.includes('-')) {
      return `${season} Season`
    } else {
      return `${season} Season`
    }
  }

  /**
   * Validate if a season is valid for a sport
   */
  static async isValidSeason(sport: string, season: string): Promise<boolean> {
    const available = await this.getAvailableSeasons(sport, 5) // Check more years back
    return available.includes(season)
  }
}
