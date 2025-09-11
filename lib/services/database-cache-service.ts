/**
 * DATABASE CACHE SERVICE
 * Supabase-based cache implementation with RLS support
 */

import { createClient } from '@/lib/supabase/server'

interface CacheEntry {
  key: string
  data: any
  expires_at: string
  data_type: string
  sport?: string
  created_at: string
  updated_at: string
}

export class DatabaseCacheService {
  private supabase: any = null;
  private disabled: boolean = false;
  private available: boolean = false;
  private initializing: Promise<void> | null = null;

  constructor() {}

  private async initialize() {
    if (this.supabase) return;
    if (this.initializing) return this.initializing;

    this.initializing = (async () => {
      try {
        this.supabase = await createClient();
        this.available = this.supabase !== null;
      } catch (error) {
        console.warn("Database cache not available:", error);
        this.available = false;
      } finally {
        this.initializing = null;
      }
    })();
    return this.initializing;
  }

  private async getClient() {
    if (!this.supabase) {
      await this.initialize();
    }
    return this.supabase;
  }

  isAvailable(): boolean {
    return this.available && !this.disabled && this.supabase !== null;
  }

  getStatus() {
    return {
      available: this.available,
      disabled: this.disabled,
      supabaseConnected: this.supabase !== null,
    };
  }

  reEnableCache() {
    this.disabled = false;
  }

  async get<T>(key: string): Promise<T | null> {
    const supabase = await this.getClient();
    if (!supabase || !this.isAvailable()) {
      return null;
    }

    try {
      const { data, error } = await supabase
        .from('cache_entries')
        .select('*')
        .eq('key', key)
        .gt('expires_at', new Date().toISOString())
        .single();

      if (error || !data) {
        return null;
      }

      return data.data as T;
    } catch (error) {
      console.warn('Database cache get error:', error);
      return null;
    }
  }

  async set<T>(
    key: string, 
    data: T, 
    ttlSeconds: number, 
    dataType: string, 
    sport?: string
  ): Promise<void> {
    const supabase = await this.getClient();
    if (!supabase || !this.isAvailable()) {
      return;
    }

    try {
      const expiresAt = new Date(Date.now() + (ttlSeconds * 1000)).toISOString();
      
      const { error } = await supabase
        .from('cache_entries')
        .upsert({
          key,
          data,
          expires_at: expiresAt,
          data_type: dataType,
          sport: sport || null,
          updated_at: new Date().toISOString(),
        });

      if (error) {
        console.warn('Database cache set error:', error);
      }
    } catch (error) {
      console.warn('Database cache set error:', error);
    }
  }

  async delete(key: string): Promise<boolean> {
    const supabase = await this.getClient();
    if (!supabase || !this.isAvailable()) {
      return false;
    }

    try {
      const { error } = await supabase
        .from('cache_entries')
        .delete()
        .eq('key', key);

      return !error;
    } catch (error) {
      console.warn('Database cache delete error:', error);
      return false;
    }
  }

  async clear(): Promise<void> {
    const supabase = await this.getClient();
    if (!supabase || !this.isAvailable()) {
      return;
    }

    try {
      await supabase
        .from('cache_entries')
        .delete()
        .neq('key', ''); // Delete all entries
    } catch (error) {
      console.warn('Database cache clear error:', error);
    }
  }

  async clearBySport(sport: string): Promise<void> {
    const supabase = await this.getClient();
    if (!supabase || !this.isAvailable()) {
      return;
    }

    try {
      await supabase
        .from('cache_entries')
        .delete()
        .eq('sport', sport);
    } catch (error) {
      console.warn('Database cache clear by sport error:', error);
    }
  }

  async getStats() {
    const supabase = await this.getClient();
    if (!supabase || !this.isAvailable()) {
      return {
        totalEntries: 0,
        totalSize: 0,
        available: false,
      };
    }

    try {
      const { data, error } = await supabase
        .from('cache_entries')
        .select('data, created_at')
        .gt('expires_at', new Date().toISOString());

      if (error || !data) {
        return {
          totalEntries: 0,
          totalSize: 0,
          available: false,
        };
      }

      const totalSize = data.reduce((size: number, entry: any) => {
        return size + JSON.stringify(entry.data).length;
      }, 0);

      return {
        totalEntries: data.length,
        totalSize,
        available: true,
      };
    } catch (error) {
      console.warn('Database cache stats error:', error);
      return {
        totalEntries: 0,
        totalSize: 0,
        available: false,
      };
    }
  }

  // Clean up expired entries
  async cleanup(): Promise<void> {
    const supabase = await this.getClient();
    if (!supabase || !this.isAvailable()) {
      return;
    }

    try {
      await supabase
        .from('cache_entries')
        .delete()
        .lt('expires_at', new Date().toISOString());
    } catch (error) {
      console.warn('Database cache cleanup error:', error);
    }
  }
}

export const databaseCacheService = new DatabaseCacheService();
