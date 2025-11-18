import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { getBookingsByTherapistAndDateRange, getAppointmentStats } from '@/models/Booking'
import { BookingStatus } from '@/lib/types'
import { isValidDate } from '@/lib/utils/validation'

import { createErrorResponse } from '@/lib/utils/api';

export const runtime = 'nodejs'

/**
 * GET /api/therapist/bookings
 * Fetch all bookings for authenticated therapist with optional filtering
 *
 * Query params:
 * - status: Filter by booking status (confirmed, completed, cancelled, no_show)
 * - startDate: Start date for date range (YYYY-MM-DD)
 * - endDate: End date for date range (YYYY-MM-DD)
 * - limit: Maximum number of results (default: 100)
 */
export async function GET(request: NextRequest) {
  try {
    const session = await requireAuth()
    const therapistId = session.user.id
    const { searchParams } = new URL(request.url)

    // Parse query parameters
    const status = searchParams.get('status') as BookingStatus | null
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const limit = Math.min(parseInt(searchParams.get('limit') || '100'), 1000) // Cap at 1000

    // Validate status if provided
    if (status && !Object.values(BookingStatus).includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status. Must be one of: confirmed, completed, cancelled, no_show' },
        { status: 400 }
      )
    }

    // Validate date formats if provided
    if (startDate && !isValidDate(startDate)) {
      return NextResponse.json(
        { error: 'Invalid startDate format. Use YYYY-MM-DD' },
        { status: 400 }
      )
    }
    if (endDate && !isValidDate(endDate)) {
      return NextResponse.json(
        { error: 'Invalid endDate format. Use YYYY-MM-DD' },
        { status: 400 }
      )
    }

    // Set default date range if not provided (last 3 months to 6 months ahead)
    const now = new Date()
    const defaultStartDate = startDate || new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    const defaultEndDate = endDate || new Date(now.getTime() + 180 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

    // Always include cancelled bookings since we need them for filtering
    // The getBookingsByTherapistAndDateRange function now defaults to includeCancelled = true
    // when no parameter is passed, but we'll be explicit
    const includeCancelled = true

    // Fetch bookings and statistics in parallel
    const [bookings, stats] = await Promise.all([
      getBookingsByTherapistAndDateRange(therapistId, defaultStartDate, defaultEndDate, includeCancelled),
      getAppointmentStats(therapistId)
    ])

    // Apply status filter if provided
    let filteredBookings = bookings
    if (status) {
      filteredBookings = bookings.filter(booking => booking.status === status)
    }

    // Sort by date and time (newest first)
    filteredBookings.sort((a, b) => {
      // Convert appointmentDate to string for comparison
      const aDate = a.appointmentDate instanceof Date ? a.appointmentDate.toISOString().split('T')[0] : a.appointmentDate
      const bDate = b.appointmentDate instanceof Date ? b.appointmentDate.toISOString().split('T')[0] : b.appointmentDate

      const dateCompare = bDate.localeCompare(aDate)
      if (dateCompare !== 0) return dateCompare
      return b.startTime.localeCompare(a.startTime)
    })

    // Apply limit
    if (filteredBookings.length > limit) {
      filteredBookings = filteredBookings.slice(0, limit)
    }

    return NextResponse.json({
      bookings: filteredBookings,
      total: filteredBookings.length,
      stats,
      filters: {
        status: status || 'all',
        startDate: defaultStartDate,
        endDate: defaultEndDate,
        limit
      }
    })

  } catch (error) {
    console.error('Fetch therapist bookings error:', error)
    if (error instanceof Error && error.message.includes('Unauthorized')) {
      return NextResponse.json(
        createErrorResponse(error, 'requireAuth', 401),
        { status: 401 }
      )
    }
    return NextResponse.json(
      createErrorResponse(error, 'GET /api/therapist/bookings'),
      { status: 500 }
    )
  }
}
