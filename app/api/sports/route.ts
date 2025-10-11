import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// Explicitly set runtime to suppress warnings
export const runtime = 'nodejs'

export async function GET() {
  try {
    const supabase = await createClient()

    if (!supabase) {
      return NextResponse.json({ error: 'Database connection failed' }, { status: 500 })
    }

    const { data: sports, error } = await supabase
      .from('sports')
      .select(
        `
        id,
        name,
        display_name,
        description,
        icon_url,
        color_primary,
        color_secondary,
        is_active,
        data_types,
        api_providers,
        refresh_intervals,
        rate_limits,
        season_config,
        current_season,
        created_at,
        updated_at
      `
      )
      .eq('is_active', true)
      .order('name')

    if (error) {
      console.error('Error fetching sports:', error)
      return NextResponse.json({ error: 'Failed to fetch sports' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      data: sports || [],
      meta: {
        fromCache: false,
        responseTime: 0,
        source: 'supabase',
      },
    })
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
