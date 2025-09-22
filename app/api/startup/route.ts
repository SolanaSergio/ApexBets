/**
 * Startup API Route
 * Automatically initializes all services when the server starts
 */

import { NextRequest, NextResponse } from 'next/server';
import { autoStartupService } from '@/lib/services/auto-startup-service';

// Production startup route - no auto-initialization needed

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action') || 'status';

    if (action === 'status') {
      const status = {
        initialized: autoStartupService.getInitializationStatus(),
        config: autoStartupService.getConfig()
      };
      
      return NextResponse.json({
        success: true,
        action: 'status',
        status,
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
      await autoStartupService.stop();
      await autoStartupService.start();
      
      return NextResponse.json({
        success: true,
        action: 'restart',
        message: 'Services restarted successfully',
        timestamp: new Date().toISOString()
      });
    }

    if (action === 'stop') {
      await autoStartupService.stop();
      
      return NextResponse.json({
        success: true,
        action: 'stop',
        message: 'Services stopped successfully',
        timestamp: new Date().toISOString()
      });
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
    const { action, config } = body;

    if (action === 'start') {
      await autoStartupService.initialize(config || {});
      await autoStartupService.start();
      
      return NextResponse.json({
        success: true,
        action: 'start',
        message: 'Services started with custom configuration',
        config: autoStartupService.getConfig(),
        timestamp: new Date().toISOString()
      });
    }

    if (action === 'update-config') {
      autoStartupService.updateConfig(config);
      
      return NextResponse.json({
        success: true,
        action: 'update-config',
        message: 'Configuration updated',
        config: autoStartupService.getConfig(),
        timestamp: new Date().toISOString()
      });
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
