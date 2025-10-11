
import { createClient } from '@/lib/supabase/server'

class DataAccessLayer {
  private static instance: DataAccessLayer

  static getInstance(): DataAccessLayer {
    if (!DataAccessLayer.instance) {
      DataAccessLayer.instance = new DataAccessLayer()
    }
    return DataAccessLayer.instance
  }

  async query(tableName: string, options: any = {}) {
    try {
      const supabase = await createClient()
      const { data, error } = await supabase
        .from(tableName)
        .select(options.select || '*')
        .match(options.match || {})
        .order(options.orderBy || 'created_at', { ascending: options.orderDirection === 'asc' })
        .range(options.offset || 0, (options.offset || 0) + (options.limit || 10) - 1)

      if (error) throw error
      return data || []
    } catch (error) {
      console.warn(`Failed to query ${tableName}:`, error)
      return []
    }
  }

  async upsert(tableName: string, data: any[]) {
    try {
      const supabase = await createClient()
      const { data: result, error } = await supabase
        .from(tableName)
        .upsert(data)

      if (error) throw error
      return result
    } catch (error) {
      console.warn(`Failed to upsert into ${tableName}:`, error)
      return null
    }
  }
}

export const dal = DataAccessLayer.getInstance()
