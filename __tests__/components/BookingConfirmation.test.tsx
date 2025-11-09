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

  it('renders booking confirmation details', () => {
    render(<BookingConfirmation {...mockProps} />)

    expect(screen.getByText('Booking Confirmed!')).toBeInTheDocument()
    expect(screen.getByText('John Doe')).toBeInTheDocument()
    expect(screen.getByText('john@example.com')).toBeInTheDocument()
    expect(screen.getByText('Dr. Smith')).toBeInTheDocument()
    expect(screen.getByText('Cranio Sacral Session')).toBeInTheDocument()
  })

  it('shows iOS calendar integration for iPhone', () => {
    render(<BookingConfirmation {...mockProps} />)

    expect(screen.getByText('Add to iPhone Calendar')).toBeInTheDocument()
  })

  it('shows Android calendar integration for Android', () => {
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

  it('shows macOS calendar integration for Mac', () => {
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

  it('shows desktop calendar download for Windows', () => {
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
