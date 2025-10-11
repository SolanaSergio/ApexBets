/**
 * Standardized API Error Handler
 * Provides consistent error handling and response formatting across all API routes
 */

import { NextResponse } from 'next/server'
import { structuredLogger } from '@/lib/services/structured-logger'

export interface ApiError {
  code: string
  message: string
  details?: any
  statusCode: number
  isOperational: boolean
}

export interface ApiErrorResponse {
  success: false
  error: string
  code?: string
  details?: any
  timestamp: string
  requestId?: string
}

export class ApiErrorHandler {
  private static instance: ApiErrorHandler

  public static getInstance(): ApiErrorHandler {
    if (!ApiErrorHandler.instance) {
      ApiErrorHandler.instance = new ApiErrorHandler()
    }
    return ApiErrorHandler.instance
  }

  /**
   * Create a standardized API error
   */
  createError(
    code: string,
    message: string,
    statusCode: number = 500,
    details?: any,
    isOperational: boolean = true
  ): ApiError {
    return {
      code,
      message,
      details,
      statusCode,
      isOperational
    }
  }

  /**
   * Handle and format API errors
   */
  handleError(
    error: Error | ApiError,
    requestId?: string,
    context?: Record<string, any>
  ): NextResponse<ApiErrorResponse> {
    let apiError: ApiError

    if (this.isApiError(error)) {
      apiError = error
    } else {
      // Convert generic error to API error
      apiError = this.createError(
        'INTERNAL_ERROR',
        this.sanitizeErrorMessage(error.message),
        500,
        process.env.NODE_ENV === 'development' ? error.stack : undefined,
        false
      )
    }

    // Log error with context
    this.logError(apiError, requestId, context)

    // Create response
    const response: ApiErrorResponse = {
      success: false,
      error: apiError.message,
      code: apiError.code,
      details: this.sanitizeErrorDetails(apiError.details),
      timestamp: new Date().toISOString(),
      ...(requestId && { requestId })
    }

    return NextResponse.json(response, { status: apiError.statusCode })
  }

  /**
   * Handle database errors specifically
   */
  handleDatabaseError(
    error: any,
    requestId?: string,
    context?: Record<string, any>
  ): NextResponse<ApiErrorResponse> {
    let apiError: ApiError

    if (error.code === '42703') {
      // Column does not exist
      apiError = this.createError(
        'DATABASE_SCHEMA_ERROR',
        'Database schema error - column not found',
        500,
        { hint: error.hint, column: error.message.match(/column "([^"]+)"/)?.[1] },
        true
      )
    } else if (error.code === '23505') {
      // Unique constraint violation
      apiError = this.createError(
        'DUPLICATE_ENTRY',
        'Resource already exists',
        409,
        { constraint: error.constraint },
        true
      )
    } else if (error.code === '23503') {
      // Foreign key constraint violation
      apiError = this.createError(
        'FOREIGN_KEY_ERROR',
        'Referenced resource does not exist',
        400,
        { constraint: error.constraint },
        true
      )
    } else if (error.code === '23502') {
      // Not null constraint violation
      apiError = this.createError(
        'MISSING_REQUIRED_FIELD',
        'Required field is missing',
        400,
        { column: error.column },
        true
      )
    } else {
      // Generic database error
      apiError = this.createError(
        'DATABASE_ERROR',
        'Database operation failed',
        500,
        process.env.NODE_ENV === 'development' ? error : undefined,
        false
      )
    }

    return this.handleError(apiError, requestId, context)
  }

  /**
   * Handle validation errors
   */
  handleValidationError(
    errors: Record<string, string[]>,
    requestId?: string
  ): NextResponse<ApiErrorResponse> {
    const apiError = this.createError(
      'VALIDATION_ERROR',
      'Request validation failed',
      400,
      { validationErrors: errors },
      true
    )

    return this.handleError(apiError, requestId)
  }

  /**
   * Handle authentication errors
   */
  handleAuthError(
    message: string = 'Authentication required',
    requestId?: string
  ): NextResponse<ApiErrorResponse> {
    const apiError = this.createError(
      'AUTHENTICATION_ERROR',
      message,
      401,
      undefined,
      true
    )

    return this.handleError(apiError, requestId)
  }

