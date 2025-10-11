import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const tableName = searchParams.get('table') || 'games'

    const supabase = await createClient()

    if (!supabase) {
      return NextResponse.json({ error: 'Database connection failed' }, { status: 500 })
    }

    // Get a sample row to see what columns exist
    const { data, error } = await supabase.from(tableName).select('*').limit(1)

    if (error) {
      return NextResponse.json(
        {
          error: `Error fetching from table ${tableName}`,
          details: error,
        },
        { status: 500 }
      )
    }

    if (data && data.length > 0) {
      const row = data[0]
      const columns = Object.keys(row).map(key => ({
        name: key,
        type: typeof row[key],
        value: row[key],
        isNull: row[key] === null,
      }))

      return NextResponse.json({
        success: true,
        table: tableName,
        columns: columns,
        totalColumns: columns.length,
      })
    } else {
      return NextResponse.json({
        success: true,
        table: tableName,
        message: `No rows found in table ${tableName}`,
        columns: [],
      })
    }
  } catch (error) {
    console.error('Schema check error:', error)
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
