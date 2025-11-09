'use client'

import { useState, useEffect, useRef } from 'react'
import { Booking } from '@/lib/types'

interface CancellationModalProps {
  booking: Booking
  onClose: () => void
  onCancel: (bookingId: string, cancellationNote?: string) => void
}

export default function CancellationModal({
  booking,
  onClose,
  onCancel
}: CancellationModalProps) {
  const [cancellationNote, setCancellationNote] = useState('')
  const [loading, setLoading] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    // Focus on the textarea when the modal opens
    if (textareaRef.current) {
      textareaRef.current.focus()
    }
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      await onCancel(booking._id!, cancellationNote.trim() || undefined)
      onClose()
    } catch (error) {
      // Error handling is done in the parent component
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Cancel Appointment</h3>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-2">Appointment Details</h4>
            <div className="space-y-1 text-sm text-gray-900">
              <p><span className="font-medium">Patient:</span> {booking.patientName}</p>
              <p><span className="font-medium">Date:</span> {booking.appointmentDate instanceof Date ? booking.appointmentDate.toISOString().split('T')[0] : booking.appointmentDate}</p>
              <p><span className="font-medium">Time:</span> {booking.startTime} - {booking.endTime}</p>
            </div>
          </div>

          <div>
            <label htmlFor="cancellationNote" className="block text-sm font-medium text-gray-900 mb-2">
              Cancellation Note (Optional)
            </label>
            <textarea
              ref={textareaRef}
              id="cancellationNote"
              value={cancellationNote}
              onChange={(e) => setCancellationNote(e.target.value)}
              placeholder="Enter a note about why this appointment is being cancelled..."
              rows={3}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-red-500 focus:border-red-500 resize-none text-black"
            />
            <p className="text-xs text-gray-700 mt-1">
              This note will be saved in the appointment notes and visible to you for record keeping.
            </p>
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={loading}
            >
              {loading ? 'Cancelling...' : 'Confirm Cancellation'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