  /**
   * Handle authorization errors
   */
  handleAuthorizationError(
    message: string = 'Insufficient permissions',
    requestId?: string
  ): NextResponse<ApiErrorResponse> {
    const apiError = this.createError(
      'AUTHORIZATION_ERROR',
      message,
      403,
      undefined,
      true
    )

    return this.handleError(apiError, requestId)
  }

  /**
   * Handle rate limiting errors
   */
  handleRateLimitError(
    message: string = 'Rate limit exceeded',
    requestId?: string
  ): NextResponse<ApiErrorResponse> {
    const apiError = this.createError(
      'RATE_LIMIT_ERROR',
      message,
      429,
      undefined,
      true
    )

    return this.handleError(apiError, requestId)
  }

  /**
   * Handle not found errors
   */
  handleNotFoundError(
    resource: string = 'Resource',
    requestId?: string
  ): NextResponse<ApiErrorResponse> {
    const apiError = this.createError(
      'NOT_FOUND',
      `${resource} not found`,
      404,
      undefined,
      true
    )

    return this.handleError(apiError, requestId)
  }

  /**
   * Check if error is an ApiError
   */
  private isApiError(error: any): error is ApiError {
    return error && typeof error === 'object' && 'code' in error && 'statusCode' in error
  }

  /**
   * Sanitize error message for production
   */
  private sanitizeErrorMessage(message: string): string {
    if (process.env.NODE_ENV === 'production') {
      // Remove sensitive information from error messages
      return message
        .replace(/password[^,]*/gi, '[REDACTED]')
        .replace(/token[^,]*/gi, '[REDACTED]')
        .replace(/key[^,]*/gi, '[REDACTED]')
        .replace(/secret[^,]*/gi, '[REDACTED]')
    }
    return message
  }

  /**
   * Sanitize error details for production
   */
  private sanitizeErrorDetails(details: any): any {
    if (process.env.NODE_ENV === 'production') {
      // Remove sensitive information from error details
      if (typeof details === 'object' && details !== null) {
        const sanitized = { ...details }
        delete sanitized.password
        delete sanitized.token
        delete sanitized.key
        delete sanitized.secret
        delete sanitized.stack
        return sanitized
      }
    }
    return details
  }

  /**
   * Log error with structured logging
   */
  private logError(
    error: ApiError,
    requestId?: string,
    context?: Record<string, any>
  ): void {
    const logContext = {
      errorCode: error.code,
      statusCode: error.statusCode,
      isOperational: error.isOperational,
      ...(requestId && { requestId }),
      ...context
    }

    if (error.statusCode >= 500) {
      structuredLogger.error(`API Error: ${error.message}`, logContext)
    } else if (error.statusCode >= 400) {
      structuredLogger.warn(`API Error: ${error.message}`, logContext)
    } else {
      structuredLogger.info(`API Error: ${error.message}`, logContext)
    }
  }
}

export const apiErrorHandler = ApiErrorHandler.getInstance()

// Convenience functions for common error types
export const createApiError = (code: string, message: string, statusCode: number = 500, details?: any) =>
  apiErrorHandler.createError(code, message, statusCode, details)

export const handleApiError = (error: Error | ApiError, requestId?: string, context?: Record<string, any>) =>
  apiErrorHandler.handleError(error, requestId, context)

export const handleDatabaseError = (error: any, requestId?: string, context?: Record<string, any>) =>
  apiErrorHandler.handleDatabaseError(error, requestId, context)

export const handleValidationError = (errors: Record<string, string[]>, requestId?: string) =>
  apiErrorHandler.handleValidationError(errors, requestId)

export const handleAuthError = (message?: string, requestId?: string) =>
  apiErrorHandler.handleAuthError(message, requestId)

export const handleAuthorizationError = (message?: string, requestId?: string) =>
  apiErrorHandler.handleAuthorizationError(message, requestId)

export const handleRateLimitError = (message?: string, requestId?: string) =>
  apiErrorHandler.handleRateLimitError(message, requestId)

export const handleNotFoundError = (resource?: string, requestId?: string) =>
  apiErrorHandler.handleNotFoundError(resource, requestId)
