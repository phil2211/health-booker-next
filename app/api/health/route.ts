import { NextResponse } from 'next/server'

/**
 * Health check endpoint for monitoring and load balancers
 * GET /api/health
 */
export async function GET() {
  return NextResponse.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'health-booker-api',
  })
}

