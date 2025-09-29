import { NextResponse } from 'next/server'
import { serviceFactory } from '@/lib/services/core/service-factory'

export async function GET() {
  try {
    // Test service registry initialization
    const supportedSports = await serviceFactory.getSupportedSports()
    const services = await Promise.all(supportedSports.map(async (sport) => {
        const service = await serviceFactory.getService(sport);
        return {
            sport,
            defaultLeague: serviceFactory.getDefaultLeague(sport),
            availableActions: Object.keys(service),
        };
    }));
    
    return NextResponse.json({
      success: true,
      supportedSports,
      services,
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
