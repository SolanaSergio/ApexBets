import { NextResponse } from 'next/server'
import { serviceFactory } from '@/lib/services/core/service-factory'

export async function GET() {
  try {
    // Test service registry initialization
    const supportedSports = await serviceFactory.getSupportedSports()
    
    return NextResponse.json({
      success: true,
      supportedSports,
      message: 'Service registry test successful'
    })
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 })
  }
}
