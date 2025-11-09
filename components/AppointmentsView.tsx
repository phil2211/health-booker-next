'use client'

import { useState, useEffect, useCallback } from 'react'
import { format, addWeeks, startOfToday } from 'date-fns'
import { Booking, BookingStatus } from '@/lib/types'
import AppointmentsList from './AppointmentsList'
import AppointmentDetailModal from './AppointmentDetailModal'
import RescheduleModal from './RescheduleModal'
import CancellationModal from './CancellationModal'
import AppointmentStatusBadge from './AppointmentStatusBadge'
import DatePickerPopover from './DatePickerPopover'

interface AppointmentsViewProps {
  therapistId: string
}

interface AppointmentsStats {
  total: number
  upcoming: number
  today: number
  completed: number
  cancelled: number
}

export default function AppointmentsView({ therapistId }: AppointmentsViewProps) {
  const [bookings, setBookings] = useState<Booking[]>([])
  const [filteredBookings, setFilteredBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Filters
  const [statusFilter, setStatusFilter] = useState<BookingStatus | 'all'>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [dateRange, setDateRange] = useState<{
    startDate: string
    endDate: string
  }>({
    startDate: format(startOfToday(), 'yyyy-MM-dd'),
    endDate: format(addWeeks(startOfToday(), 2), 'yyyy-MM-dd')
  })

  // Modal states
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [showRescheduleModal, setShowRescheduleModal] = useState(false)
  const [showCancellationModal, setShowCancellationModal] = useState(false)

  // Stats
  const [stats, setStats] = useState<AppointmentsStats>({
    total: 0,
    upcoming: 0,
    today: 0,
    completed: 0,
    cancelled: 0
  })

  // Fetch bookings
  const fetchBookings = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const params = new URLSearchParams()
      if (statusFilter !== 'all') params.append('status', statusFilter)
      if (dateRange.startDate) params.append('startDate', dateRange.startDate)
      if (dateRange.endDate) params.append('endDate', dateRange.endDate)

      const response = await fetch(`/api/therapist/bookings?${params}`)
      if (!response.ok) {
        throw new Error('Failed to fetch bookings')
      }

      const data = await response.json()
      setBookings(data.bookings)
      // Use server-calculated statistics
      if (data.stats) {
        setStats(data.stats)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch bookings')
    } finally {
      setLoading(false)
    }
  }, [statusFilter, dateRange])

  // Filter bookings based on search query
  useEffect(() => {
    let filtered = bookings

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(booking =>
        booking.patientName.toLowerCase().includes(query) ||
        booking.patientEmail.toLowerCase().includes(query) ||
        (booking.patientPhone && booking.patientPhone.includes(query)) ||
        (booking.notes && booking.notes.toLowerCase().includes(query))
      )
    }

    setFilteredBookings(filtered)
  }, [bookings, searchQuery])

  // Stats are now calculated server-side and included in the API response

  // Initial fetch and refetch when filters change
  useEffect(() => {
    fetchBookings()
  }, [fetchBookings])

  // Handle booking actions
  const handleViewBooking = (booking: Booking) => {
    setSelectedBooking(booking)
    setShowDetailModal(true)
  }

  const handleRescheduleBooking = (booking: Booking) => {
    setSelectedBooking(booking)
    setShowRescheduleModal(true)
  }

  const handleCancelBooking = (bookingId: string) => {
    const booking = bookings.find(b => b._id === bookingId)
    if (booking) {
      setSelectedBooking(booking)
      setShowCancellationModal(true)
    }
  }

  const handleConfirmCancellation = async (bookingId: string, cancellationNote?: string) => {
    try {
      const response = await fetch(`/api/therapist/bookings/${bookingId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          cancellationNote: cancellationNote || undefined
        })
      })

      if (!response.ok) {
        throw new Error('Failed to cancel booking')
      }

      // Refresh bookings
      await fetchBookings()
      setShowCancellationModal(false)
      setSelectedBooking(null)
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to cancel booking')
    }
  }

  const handleUpdateBooking = async (bookingId: string, updates: { notes?: string; status?: BookingStatus }) => {
    try {
      const response = await fetch(`/api/therapist/bookings/${bookingId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      })

      if (!response.ok) {
        throw new Error('Failed to update booking')
      }

      // Refresh bookings
      await fetchBookings()
      setShowDetailModal(false)
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to update booking')
    }
  }

  const handleReschedule = async (bookingId: string, newDate: string, newStartTime: string, newEndTime: string) => {
    try {
      const response = await fetch(`/api/therapist/bookings/${bookingId}/reschedule`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          appointmentDate: newDate,
          startTime: newStartTime,
          endTime: newEndTime
        })
      })

      if (!response.ok) {
        throw new Error('Failed to reschedule booking')
      }

      // Refresh bookings
      await fetchBookings()
      setShowRescheduleModal(false)
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to reschedule booking')
    }
  }

  if (error) {
    return (
      <div className="bg-white rounded-xl shadow-md border p-8 text-center">
        <div className="text-red-600 mb-4">
          <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 18.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Error Loading Appointments</h3>
        <p className="text-gray-600 mb-4">{error}</p>
        <button
          onClick={fetchBookings}
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700"
        >
          Try Again
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Total</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-green-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Upcoming</p>
              <p className="text-2xl font-bold text-gray-900">{stats.upcoming}</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-yellow-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Today</p>
              <p className="text-2xl font-bold text-gray-900">{stats.today}</p>
            </div>
            <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-indigo-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Completed</p>
              <p className="text-2xl font-bold text-gray-900">{stats.completed}</p>
            </div>
            <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-red-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Cancelled</p>
              <p className="text-2xl font-bold text-gray-900">{stats.cancelled}</p>
            </div>
            <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-md p-4 md:p-6">
        <div className="flex flex-col gap-4">
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Status Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as BookingStatus | 'all')}
                className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-black"
              >
                <option value="all">All Statuses</option>
                <option value={BookingStatus.CONFIRMED}>Confirmed</option>
                <option value={BookingStatus.COMPLETED}>Completed</option>
                <option value={BookingStatus.CANCELLED}>Cancelled</option>
                <option value={BookingStatus.NO_SHOW}>No Show</option>
              </select>
            </div>

            {/* Date Range */}
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">From</label>
                <DatePickerPopover
                  key="date-from"
                  selectedDate={dateRange.startDate}
                  onChange={(date) => setDateRange(prev => ({ ...prev, startDate: date }))}
                  data-testid="date-from"
                  popoverId="date-from-popover"
                />
              </div>
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">To</label>
                <DatePickerPopover
                  key="date-to"
                  selectedDate={dateRange.endDate}
                  onChange={(date) => setDateRange(prev => ({ ...prev, endDate: date }))}
                  data-testid="date-to"
                  popoverId="date-to-popover"
                />
              </div>
            </div>

            {/* Search */}
            <div className="flex-1 min-w-0">
              <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
              <input
                type="text"
                placeholder="Search by patient name, email, phone, or notes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-black"
              />
            </div>
          </div>

        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="bg-white rounded-xl shadow-md p-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading appointments...</p>
        </div>
      ) : (
        <AppointmentsList
          bookings={filteredBookings}
          onViewBooking={handleViewBooking}
          onCancelBooking={handleCancelBooking}
          onRescheduleBooking={handleRescheduleBooking}
        />
      )}

      {/* Modals */}
      {showDetailModal && selectedBooking && (
        <AppointmentDetailModal
          booking={selectedBooking}
          onClose={() => {
            setShowDetailModal(false)
            setSelectedBooking(null)
          }}
          onUpdate={handleUpdateBooking}
          onCancel={() => {
            handleCancelBooking(selectedBooking._id!)
            setShowDetailModal(false)
            setSelectedBooking(null)
          }}
          onReschedule={() => {
            setShowDetailModal(false)
            setShowRescheduleModal(true)
          }}
        />
      )}

      {showRescheduleModal && selectedBooking && (
        <RescheduleModal
          booking={selectedBooking}
          onClose={() => {
            setShowRescheduleModal(false)
            setSelectedBooking(null)
          }}
          onReschedule={handleReschedule}
        />
      )}

      {showCancellationModal && selectedBooking && (
        <CancellationModal
          booking={selectedBooking}
          onClose={() => {
            setShowCancellationModal(false)
            setSelectedBooking(null)
          }}
          onCancel={handleConfirmCancellation}
        />
      )}
    </div>
  )
}
