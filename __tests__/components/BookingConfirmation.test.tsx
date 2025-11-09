// Mock next-intl before importing the component
jest.mock('next-intl', () => {
  return {
    useTranslations: jest.fn(() => {
      const translations: Record<string, string> = {
        'booking.confirmation.title': 'Booking Confirmed!',
        'booking.confirmation.subtitle': 'Your appointment has been successfully booked. A confirmation email has been sent to {email}.',
        'booking.confirmation.details': 'Appointment Details',
        'booking.confirmation.therapist': 'Therapist',
        'booking.confirmation.treatment': 'Treatment',
        'booking.confirmation.dateTime': 'Date & Time',
        'booking.confirmation.duration': 'Duration',
        'booking.confirmation.patient': 'Patient',
        'booking.confirmation.treatmentType': 'Cranio Sacral Session',
        'booking.confirmation.durationValue': '1 hour',
        'booking.confirmation.calendar.title': 'Add to Calendar',
        'booking.confirmation.calendar.description': 'Save this appointment to your calendar so you don\'t forget!',
        'booking.confirmation.calendar.added': 'Appointment added to your calendar!',
        'booking.confirmation.calendar.ios': 'Add to iPhone Calendar',
        'booking.confirmation.calendar.android': 'Add to Android Calendar',
        'booking.confirmation.calendar.desktop.mac': 'Open in Calendar App',
        'booking.confirmation.calendar.desktop.other': 'Download Calendar File (.ics)',
        'booking.confirmation.calendar.help.ios': 'This will download an .ics file that you can open with the Calendar app',
        'booking.confirmation.calendar.help.android': 'This will open your device\'s calendar app to add the event',
        'booking.confirmation.calendar.help.mac': 'This will open the appointment directly in your Calendar app',
        'booking.confirmation.calendar.help.other': 'This will download an .ics file compatible with most calendar applications',
        'booking.confirmation.actions.bookAnother': 'Book Another Appointment',
        'booking.confirmation.actions.close': 'Close'
      }
      return (key: string) => translations[key] || key
    }),
    NextIntlClientProvider: ({ children }: { children: React.ReactNode }) => children
  }
})

import { render, screen } from '@testing-library/react'
import BookingConfirmation from '@/components/BookingConfirmation'

// Mock navigator properties
Object.defineProperty(window.navigator, 'userAgent', {
  value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)',
  writable: true,
})

Object.defineProperty(window.navigator, 'platform', {
  value: 'iPhone',
  writable: true,
})

describe('BookingConfirmation', () => {
  const mockProps = {
    patientName: 'John Doe',
    patientEmail: 'john@example.com',
    appointmentDate: '2025-11-14',
    startTime: '10:30',
    endTime: '11:30',
    therapistName: 'Dr. Smith',
    cancellationToken: 'test-token-123',
  }

  it.skip('renders booking confirmation details', () => {
    render(<BookingConfirmation {...mockProps} />)

    expect(screen.getByText('Booking Confirmed!')).toBeInTheDocument()
    expect(screen.getByText('John Doe')).toBeInTheDocument()
    expect(screen.getByText('john@example.com')).toBeInTheDocument()
    expect(screen.getByText('Dr. Smith')).toBeInTheDocument()
    expect(screen.getByText('Cranio Sacral Session')).toBeInTheDocument()
  })

  it.skip('shows iOS calendar integration for iPhone', () => {
    render(<BookingConfirmation {...mockProps} />)

    expect(screen.getByText('Add to iPhone Calendar')).toBeInTheDocument()
  })

  it.skip('shows Android calendar integration for Android', () => {
    // Change user agent and platform to Android
    Object.defineProperty(window.navigator, 'userAgent', {
      value: 'Mozilla/5.0 (Linux; Android 10)',
      writable: true,
    })
    Object.defineProperty(window.navigator, 'platform', {
      value: 'Linux',
      writable: true,
    })

    render(<BookingConfirmation {...mockProps} />)

    expect(screen.getByText('Add to Android Calendar')).toBeInTheDocument()
  })

  it.skip('shows macOS calendar integration for Mac', () => {
    // Change user agent and platform to macOS
    Object.defineProperty(window.navigator, 'userAgent', {
      value: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
      writable: true,
    })
    Object.defineProperty(window.navigator, 'platform', {
      value: 'MacIntel',
      writable: true,
    })

    render(<BookingConfirmation {...mockProps} />)

    expect(screen.getByText('Open in Calendar App')).toBeInTheDocument()
    expect(screen.getByText('This will open the appointment directly in your Calendar app')).toBeInTheDocument()
  })

  it.skip('shows desktop calendar download for Windows', () => {
    // Change user agent and platform to Windows
    Object.defineProperty(window.navigator, 'userAgent', {
      value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
      writable: true,
    })
    Object.defineProperty(window.navigator, 'platform', {
      value: 'Win32',
      writable: true,
    })

    render(<BookingConfirmation {...mockProps} />)

    expect(screen.getByText('Download Calendar File (.ics)')).toBeInTheDocument()
  })
})
