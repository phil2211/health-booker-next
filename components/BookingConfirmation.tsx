'use client'

import { useState, useEffect } from 'react'

interface BookingConfirmationProps {
  patientName: string
  patientEmail: string
  appointmentDate: string
  startTime: string
  endTime: string
  therapistName: string
  cancellationToken?: string
  onClose?: () => void
}

export default function BookingConfirmation({
  patientName,
  patientEmail,
  appointmentDate,
  startTime,
  endTime,
  therapistName,
  cancellationToken,
  onClose
}: BookingConfirmationProps) {
  const [deviceType, setDeviceType] = useState<'ios' | 'android' | 'desktop'>('desktop')
  const [calendarAdded, setCalendarAdded] = useState(false)

  useEffect(() => {
    // Detect device type
    const userAgent = navigator.userAgent.toLowerCase()
    if (userAgent.includes('iphone') || userAgent.includes('ipad') || userAgent.includes('ipod')) {
      setDeviceType('ios')
    } else if (userAgent.includes('android')) {
      setDeviceType('android')
    } else {
      setDeviceType('desktop')
    }
  }, [])

  const generateICSCalendarEvent = () => {
    const appointmentDateTime = new Date(`${appointmentDate}T${startTime}:00`)
    const endDateTime = new Date(`${appointmentDate}T${endTime}:00`)

    // Calculate reminder times
    const oneDayBefore = new Date(appointmentDateTime.getTime() - (24 * 60 * 60 * 1000))
    const oneHourBefore = new Date(appointmentDateTime.getTime() - (60 * 60 * 1000))

    // Format dates for ICS
    const formatICSDate = (date: Date) => {
      return date.toISOString().replace(/[:-]/g, '').split('.')[0] + 'Z'
    }

    // Create detailed description with cancellation link
    const cancellationUrl = cancellationToken
      ? `${window.location.origin}/cancel/${cancellationToken}`
      : 'Contact us to cancel'

    const description = `Appointment Details:
• Therapist: ${therapistName}
• Treatment: Cranio Sacral Session
• Patient: ${patientName}
• Email: ${patientEmail}
• Duration: 1 hour

To cancel this appointment, visit: ${cancellationUrl}

This appointment was booked through HealthBooker.`

    const icsContent = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//HealthBooker//Appointment//EN
BEGIN:VEVENT
UID:${Date.now()}@healthbooker.app
DTSTART:${formatICSDate(appointmentDateTime)}
DTEND:${formatICSDate(endDateTime)}
SUMMARY:Cranio Sacral Session - ${therapistName}
DESCRIPTION:${description.replace(/\n/g, '\\n')}
LOCATION:Virtual/Remote Session
STATUS:CONFIRMED
ORGANIZER;CN=${therapistName}:mailto:appointments@healthbooker.app
ATTENDEE;CN=${patientName}:mailto:${patientEmail}
BEGIN:VALARM
ACTION:DISPLAY
DESCRIPTION:Reminder: Your Cranio Sacral Session with ${therapistName} is tomorrow
TRIGGER:-P1D
END:VALARM
BEGIN:VALARM
ACTION:DISPLAY
DESCRIPTION:Reminder: Your Cranio Sacral Session with ${therapistName} starts in 1 hour
TRIGGER:-PT1H
END:VALARM
END:VEVENT
END:VCALENDAR`

    return icsContent
  }

  const addToIOSCalendar = () => {
    const icsContent = generateICSCalendarEvent()
    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' })
    const url = URL.createObjectURL(blob)

    const link = document.createElement('a')
    link.href = url
    link.download = `appointment-${appointmentDate}.ics`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)

    setCalendarAdded(true)
  }

  const addToAndroidCalendar = () => {
    const appointmentDateTime = new Date(`${appointmentDate}T${startTime}:00`)
    const endDateTime = new Date(`${appointmentDate}T${endTime}:00`)

    // Format for Android calendar intent
    const startTimeMillis = appointmentDateTime.getTime()
    const endTimeMillis = endDateTime.getTime()

    const title = encodeURIComponent(`Cranio Sacral Session with ${therapistName}`)
    const description = encodeURIComponent(`Appointment with ${therapistName}\nPatient: ${patientName}\nEmail: ${patientEmail}`)

    // Android calendar intent URL
    const calendarUrl = `intent://calendar.r.android.intent.action.INSERT#Intent;scheme=content;S.title=${title};S.description=${description};S.beginTime=${startTimeMillis};S.endTime=${endTimeMillis};S.allDay=false;end`

    window.location.href = calendarUrl
    setCalendarAdded(true)
  }

  const addToDesktopCalendar = () => {
    const icsContent = generateICSCalendarEvent()

    // For macOS, try to open directly in Calendar.app
    if (navigator.platform.toLowerCase().includes('mac')) {
      const dataUrl = `data:text/calendar;charset=utf-8,${encodeURIComponent(icsContent)}`
      window.open(dataUrl, '_blank')
    } else {
      // For other desktop platforms, download the file
      const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' })
      const url = URL.createObjectURL(blob)

      const link = document.createElement('a')
      link.href = url
      link.download = `appointment-${appointmentDate}.ics`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    }

    setCalendarAdded(true)
  }

  const formatAppointmentDateTime = () => {
    const date = new Date(appointmentDate)
    const dateStr = date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })

    const timeStr = new Date(`${appointmentDate}T${startTime}:00`).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    })

    return `${dateStr} at ${timeStr}`
  }

  return (
    <div className="bg-green-50 border border-green-200 rounded-lg p-8">
      <div className="flex items-start">
        <svg
          className="w-8 h-8 text-green-600 mr-4 mt-1"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        <div className="flex-1">
          <h3 className="text-2xl font-bold text-green-900 mb-2">Booking Confirmed!</h3>
          <p className="text-green-800 mb-6">
            Your appointment has been successfully booked. A confirmation email has been sent to <strong>{patientEmail}</strong>.
          </p>

          {/* Appointment Details */}
          <div className="bg-white rounded-lg border p-6 mb-6">
            <h4 className="text-lg font-semibold text-gray-900 mb-4">Appointment Details</h4>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Therapist:</span>
                <span className="font-medium">{therapistName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Treatment:</span>
                <span className="font-medium">Cranio Sacral Session</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Date & Time:</span>
                <span className="font-medium">{formatAppointmentDateTime()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Duration:</span>
                <span className="font-medium">1 hour</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Patient:</span>
                <span className="font-medium">{patientName}</span>
              </div>
            </div>
          </div>

          {/* Calendar Integration */}
          <div className="bg-white rounded-lg border p-6 mb-6">
            <h4 className="text-lg font-semibold text-gray-900 mb-4">Add to Calendar</h4>
            <p className="text-gray-600 mb-4">
              Save this appointment to your calendar so you don't forget!
            </p>

            {calendarAdded ? (
              <div className="text-center py-4">
                <div className="inline-flex items-center text-green-600">
                  <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Appointment added to your calendar!
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {deviceType === 'ios' && (
                  <button
                    onClick={addToIOSCalendar}
                    className="w-full flex items-center justify-center px-4 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
                  >
                    <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
                    </svg>
                    Add to iPhone Calendar
                  </button>
                )}

                {deviceType === 'android' && (
                  <button
                    onClick={addToAndroidCalendar}
                    className="w-full flex items-center justify-center px-4 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors"
                  >
                    <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M17.523 15.3414c-.5511 0-.9993-.4482-.9993-.9993s.4482-.9993.9993-.9993.9993.4482.9993.9993-.4482.9993-.9993.9993zm-11.046 0c-.5511 0-.9993-.4482-.9993-.9993s.4482-.9993.9993-.9993.9993.4482.9993.9993-.4482.9993-.9993.9993zm11.046-5.732c0-.5511-.4482-.9993-.9993-.9993H7.476c-.5511 0-.9993.4482-.9993.9993v3.732c0 .5511.4482.9993.9993.9993h8.9993c.5511 0 .9993-.4482.9993-.9993V9.6094zM6.4766 9.6094H5.4773c-.5511 0-.9993.4482-.9993.9993v3.732c0 .5511.4482.9993.9993.9993h.9993V9.6094zm12.0461 0h-8.9993c-.5511 0-.9993.4482-.9993.9993v3.732c0 .5511.4482.9993.9993.9993h8.9993c.5511 0 .9993-.4482.9993-.9993V9.6094z"/>
                    </svg>
                    Add to Android Calendar
                  </button>
                )}

                {deviceType === 'desktop' && (
                  <button
                    onClick={addToDesktopCalendar}
                    className="w-full flex items-center justify-center px-4 py-3 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition-colors"
                  >
                    <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    {navigator.platform.toLowerCase().includes('mac')
                      ? 'Open in Calendar App'
                      : 'Download Calendar File (.ics)'}
                  </button>
                )}

                <div className="text-center text-sm text-gray-500 mt-3">
                  {deviceType === 'ios' && "This will download an .ics file that you can open with the Calendar app"}
                  {deviceType === 'android' && "This will open your device's calendar app to add the event"}
                  {deviceType === 'desktop' && (
                    navigator.platform.toLowerCase().includes('mac')
                      ? "This will open the appointment directly in your Calendar app"
                      : "This will download an .ics file compatible with most calendar applications"
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Additional Actions */}
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => window.location.href = '/'}
              className="flex-1 px-6 py-3 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors"
            >
              Book Another Appointment
            </button>
            {onClose && (
              <button
                onClick={onClose}
                className="flex-1 px-6 py-3 bg-gray-200 text-gray-800 rounded-lg font-medium hover:bg-gray-300 transition-colors"
              >
                Close
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
