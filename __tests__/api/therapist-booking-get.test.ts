/**
 * Integration test for GET /api/therapist/bookings/[id] endpoint
 */
import { GET } from '@/app/api/therapist/bookings/[id]/route'

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
  getBookingById: jest.fn(),
}))

describe('GET /api/therapist/bookings/[id]', () => {
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

      const response = await GET(mockRequest, mockParams)

      expect(response.status).toBe(401)
      const jsonResponse = await response.json()
      expect(jsonResponse.error).toBe('Authentication required')
    })

    test('should return 401 when session has no user', async () => {
      const { getAuthSession } = require('@/lib/auth')

      getAuthSession.mockResolvedValue({})

      const mockRequest = {} as Request
      const mockParams = { params: Promise.resolve({ id: '6907b83e29b8d58dfc6839cf' }) }

      const response = await GET(mockRequest, mockParams)

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

      const response = await GET(mockRequest, mockParams)

      expect(response.status).toBe(400)
      const jsonResponse = await response.json()
      expect(jsonResponse.error).toBe('Booking ID is required')
    })
  })

  describe('Booking Retrieval', () => {
    test('should return booking successfully', async () => {
      const { getAuthSession } = require('@/lib/auth')
      const { getBookingById } = require('@/models/Booking')

      const mockSession = {
        user: {
          id: 'therapist-123',
          email: 'therapist@example.com',
        },
      }

      const mockBooking = {
        _id: '6907b83e29b8d58dfc6839cf',
        therapistId: 'therapist-123',
        patientName: 'John Doe',
        patientEmail: 'john@example.com',
        appointmentDate: '2024-12-01',
        startTime: '10:00',
        endTime: '11:00',
        status: 'confirmed',
        reason: 'Initial consultation',
        notes: 'Patient has back pain',
        cancellationToken: 'cancel-token-123',
        createdAt: new Date('2024-11-01T09:00:00Z'),
        updatedAt: new Date('2024-11-01T09:00:00Z'),
      }

      getAuthSession.mockResolvedValue(mockSession)
      ;(getBookingById as jest.Mock).mockResolvedValue(mockBooking)

      const mockRequest = {} as Request
      const mockParams = { params: Promise.resolve({ id: '6907b83e29b8d58dfc6839cf' }) }

      const response = await GET(mockRequest, mockParams)

      expect(response.status).toBe(200)
      const jsonResponse = await response.json()
      expect(jsonResponse.message).toBe('Booking retrieved successfully')
      expect(jsonResponse.booking).toEqual(mockBooking)
      expect(getBookingById).toHaveBeenCalledWith('6907b83e29b8d58dfc6839cf', 'therapist-123')
    })

    test('should return 404 when booking not found', async () => {
      const { getAuthSession } = require('@/lib/auth')
      const { getBookingById } = require('@/models/Booking')

      const mockSession = {
        user: {
          id: 'therapist-123',
          email: 'therapist@example.com',
        },
      }

      getAuthSession.mockResolvedValue(mockSession)
      ;(getBookingById as jest.Mock).mockResolvedValue(null)

      const mockRequest = {} as Request
      const mockParams = { params: Promise.resolve({ id: '6907b83e29b8d58dfc6839cf' }) }

      const response = await GET(mockRequest, mockParams)

      expect(response.status).toBe(404)
      const jsonResponse = await response.json()
      expect(jsonResponse.error).toBe('Booking not found or access denied')
    })

    test('should return 404 when therapist does not own the booking', async () => {
      const { getAuthSession } = require('@/lib/auth')
      const { getBookingById } = require('@/models/Booking')

      const mockSession = {
        user: {
          id: 'therapist-123',
          email: 'therapist@example.com',
        },
      }

      getAuthSession.mockResolvedValue(mockSession)
      ;(getBookingById as jest.Mock).mockResolvedValue(null) // Another therapist's booking

      const mockRequest = {} as Request
      const mockParams = { params: Promise.resolve({ id: '6907b83e29b8d58dfc6839cf' }) }

      const response = await GET(mockRequest, mockParams)

      expect(response.status).toBe(404)
      const jsonResponse = await response.json()
      expect(jsonResponse.error).toBe('Booking not found or access denied')
    })

    test('should return 400 for invalid booking ID format', async () => {
      const { getAuthSession } = require('@/lib/auth')
      const { getBookingById } = require('@/models/Booking')

      const mockSession = {
        user: {
          id: 'therapist-123',
          email: 'therapist@example.com',
        },
      }

      getAuthSession.mockResolvedValue(mockSession)
      ;(getBookingById as jest.Mock).mockRejectedValue(new Error('Invalid booking ID format'))

      const mockRequest = {} as Request
      const mockParams = { params: Promise.resolve({ id: 'invalid-id' }) }

      const response = await GET(mockRequest, mockParams)

      expect(response.status).toBe(400)
      const jsonResponse = await response.json()
      expect(jsonResponse.error).toBe('Invalid booking ID format')
    })

    test('should return 500 for internal server error', async () => {
      const { getAuthSession } = require('@/lib/auth')
      const { getBookingById } = require('@/models/Booking')

      const mockSession = {
        user: {
          id: 'therapist-123',
          email: 'therapist@example.com',
        },
      }

      getAuthSession.mockResolvedValue(mockSession)
      ;(getBookingById as jest.Mock).mockRejectedValue(new Error('Database connection failed'))

      const mockRequest = {} as Request
      const mockParams = { params: Promise.resolve({ id: '6907b83e29b8d58dfc6839cf' }) }

      const response = await GET(mockRequest, mockParams)

      expect(response.status).toBe(500)
      const jsonResponse = await response.json()
      expect(jsonResponse.error).toBe('Internal server error')
    })
  })

  describe('Booking ID Parameter', () => {
    test('should use the booking ID from params', async () => {
      const { getAuthSession } = require('@/lib/auth')
      const { getBookingById } = require('@/models/Booking')

      const mockSession = {
        user: {
          id: 'therapist-123',
          email: 'therapist@example.com',
        },
      }

      const mockBooking = {
        _id: '6907b83e29b8d58dfc6839cf',
        therapistId: 'therapist-123',
        patientName: 'Jane Smith',
        patientEmail: 'jane@example.com',
        appointmentDate: '2024-12-15',
        startTime: '14:00',
        endTime: '15:00',
        status: 'confirmed',
        reason: 'Follow-up appointment',
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      getAuthSession.mockResolvedValue(mockSession)
      ;(getBookingById as jest.Mock).mockResolvedValue(mockBooking)

      const mockRequest = {} as Request
      const mockParams = { params: Promise.resolve({ id: '6907b83e29b8d58dfc6839cf' }) }

      await GET(mockRequest, mockParams)

      expect(getBookingById).toHaveBeenCalledWith('6907b83e29b8d58dfc6839cf', 'therapist-123')
    })
  })
})
