import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const src = searchParams.get('src')
  const width = parseInt(searchParams.get('w') || '800')
  const height = parseInt(searchParams.get('h') || '600')
  const quality = parseInt(searchParams.get('q') || '80')
  const format = searchParams.get('f') || 'webp'

  if (!src) {
    return new NextResponse('Missing src parameter', { status: 400 })
  }

  try {
    // For external images, we'll redirect to the optimized version
    if (src.startsWith('http')) {
      // For Unsplash, add optimization parameters
      if (src.includes('unsplash.com')) {
        const url = new URL(src)
        url.searchParams.set('w', width.toString())
        url.searchParams.set('h', height.toString())
        url.searchParams.set('q', quality.toString())
        url.searchParams.set('auto', 'format')
        url.searchParams.set('fit', 'crop')
        return NextResponse.redirect(url.toString())
      }
      
      // For other external images, return as-is
      return NextResponse.redirect(src)
    }

    // For local images, we could implement resizing here
    // For now, just return the original
    return NextResponse.redirect(src)
  } catch (error) {
    console.error('Image optimization error:', error)
    return new NextResponse('Image optimization failed', { status: 500 })
  }
}
