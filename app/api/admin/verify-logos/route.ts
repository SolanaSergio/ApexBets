import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const sport = url.searchParams.get('sport')

    // Call the verify-images Edge Function
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json(
        { success: false, error: 'Missing Supabase configuration' },
        { status: 500 }
      )
    }

    const functionUrl = `${supabaseUrl}/functions/v1/verify-images${sport ? `?sport=${sport}` : ''}`

    const response = await fetch(functionUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${supabaseServiceKey}`,
        'Content-Type': 'application/json',
      },
    })

    const result = await response.json()

    if (!response.ok) {
      return NextResponse.json(
        { success: false, error: result.error || 'Failed to verify logos' },
        { status: response.status }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Logo verification completed successfully',
      data: result,
    })
  } catch (error) {
    console.error('Error triggering logo verification:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to trigger logo verification',
      },
      { status: 500 }
    )
  }
}
