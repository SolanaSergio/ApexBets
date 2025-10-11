import { NextRequest, NextResponse } from 'next/server'
import { imageMonitoringService } from '@/lib/services/image-monitoring-service'

export async function POST(request: NextRequest) {
  try {
    // Check content-type header
    const contentType = request.headers.get('content-type')
    if (!contentType || !contentType.includes('application/json')) {
      return NextResponse.json(
        { success: false, error: 'Content-Type must be application/json' },
        { status: 400 }
      )
    }

    // Check if request has a body
    const contentLength = request.headers.get('content-length')
    if (!contentLength || contentLength === '0') {
      return NextResponse.json({ success: false, error: 'Request body is empty' }, { status: 400 })
    }

    // Parse JSON with error handling
    let body: any
    try {
      body = await request.json()
    } catch (parseError) {
      console.error('JSON parse error:', parseError)
      return NextResponse.json(
        { success: false, error: 'Invalid JSON in request body' },
        { status: 400 }
      )
    }

    // Validate body is an object
    if (!body || typeof body !== 'object') {
      return NextResponse.json(
        { success: false, error: 'Request body must be a JSON object' },
        { status: 400 }
      )
    }

    // Validate required fields
    const { entityType, entityName, source, success, sport, url, error, loadTime } = body

    if (!entityType || !entityName || !source || success === undefined) {
      return NextResponse.json(
        {
          success: false,
          error:
            'Missing required fields: entityType, entityName, source, and success are required',
        },
        { status: 400 }
      )
    }

    // Validate field types
    if (
      typeof entityType !== 'string' ||
      typeof entityName !== 'string' ||
      typeof source !== 'string'
    ) {
      return NextResponse.json(
        { success: false, error: 'entityType, entityName, and source must be strings' },
        { status: 400 }
      )
    }

    if (typeof success !== 'boolean') {
      return NextResponse.json(
        { success: false, error: 'success must be a boolean' },
        { status: 400 }
      )
    }

    // Track the image load event
    imageMonitoringService.trackImageLoad({
      entityType: entityType as 'team' | 'player' | 'sports',
      entityName,
      sport,
      source: source as 'database' | 'espn-cdn' | 'svg',
      success,
      url,
      error,
      loadTime,
    })

    return NextResponse.json({
      success: true,
      message: 'Image event tracked successfully',
    })
  } catch (error) {
    console.error('Error tracking image event:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to track image event',
      },
      { status: 500 }
    )
  }
}
