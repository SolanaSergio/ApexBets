/**
 * DATABASE SCHEMA VALIDATION API
 * Comprehensive database schema validation and data integrity checks
 */

import { NextRequest, NextResponse } from 'next/server'
import { SchemaValidator } from '@/lib/services/database/schema-validator'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const checkIntegrity = searchParams.get('checkIntegrity') === 'true'

    // Validate database schema
    const validationResult = await SchemaValidator.validateSchema()

    return NextResponse.json({
      success: true,
      data: validationResult,
      meta: {
        checkIntegrity,
        timestamp: new Date().toISOString()
      }
    })

  } catch (error) {
    console.error('Database schema validation API error:', error)
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to validate database schema',
        details: errorMessage,
        data: null
      },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { checkIntegrity } = body

    // Validate database schema
    const validationResult = await SchemaValidator.validateSchema()

    // Fix issues
    const fixResults = await SchemaValidator.fixSchemaIssues(validationResult)

    return NextResponse.json({
      success: true,
      data: {
        validationResult,
        fixResults
      },
      meta: {
        checkIntegrity,
        timestamp: new Date().toISOString()
      }
    })

  } catch (error) {
    console.error('Database schema validation API error:', error)
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to validate database schema',
        details: errorMessage,
        data: null
      },
      { status: 500 }
    )
  }
}