import { type NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const supabase = await createClient()
    if (!supabase) {
      return NextResponse.json({ error: 'Supabase client initialization failed' }, { status: 500 })
    }
    const body = await request.json()
    const { id: alertId } = await params

    const { data: alert, error } = await supabase
      .from('user_alerts')
      .update({
        enabled: body.enabled,
        updated_at: new Date().toISOString(),
      })
      .eq('id', alertId)
      .select(
        `
        *,
        team:teams(id, name, abbreviation)
      `
      )
      .single()

    if (error) {
      console.error('Error updating alert:', error)
      return NextResponse.json({ error: 'Failed to update alert' }, { status: 500 })
    }

    return NextResponse.json({ alert })
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const supabase = await createClient()
    if (!supabase) {
      return NextResponse.json({ error: 'Supabase client initialization failed' }, { status: 500 })
    }

    const { id: alertId } = await params
    const { error } = await supabase.from('user_alerts').delete().eq('id', alertId)

    if (error) {
      console.error('Error deleting alert:', error)
      return NextResponse.json({ error: 'Failed to delete alert' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
