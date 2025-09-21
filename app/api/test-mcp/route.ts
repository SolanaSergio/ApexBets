import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    // Test basic Supabase connection first
    const supabase = await createClient()
    
    if (!supabase) {
      throw new Error('Supabase client initialization failed')
    }

    // Test a simple query
    const { data: sports, error: sportsError } = await supabase
      .from('sports')
      .select('name, display_name, is_active')
      .eq('is_active', true)
      .limit(5)

    if (sportsError) {
      throw new Error(`Sports query error: ${sportsError.message}`)
    }

    // Test table count
    const { count: sportsCount, error: countError } = await supabase
      .from('sports')
      .select('*', { count: 'exact', head: true })

    if (countError) {
      throw new Error(`Count query error: ${countError.message}`)
    }

    return NextResponse.json({
      success: true,
      data: {
        sports: sports || [],
        sportsCount: sportsCount || 0,
        message: 'Database connection and queries are working correctly'
      }
    })
  } catch (error) {
    console.error('Database Test Error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      message: 'Database test failed'
    }, { status: 500 })
  }
}
