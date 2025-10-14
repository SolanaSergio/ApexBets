import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient()
    if (!supabase) {
      return NextResponse.json({ success: false, error: 'Supabase init failed' }, { status: 500 })
    }

    const body = await request.json().catch(() => ({}))
    const { sport, grace_window_minutes } = body as {
      sport?: string
      grace_window_minutes?: number
    }

    if (!sport || typeof grace_window_minutes !== 'number') {
      return NextResponse.json(
        { success: false, error: 'sport and grace_window_minutes are required' },
        { status: 400 }
      )
    }

    const { error } = await supabase
      .from('sports')
      .update({ grace_window_minutes })
      .eq('name', sport)

    if (error) {
      return NextResponse.json(
        { success: false, error: `Failed to update: ${error.message}` },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}

export async function GET() {
  try {
    const supabase = await createClient()
    if (!supabase) {
      return NextResponse.json({ success: false, error: 'Supabase init failed' }, { status: 500 })
    }
    const { data, error } = await supabase
      .from('sports')
      .select('name, display_name, grace_window_minutes')
      .order('name')
    if (error) {
      return NextResponse.json(
        { success: false, error: `Failed to fetch: ${error.message}` },
        { status: 500 }
      )
    }
    return NextResponse.json({ success: true, data })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}


