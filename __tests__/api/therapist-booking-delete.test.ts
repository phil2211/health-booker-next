/**
 * Integration test for DELETE /api/therapist/bookings/[id] endpoint (cancel booking)
 */
import { DELETE } from '@/app/api/therapist/bookings/[id]/route'

// Mock the authentication
jest.mock('@/lib/auth', () => ({
  getAuthSession: jest.fn(),
}))

// Mock NextResponse
jest.mock('next/server', () => ({
  NextResponse: {
    json: jest.fn((data, options) => ({
      status: options?.status || 200,
      json: () => Promise.resolve(data),
    })),
  },
}))

// Mock the Booking model function
jest.mock('@/models/Booking', () => ({
  cancelBookingById: jest.fn(),
}))

describe('DELETE /api/therapist/bookings/[id] (Cancel Booking)', () => {
  let processEnvBackup: NodeJS.ProcessEnv

  beforeAll(() => {
    processEnvBackup = { ...process.env }
  })

  afterAll(() => {
    process.env = processEnvBackup
  })

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Authentication', () => {
    test('should return 401 when not authenticated', async () => {
      const { getAuthSession } = require('@/lib/auth')

      getAuthSession.mockResolvedValue(null)

      const mockRequest = {} as Request
      const mockParams = { params: Promise.resolve({ id: '6907b83e29b8d58dfc6839cf' }) }

      const response = await DELETE(mockRequest, mockParams)

      expect(response.status).toBe(401)
      const jsonResponse = await response.json()
      expect(jsonResponse.error).toBe('Authentication required')
    })

    test('should return 401 when session has no user', async () => {
      const { getAuthSession } = require('@/lib/auth')

      getAuthSession.mockResolvedValue({})

      const mockRequest = {} as Request
      const mockParams = { params: Promise.resolve({ id: '6907b83e29b8d58dfc6839cf' }) }

      const response = await DELETE(mockRequest, mockParams)

      expect(response.status).toBe(401)
      const jsonResponse = await response.json()
      expect(jsonResponse.error).toBe('Authentication required')
    })
  })

  describe('Input Validation', () => {
    test('should return 400 when booking ID is missing', async () => {
      const { getAuthSession } = require('@/lib/auth')

      const mockSession = {
        user: {
          id: 'therapist-123',
          email: 'therapist@example.com',
        },
      }

      getAuthSession.mockResolvedValue(mockSession)

      const mockRequest = {} as Request
      const mockParams = { params: Promise.resolve({ id: '' }) }

      const response = await DELETE(mockRequest, mockParams)

      expect(response.status).toBe(400)
      const jsonResponse = await response.json()
      expect(jsonResponse.error).toBe('Booking ID is required')
    })
  })

  describe('Booking Cancellation', () => {
    test('should cancel booking successfully', async () => {
      const { getAuthSession } = require('@/lib/auth')
      const { cancelBookingById } = require('@/models/Booking')

      const mockSession = {
        user: {
          id: 'therapist-123',
          email: 'therapist@example.com',
        },
      }

      const mockCancelledBooking = {
        _id: '6907b83e29b8d58dfc6839cf',
        therapistId: 'therapist-123',
        patientName: 'John Doe',
        patientEmail: 'john@example.com',
        appointmentDate: '2024-12-01',
        startTime: '10:00',
        endTime: '11:00',
        status: 'cancelled',
        reason: 'Initial consultation',
        notes: 'Cancelled by therapist',
        cancellationToken: 'cancel-token-123',
        createdAt: new Date('2024-11-01T09:00:00Z'),
        updatedAt: new Date('2024-11-01T10:00:00Z'),
      }

      getAuthSession.mockResolvedValue(mockSession)
      ;(cancelBookingById as jest.Mock).mockResolvedValue(mockCancelledBooking)

      const mockRequest = {} as Request
      const mockParams = { params: Promise.resolve({ id: '6907b83e29b8d58dfc6839cf' }) }

      const response = await DELETE(mockRequest, mockParams)

      expect(response.status).toBe(200)
      const jsonResponse = await response.json()
      expect(jsonResponse.message).toBe('Booking cancelled successfully')
      expect(jsonResponse.booking).toEqual(mockCancelledBooking)
      expect(cancelBookingById).toHaveBeenCalledWith('6907b83e29b8d58dfc6839cf', 'therapist-123')
    })

    test('should return 404 when booking not found', async () => {
      const { getAuthSession } = require('@/lib/auth')
      const { cancelBookingById } = require('@/models/Booking')

      const mockSession = {
        user: {
          id: 'therapist-123',
          email: 'therapist@example.com',
        },
      }

      getAuthSession.mockResolvedValue(mockSession)
      ;(cancelBookingById as jest.Mock).mockResolvedValue(null)

      const mockRequest = {} as Request
      const mockParams = { params: Promise.resolve({ id: '6907b83e29b8d58dfc6839cf' }) }

      const response = await DELETE(mockRequest, mockParams)

      expect(response.status).toBe(404)
      const jsonResponse = await response.json()
      expect(jsonResponse.error).toBe('Booking not found, access denied, or already cancelled')
    })

    test('should return 404 when therapist does not own the booking', async () => {
      const { getAuthSession } = require('@/lib/auth')
      const { cancelBookingById } = require('@/models/Booking')

      const mockSession = {
        user: {
          id: 'therapist-123',
          email: 'therapist@example.com',
        },
      }

      getAuthSession.mockResolvedValue(mockSession)
      ;(cancelBookingById as jest.Mock).mockResolvedValue(null) // Another therapist's booking

      const mockRequest = {} as Request
      const mockParams = { params: Promise.resolve({ id: '6907b83e29b8d58dfc6839cf' }) }

      const response = await DELETE(mockRequest, mockParams)

      expect(response.status).toBe(404)
      const jsonResponse = await response.json()
      expect(jsonResponse.error).toBe('Booking not found, access denied, or already cancelled')
    })

    test('should return 404 when booking is already cancelled', async () => {
      const { getAuthSession } = require('@/lib/auth')
      const { cancelBookingById } = require('@/models/Booking')

      const mockSession = {
        user: {
          id: 'therapist-123',
          email: 'therapist@example.com',
        },
      }

      getAuthSession.mockResolvedValue(mockSession)
      ;(cancelBookingById as jest.Mock).mockResolvedValue(null) // Already cancelled

      const mockRequest = {} as Request
      const mockParams = { params: Promise.resolve({ id: '6907b83e29b8d58dfc6839cf' }) }

      const response = await DELETE(mockRequest, mockParams)

      expect(response.status).toBe(404)
      const jsonResponse = await response.json()
      expect(jsonResponse.error).toBe('Booking not found, access denied, or already cancelled')
    })

    test('should return 400 for invalid booking ID format', async () => {
      const { getAuthSession } = require('@/lib/auth')
      const { cancelBookingById } = require('@/models/Booking')

      const mockSession = {
        user: {
          id: 'therapist-123',
          email: 'therapist@example.com',
        },
      }

      getAuthSession.mockResolvedValue(mockSession)
      ;(cancelBookingById as jest.Mock).mockRejectedValue(new Error('Invalid booking ID format'))

      const mockRequest = {} as Request
      const mockParams = { params: Promise.resolve({ id: 'invalid-id' }) }

      const response = await DELETE(mockRequest, mockParams)

      expect(response.status).toBe(400)
      const jsonResponse = await response.json()
      expect(jsonResponse.error).toBe('Invalid booking ID format')
    })

    test('should return 500 for internal server error', async () => {
      const { getAuthSession } = require('@/lib/auth')
      const { cancelBookingById } = require('@/models/Booking')

      const mockSession = {
        user: {
          id: 'therapist-123',
          email: 'therapist@example.com',
        },
      }

      getAuthSession.mockResolvedValue(mockSession)
      ;(cancelBookingById as jest.Mock).mockRejectedValue(new Error('Database connection failed'))

      const mockRequest = {} as Request
      const mockParams = { params: Promise.resolve({ id: '6907b83e29b8d58dfc6839cf' }) }

      const response = await DELETE(mockRequest, mockParams)

      expect(response.status).toBe(500)
      const jsonResponse = await response.json()
      expect(jsonResponse.error).toBe('Internal server error')
    })
  })

  describe('Booking ID Parameter', () => {
    test('should use the booking ID from params', async () => {
      const { getAuthSession } = require('@/lib/auth')
      const { cancelBookingById } = require('@/models/Booking')

      const mockSession = {
        user: {
          id: 'therapist-123',
          email: 'therapist@example.com',
        },
      }

      const mockCancelledBooking = {
        _id: '6907b83e29b8d58dfc6839cf',
        therapistId: 'therapist-123',
        patientName: 'Jane Smith',
        patientEmail: 'jane@example.com',
        appointmentDate: '2024-12-15',
        startTime: '14:00',
        endTime: '15:00',
        status: 'cancelled',
        reason: 'Follow-up appointment',
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      getAuthSession.mockResolvedValue(mockSession)
      ;(cancelBookingById as jest.Mock).mockResolvedValue(mockCancelledBooking)

      const mockRequest = {} as Request
      const mockParams = { params: Promise.resolve({ id: '6907b83e29b8d58dfc6839cf' }) }

      await DELETE(mockRequest, mockParams)

      expect(cancelBookingById).toHaveBeenCalledWith('6907b83e29b8d58dfc6839cf', 'therapist-123')
    })
  })
})
