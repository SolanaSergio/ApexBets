/**
 * Startup API Route
 * Automatically initializes all services when the server starts
 */

import { NextRequest, NextResponse } from 'next/server';
// Removed auto-startup-service import - service was deleted as unnecessary

// Production startup route - no auto-initialization needed

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action') || 'status';

    if (action === 'status') {
      return NextResponse.json({
        success: true,
        action: 'status',
        status: { initialized: false, message: 'Auto-startup service was removed' },
        timestamp: new Date().toISOString()
      });
    }

    if (action === 'health') {
      const healthCheck = { healthy: true };
      
      return NextResponse.json({
        success: true,
        action: 'health',
        health: healthCheck,
        timestamp: new Date().toISOString()
      });
    }

    if (action === 'restart') {
      return NextResponse.json({
        success: false,
        error: 'Auto-startup service was removed',
        timestamp: new Date().toISOString()
      }, { status: 410 });
    }

    if (action === 'stop') {
      return NextResponse.json({
        success: false,
        error: 'Auto-startup service was removed',
        timestamp: new Date().toISOString()
      }, { status: 410 });
    }

    return NextResponse.json({
      success: false,
      error: 'Invalid action. Use: status, health, restart, or stop',
      availableActions: ['status', 'health', 'restart', 'stop']
    }, { status: 400 });

  } catch (error) {
    console.error('❌ Startup API error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;

    if (action === 'start') {
      return NextResponse.json({
        success: false,
        error: 'Auto-startup service was removed',
        timestamp: new Date().toISOString()
      }, { status: 410 });
    }

    if (action === 'update-config') {
      return NextResponse.json({
        success: false,
        error: 'Auto-startup service was removed - configuration not available',
        timestamp: new Date().toISOString()
      }, { status: 400 });
    }

    return NextResponse.json({
      success: false,
      error: 'Invalid action. Use: start or update-config',
      availableActions: ['start', 'update-config']
    }, { status: 400 });

  } catch (error) {
    console.error('❌ Startup API error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
