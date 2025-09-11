/**
 * DATABASE INTEGRITY CHECKS API
 * Run comprehensive data integrity checks
 */

import { NextRequest, NextResponse } from 'next/server'
import { databaseSchemaValidator } from '@/lib/services/database/schema-validator'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const checkType = searchParams.get('type') || 'all' // all, orphaned, duplicates, invalid

    // Run data integrity checks
    const integrityChecks = await databaseSchemaValidator.runDataIntegrityChecks()

    // Filter checks based on type if specified
    let filteredChecks = integrityChecks
    if (checkType !== 'all') {
      filteredChecks = integrityChecks.filter(check => 
        check.checkName.toLowerCase().includes(checkType.toLowerCase())
      )
    }

    const passedChecks = filteredChecks.filter(check => check.passed).length
    const totalChecks = filteredChecks.length
    const allPassed = passedChecks === totalChecks

    return NextResponse.json({
      success: true,
      data: {
        checks: filteredChecks,
        summary: {
          total: totalChecks,
          passed: passedChecks,
          failed: totalChecks - passedChecks,
          allPassed
        }
      },
      meta: {
        checkType,
        timestamp: new Date().toISOString()
      }
    })

  } catch (error) {
    console.error('Database integrity checks API error:', error)
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to run database integrity checks',
        details: errorMessage,
        data: null
      },
      { status: 500 }
    )
  }
}
