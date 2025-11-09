'use client'

import { useState } from 'react'
import { Booking, BookingStatus } from '@/lib/types'
import AppointmentStatusBadge from './AppointmentStatusBadge'

interface AppointmentDetailModalProps {
  booking: Booking
  onClose: () => void
  onUpdate: (bookingId: string, updates: { notes?: string; status?: BookingStatus }) => void
  onCancel: () => void
  onReschedule: () => void
}

export default function AppointmentDetailModal({
  booking,
  onClose,
  onUpdate,
  onCancel,
  onReschedule
}: AppointmentDetailModalProps) {
  const [notes, setNotes] = useState(booking.notes || '')
  const [isEditingNotes, setIsEditingNotes] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)

  const formatDate = (dateString: string) => {
    const date = new Date(dateString + 'T00:00:00')
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const handleSaveNotes = async () => {
    setIsUpdating(true)
    try {
      await onUpdate(booking._id!, { notes })
      setIsEditingNotes(false)
    } catch (error) {
      // Error is handled by parent component
    } finally {
      setIsUpdating(false)
    }
  }

  const handleStatusUpdate = async (newStatus: BookingStatus) => {
    if (!confirm(`Are you sure you want to mark this appointment as ${newStatus.toLowerCase()}?`)) {
      return
    }

    setIsUpdating(true)
    try {
      await onUpdate(booking._id!, { status: newStatus })
    } catch (error) {
      // Error is handled by parent component
    } finally {
      setIsUpdating(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-2 md:p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[95vh] md:max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 md:p-6 border-b border-gray-200 gap-4">
          <div>
            <h2 className="text-lg md:text-xl font-semibold text-gray-900">Appointment Details</h2>
            <p className="text-sm text-gray-600 mt-1">
              {formatDate(booking.appointmentDate instanceof Date ? booking.appointmentDate.toISOString().split('T')[0] : booking.appointmentDate)} • {booking.startTime} - {booking.endTime}
            </p>
          </div>
          <button
            onClick={onClose}
            className="self-end sm:self-auto text-gray-400 hover:text-gray-600 transition-colors p-1"
          >
            <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-4 md:p-6 space-y-4 md:space-y-6">
          {/* Status */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
            <AppointmentStatusBadge status={booking.status} />
          </div>

          {/* Patient Information */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Patient Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                <p className="text-gray-900 bg-gray-50 px-3 py-2 rounded-lg">{booking.patientName}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <p className="text-gray-900 bg-gray-50 px-3 py-2 rounded-lg">{booking.patientEmail}</p>
              </div>
              {booking.patientPhone && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                  <p className="text-gray-900 bg-gray-50 px-3 py-2 rounded-lg">{booking.patientPhone}</p>
                </div>
              )}
            </div>
          </div>

          {/* Appointment Details */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Appointment Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                <p className="text-gray-900 bg-gray-50 px-3 py-2 rounded-lg">{formatDate(booking.appointmentDate instanceof Date ? booking.appointmentDate.toISOString().split('T')[0] : booking.appointmentDate)}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Time</label>
                <p className="text-gray-900 bg-gray-50 px-3 py-2 rounded-lg">{booking.startTime} - {booking.endTime}</p>
              </div>
            </div>
          </div>

          {/* Notes */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">Notes</h3>
              {!isEditingNotes && booking.status === 'confirmed' && (
                <button
                  onClick={() => setIsEditingNotes(true)}
                  className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
                >
                  Edit Notes
                </button>
              )}
            </div>

            {isEditingNotes ? (
              <div className="space-y-3">
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Add notes about this appointment..."
                  rows={4}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-black"
                />
                <div className="flex flex-col sm:flex-row gap-2">
                  <button
                    onClick={handleSaveNotes}
                    disabled={isUpdating}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                  >
                    {isUpdating ? 'Saving...' : 'Save Notes'}
                  </button>
                  <button
                    onClick={() => {
                      setNotes(booking.notes || '')
                      setIsEditingNotes(false)
                    }}
                    className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 font-medium"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-gray-50 px-3 py-2 rounded-lg min-h-[60px] text-black">
                {notes || <span className="text-black italic">No notes added yet</span>}
              </div>
            )}
          </div>

          {/* Cancellation Token */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Cancellation Token</label>
            <p className="text-sm text-gray-600 bg-gray-50 px-3 py-2 rounded-lg font-mono">
              {booking.cancellationToken}
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-4 p-4 md:p-6 border-t border-gray-200 bg-gray-50">
          <div className="flex flex-col sm:flex-row gap-2">
            {booking.status === 'confirmed' && (
              <>
                <button
                  onClick={() => handleStatusUpdate(BookingStatus.COMPLETED)}
                  disabled={isUpdating}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                >
                  Mark as Completed
                </button>

                <button
                  onClick={() => handleStatusUpdate(BookingStatus.NO_SHOW)}
                  disabled={isUpdating}
                  className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                >
                  Mark as No Show
                </button>
              </>
            )}
          </div>

          <div className="flex flex-col sm:flex-row gap-2">
            {booking.status === 'confirmed' && (
              <>
                <button
                  onClick={onReschedule}
                  className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 font-medium"
                >
                  Reschedule
                </button>

                <button
                  onClick={onCancel}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium"
                >
                  Cancel Appointment
                </button>
              </>
            )}

            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 font-medium"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
