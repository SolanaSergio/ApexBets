import { NextRequest, NextResponse } from "next/server"
import { hmacWebhookAuthenticator } from "@/lib/security/hmac-webhook-authenticator"
import { WebhookValidator } from "@/lib/security/webhook-validator"
import { WebhookProcessor } from "@/lib/security/webhook-processor"

// Security event logging interface
interface SecurityEvent {
  type: 'webhook_auth_success' | 'webhook_auth_failure' | 'webhook_invalid_signature' | 'webhook_ip_blocked' | 'webhook_validation_failure' | 'webhook_processing_failure'
  timestamp: string
  clientIP: string
  userAgent?: string
  signature?: string
  error?: string
  requestId: string
}

// Generate unique request ID for tracking
function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`
}

// Log security events
function logSecurityEvent(event: SecurityEvent): void {
  const logEntry = {
    ...event,
    severity: event.type.includes('failure') || event.type.includes('blocked') ? 'high' : 'low',
    source: 'webhook_endpoint'
  }
  
  console.log(`[SECURITY] ${event.type.toUpperCase()}:`, JSON.stringify(logEntry, null, 2))
}

// Webhook authentication middleware
async function authenticateWebhook(request: NextRequest, rawBody: string): Promise<{
  success: boolean
  error?: string
  clientIP: string
  requestId: string
}> {
  const requestId = generateRequestId()
  
  // Extract client IP
  const headers: Record<string, string | string[] | undefined> = {}
  request.headers.forEach((value, key) => {
    headers[key] = value
  })
  
  const clientIP = hmacWebhookAuthenticator.extractClientIP(headers)
  const userAgent = request.headers.get('user-agent') || undefined
  
  // Get webhook configuration from environment
  const webhookSecret = process.env.WEBHOOK_SECRET
  const allowedIPs = process.env.WEBHOOK_ALLOWED_IPS?.split(',').map(ip => ip.trim()).filter(Boolean) || []
  const requireSignature = process.env.WEBHOOK_REQUIRE_SIGNATURE !== 'false' // Default to true
  const signatureHeader = process.env.WEBHOOK_SIGNATURE_HEADER || 'x-hub-signature-256'
  
  // Check if webhook secret is configured
  if (requireSignature && !webhookSecret) {
    const event: SecurityEvent = {
      type: 'webhook_auth_failure',
      timestamp: new Date().toISOString(),
      clientIP,
      userAgent,
      error: 'Webhook secret not configured',
      requestId
    }
    logSecurityEvent(event)
    
    return {
      success: false,
      error: 'Webhook authentication not properly configured',
      clientIP,
      requestId
    }
  }
  
  // Get signature from headers
  const signature = request.headers.get(signatureHeader)
  
  // Validate signature if required
  if (requireSignature) {
    if (!signature) {
      const event: SecurityEvent = {
        type: 'webhook_auth_failure',
        timestamp: new Date().toISOString(),
        clientIP,
        userAgent,
        error: 'Missing signature header',
        requestId
      }
      logSecurityEvent(event)
      
      return {
        success: false,
        error: 'Missing webhook signature',
        clientIP,
        requestId
      }
    }
    
    // Validate HMAC signature
    const isValidSignature = hmacWebhookAuthenticator.validateSignature(rawBody, signature, webhookSecret!)
    
    if (!isValidSignature) {
      const event: SecurityEvent = {
        type: 'webhook_invalid_signature',
        timestamp: new Date().toISOString(),
        clientIP,
        userAgent,
        signature: signature.substring(0, 20) + '...', // Log partial signature for debugging
        error: 'Invalid HMAC signature',
        requestId
      }
      logSecurityEvent(event)
      
      return {
        success: false,
        error: 'Invalid webhook signature',
        clientIP,
        requestId
      }
    }
  }
  
  // Validate IP address if allowlist is configured
  if (allowedIPs.length > 0) {
    const isAllowedIP = hmacWebhookAuthenticator.validateIPAddress(clientIP, allowedIPs)
    
    if (!isAllowedIP) {
      const event: SecurityEvent = {
        type: 'webhook_ip_blocked',
        timestamp: new Date().toISOString(),
        clientIP,
        userAgent,
        error: 'IP address not in allowlist',
        requestId
      }
      logSecurityEvent(event)
      
      return {
        success: false,
        error: 'IP address not authorized',
        clientIP,
        requestId
      }
    }
  }
  
  // Log successful authentication
  const event: SecurityEvent = {
    type: 'webhook_auth_success',
    timestamp: new Date().toISOString(),
    clientIP,
    userAgent,
    requestId
  }
  logSecurityEvent(event)
  
  return {
    success: true,
    clientIP,
    requestId
  }
}

export async function POST(request: NextRequest) {
  let requestId = generateRequestId()
  let clientIP = 'unknown'
  const startTime = Date.now()
  
  try {
    // Get raw body for signature validation
    const rawBody = await request.text()
    
    // Validate payload size (max 1MB)
    if (!WebhookValidator.validateSize(rawBody)) {
      console.error(`[${requestId}] Payload too large`)
      return NextResponse.json(
        { 
          error: "Payload too large (max 1MB)",
          request_id: requestId,
          timestamp: new Date().toISOString()
        }, 
        { 
          status: 413,
          headers: {
            'X-Request-ID': requestId
          }
        }
      )
    }
    
    let body: any
    try {
      body = JSON.parse(rawBody)
    } catch (parseError) {
      console.error(`[${requestId}] Invalid JSON payload:`, parseError)
      return NextResponse.json(
        { 
          error: "Invalid JSON payload",
          request_id: requestId,
          timestamp: new Date().toISOString()
        }, 
        { 
          status: 400,
          headers: {
            'X-Request-ID': requestId
          }
        }
      )
    }
    
    // Authenticate webhook request
    const authResult = await authenticateWebhook(request, rawBody)
    requestId = authResult.requestId
    clientIP = authResult.clientIP
    
    if (!authResult.success) {
      return NextResponse.json(
        { 
          error: authResult.error,
          request_id: requestId,
          timestamp: new Date().toISOString()
        }, 
        { 
          status: 401,
          headers: {
            'X-Request-ID': requestId,
            'WWW-Authenticate': 'HMAC-SHA256'
          }
        }
      )
    }

    // Validate webhook payload structure
    const validationResult = WebhookValidator.validate(body)
    if (!validationResult.isValid) {
      const event: SecurityEvent = {
        type: 'webhook_validation_failure',
        timestamp: new Date().toISOString(),
        clientIP,
        userAgent: request.headers.get('user-agent') || undefined,
        error: `Validation failed: ${validationResult.errors.join(', ')}`,
        requestId
      }
      logSecurityEvent(event)

      return NextResponse.json(
        { 
          error: "Invalid webhook payload structure",
          details: validationResult.errors,
          request_id: requestId,
          timestamp: new Date().toISOString()
        }, 
        { 
          status: 400,
          headers: {
            'X-Request-ID': requestId
          }
        }
      )
    }

    console.log(`[${requestId}] Authenticated and validated webhook: ${body.type} from ${clientIP}`)

    // Process webhook using enhanced processor
    const processingContext = {
      requestId,
      clientIP,
      userAgent: request.headers.get('user-agent') || undefined,
      timestamp: new Date()
    }

    const result = await WebhookProcessor.processWebhook(validationResult.data!, processingContext)

    if (!result.success) {
      const event: SecurityEvent = {
        type: 'webhook_processing_failure',
        timestamp: new Date().toISOString(),
        clientIP,
        userAgent: request.headers.get('user-agent') || undefined,
        error: result.message,
        requestId
      }
      logSecurityEvent(event)

      return NextResponse.json(
        { 
          error: result.message,
          details: result.errors,
          request_id: requestId,
          timestamp: new Date().toISOString(),
          processing_time_ms: result.processingTimeMs
        }, 
        { 
          status: 500,
          headers: {
            'X-Request-ID': requestId,
            'X-Processing-Time': result.processingTimeMs.toString()
          }
        }
      )
    }

    console.log(`[${requestId}] Webhook processed successfully in ${result.processingTimeMs}ms`)
    
    return NextResponse.json(
      { 
        success: true, 
        message: result.message,
        request_id: requestId,
        timestamp: new Date().toISOString(),
        processing_time_ms: result.processingTimeMs,
        processed: result.processed,
        skipped: result.skipped
      },
      {
        headers: {
          'X-Request-ID': requestId,
          'X-Processing-Time': result.processingTimeMs.toString()
        }
      }
    )

  } catch (error) {
    const processingTime = Date.now() - startTime
    console.error(`[${requestId}] Webhook error:`, error)
    
    // Log security event for processing errors
    const errorEvent: SecurityEvent = {
      type: 'webhook_processing_failure',
      timestamp: new Date().toISOString(),
      clientIP,
      userAgent: request.headers.get('user-agent') || undefined,
      error: error instanceof Error ? error.message : 'Unknown processing error',
      requestId
    }
    logSecurityEvent(errorEvent)
    
    return NextResponse.json(
      { 
        error: "Internal server error",
        request_id: requestId,
        timestamp: new Date().toISOString(),
        processing_time_ms: processingTime
      }, 
      { 
        status: 500,
        headers: {
          'X-Request-ID': requestId,
          'X-Processing-Time': processingTime.toString()
        }
      }
    )
  }
}


