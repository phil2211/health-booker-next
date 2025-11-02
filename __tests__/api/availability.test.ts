/**
 * Unit tests for Therapist Availability API endpoints
 */

// Mock MongoDB and ObjectId before importing anything
jest.mock('mongodb', () => {
  const mockObjectIds = new Map<string, { toString: () => string }>()
  let counter = 0

  const generateValidId = () => {
    const hex = counter.toString(16).padStart(24, '0')
    counter++
    return hex
  }

  class MockObjectId {
    private _id: string

    constructor(id?: string) {
      this._id = id || generateValidId()
      mockObjectIds.set(this._id, this)
    }

    toString() {
      return this._id
    }

    static isValid(str: string) {
      // For testing: accept any non-empty string
      // In production, this would require 24 character hex string
      return typeof str === 'string' && str.length > 0
    }
  }

  return {
    ObjectId: MockObjectId,
    __esModule: true,
  }
})

// Mock MongoDB connection
jest.mock('@/lib/mongodb', () => ({
  getDatabase: jest.fn(),
}))

// Mock authentication
const mockRequireAuthAvailability = jest.fn()
jest.mock('@/lib/auth', () => ({
  requireAuth: (...args: any[]) => mockRequireAuthAvailability(...args),
  getAuthSession: jest.fn(),
}))

// Mock NextResponse
const mockNextResponse = {
  json: jest.fn((data, options) => ({
    status: options?.status || 200,
    json: () => Promise.resolve(data),
  })),
}
jest.mock('next/server', () => ({
  NextResponse: mockNextResponse,
}))

// Mock models
const mockFindTherapistById = jest.fn()
const mockUpdateTherapistAvailability = jest.fn()
const mockGetBookingsByTherapistAndDateRange = jest.fn()
const mockValidateAvailabilityEntry = jest.fn()
const mockValidateBlockedSlot = jest.fn()

jest.mock('@/models/Therapist', () => ({
  findTherapistById: (...args: any[]) => mockFindTherapistById(...args),
  updateTherapistAvailability: (...args: any[]) => mockUpdateTherapistAvailability(...args),
  validateAvailabilityEntry: (...args: any[]) => mockValidateAvailabilityEntry(...args),
  validateBlockedSlot: (...args: any[]) => mockValidateBlockedSlot(...args),
}))

jest.mock('@/models/Booking', () => ({
  getBookingsByTherapistAndDateRange: (...args: any[]) => mockGetBookingsByTherapistAndDateRange(...args),
}))

jest.mock('@/lib/utils/availability', () => ({
  calculateAvailableSlots: jest.fn((therapist, startDate, endDate, bookings) => {
    return [
      {
        date: '2024-01-15',
        startTime: '09:00',
        endTime: '10:30',
        status: 'available',
        sessionStart: '09:00',
        sessionEnd: '10:00',
        breakStart: '10:00',
        breakEnd: '10:30',
      },
    ]
  }),
}))

describe('Availability API', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockValidateAvailabilityEntry.mockReturnValue(true)
    mockValidateBlockedSlot.mockReturnValue(true)
  })

  describe('PUT /api/therapist/availability', () => {
    test('should successfully update weekly availability', async () => {
      const mockSession = {
        user: {
          id: 'therapist-id-123',
          email: 'therapist@example.com',
        },
      }

      const mockTherapist = {
        _id: 'therapist-id-123',
        weeklyAvailability: [
          { dayOfWeek: 1, startTime: '09:00', endTime: '17:00' },
        ],
        blockedSlots: [],
      }

      mockRequireAuthAvailability.mockResolvedValue(mockSession)
      mockFindTherapistById.mockResolvedValue(mockTherapist)
      mockUpdateTherapistAvailability.mockResolvedValue({
        ...mockTherapist,
        weeklyAvailability: [
          { dayOfWeek: 1, startTime: '09:00', endTime: '17:00' },
          { dayOfWeek: 2, startTime: '10:00', endTime: '18:00' },
        ],
      })

      const { PUT } = require('@/app/api/therapist/availability/route')
      const request = new Request('http://localhost/api/therapist/availability', {
        method: 'PUT',
        body: JSON.stringify({
          weeklyAvailability: [
            { dayOfWeek: 1, startTime: '09:00', endTime: '17:00' },
            { dayOfWeek: 2, startTime: '10:00', endTime: '18:00' },
          ],
        }),
      })

      const response = await PUT(request)
      const responseData = await response.json()

      expect(mockRequireAuthAvailability).toHaveBeenCalled()
      expect(mockFindTherapistById).toHaveBeenCalledWith('therapist-id-123')
      expect(mockUpdateTherapistAvailability).toHaveBeenCalledWith(
        'therapist-id-123',
        expect.any(Array),
        undefined
      )
      expect(responseData.weeklyAvailability).toHaveLength(2)
      expect(responseData.message).toBe('Availability updated successfully')
    })

    test('should successfully update blocked slots', async () => {
      const mockSession = {
        user: {
          id: 'therapist-id-123',
        },
      }

      const mockTherapist = {
        _id: 'therapist-id-123',
        weeklyAvailability: [],
        blockedSlots: [],
      }

      mockRequireAuthAvailability.mockResolvedValue(mockSession)
      mockFindTherapistById.mockResolvedValue(mockTherapist)
      mockUpdateTherapistAvailability.mockResolvedValue({
        ...mockTherapist,
        blockedSlots: [
          { date: '2024-01-15', startTime: '12:00', endTime: '13:00' },
        ],
      })

      const { PUT } = require('@/app/api/therapist/availability/route')
      const request = new Request('http://localhost/api/therapist/availability', {
        method: 'PUT',
        body: JSON.stringify({
          blockedSlots: [
            { date: '2024-01-15', startTime: '12:00', endTime: '13:00' },
          ],
        }),
      })

      const response = await PUT(request)
      const responseData = await response.json()

      expect(responseData.blockedSlots).toHaveLength(1)
    })

    test('should update both weekly availability and blocked slots', async () => {
      const mockSession = {
        user: { id: 'therapist-id-123' },
      }

      mockRequireAuthAvailability.mockResolvedValue(mockSession)
      mockFindTherapistById.mockResolvedValue({ _id: 'therapist-id-123' })
      mockUpdateTherapistAvailability.mockResolvedValue({
        _id: 'therapist-id-123',
        weeklyAvailability: [{ dayOfWeek: 1, startTime: '09:00', endTime: '17:00' }],
        blockedSlots: [{ date: '2024-01-15', startTime: '12:00', endTime: '13:00' }],
      })

      const { PUT } = require('@/app/api/therapist/availability/route')
      const request = new Request('http://localhost/api/therapist/availability', {
        method: 'PUT',
        body: JSON.stringify({
          weeklyAvailability: [{ dayOfWeek: 1, startTime: '09:00', endTime: '17:00' }],
          blockedSlots: [{ date: '2024-01-15', startTime: '12:00', endTime: '13:00' }],
        }),
      })

      const response = await PUT(request)
      const responseData = await response.json()

      expect(mockUpdateTherapistAvailability).toHaveBeenCalledWith(
        'therapist-id-123',
        expect.any(Array),
        expect.any(Array)
      )
      expect(responseData.weeklyAvailability).toBeDefined()
      expect(responseData.blockedSlots).toBeDefined()
    })

    test('should reject invalid availability entry', async () => {
      const mockSession = {
        user: { id: 'therapist-id-123' },
      }

      mockRequireAuthAvailability.mockResolvedValue(mockSession)
      mockValidateAvailabilityEntry.mockReturnValue(false)

      const { PUT } = require('@/app/api/therapist/availability/route')
      const request = new Request('http://localhost/api/therapist/availability', {
        method: 'PUT',
        body: JSON.stringify({
          weeklyAvailability: [
            { dayOfWeek: 10, startTime: '09:00', endTime: '17:00' }, // Invalid day
          ],
        }),
      })

      const response = await PUT(request)

      expect(response.status).toBe(400)
      const responseData = await response.json()
      expect(responseData.error).toContain('Invalid availability entry')
    })

    test('should reject invalid blocked slot', async () => {
      const mockSession = {
        user: { id: 'therapist-id-123' },
      }

      mockRequireAuthAvailability.mockResolvedValue(mockSession)
      mockValidateBlockedSlot.mockReturnValue(false)

      const { PUT } = require('@/app/api/therapist/availability/route')
      const request = new Request('http://localhost/api/therapist/availability', {
        method: 'PUT',
        body: JSON.stringify({
          blockedSlots: [
            { date: 'invalid-date', startTime: '12:00', endTime: '13:00' },
          ],
        }),
      })

      const response = await PUT(request)

      expect(response.status).toBe(400)
      const responseData = await response.json()
      expect(responseData.error).toContain('Invalid blocked slot')
    })

    test('should reject unauthenticated requests', async () => {
      mockRequireAuthAvailability.mockRejectedValue(new Error('Unauthorized - Please login'))

      const { PUT } = require('@/app/api/therapist/availability/route')
      const request = new Request('http://localhost/api/therapist/availability', {
        method: 'PUT',
        body: JSON.stringify({
          weeklyAvailability: [],
        }),
      })

      const response = await PUT(request)

      expect(response.status).toBe(401)
      const responseData = await response.json()
      expect(responseData.error).toBe('Unauthorized')
    })

    test('should reject requests without any data', async () => {
      const mockSession = {
        user: { id: 'therapist-id-123' },
      }

      mockRequireAuthAvailability.mockResolvedValue(mockSession)

      const { PUT } = require('@/app/api/therapist/availability/route')
      const request = new Request('http://localhost/api/therapist/availability', {
        method: 'PUT',
        body: JSON.stringify({}),
      })

      const response = await PUT(request)

      expect(response.status).toBe(400)
      const responseData = await response.json()
      expect(responseData.error).toContain('Either weeklyAvailability or blockedSlots must be provided')
    })
  })

  describe('GET /api/therapist/availability', () => {
    test('should return current availability for authenticated therapist', async () => {
      const mockSession = {
        user: { id: 'therapist-id-123' },
      }

      const mockTherapist = {
        _id: 'therapist-id-123',
        weeklyAvailability: [
          { dayOfWeek: 1, startTime: '09:00', endTime: '17:00' },
        ],
        blockedSlots: [
          { date: '2024-01-15', startTime: '12:00', endTime: '13:00' },
        ],
      }

      mockRequireAuthAvailability.mockResolvedValue(mockSession)
      mockFindTherapistById.mockResolvedValue(mockTherapist)

      const { GET } = require('@/app/api/therapist/availability/route')
      const response = await GET()
      const responseData = await response.json()

      expect(mockRequireAuthAvailability).toHaveBeenCalled()
      expect(mockFindTherapistById).toHaveBeenCalledWith('therapist-id-123')
      expect(responseData.weeklyAvailability).toEqual(mockTherapist.weeklyAvailability)
      expect(responseData.blockedSlots).toEqual(mockTherapist.blockedSlots)
    })

    test('should reject unauthenticated requests', async () => {
      mockRequireAuthAvailability.mockRejectedValue(new Error('Unauthorized - Please login'))

      const { GET } = require('@/app/api/therapist/availability/route')
      const response = await GET()

      expect(response.status).toBe(401)
      const responseData = await response.json()
      expect(responseData.error).toBe('Unauthorized')
    })
  })

  describe('GET /api/therapist/[id]/availability', () => {
    test('should return available slots for valid date range', async () => {
      const mockTherapist = {
        _id: 'therapist-id-123',
        weeklyAvailability: [
          { dayOfWeek: 1, startTime: '09:00', endTime: '17:00' },
        ],
        blockedSlots: [],
      }

      mockFindTherapistById.mockResolvedValue(mockTherapist)
      mockGetBookingsByTherapistAndDateRange.mockResolvedValue([])

      const { GET } = require('@/app/api/therapist/[id]/availability/route')
      
      // Create a mock request with query params
      const url = new URL('http://localhost/api/therapist/therapist-id-123/availability')
      url.searchParams.set('startDate', '2024-01-15')
      url.searchParams.set('endDate', '2024-01-20')
      
      const request = new Request(url.toString())
      const params = Promise.resolve({ id: 'therapist-id-123' })
      
      const response = await GET(request, { params })
      const responseData = await response.json()

      expect(responseData.slots).toBeDefined()
      expect(responseData.therapistId).toBe('therapist-id-123')
      expect(responseData.startDate).toBe('2024-01-15')
      expect(responseData.endDate).toBe('2024-01-20')
    })

    test('should reject invalid therapist ID', async () => {
      const { GET } = require('@/app/api/therapist/[id]/availability/route')
      
      // Use an empty string which will fail ObjectId validation
      const url = new URL('http://localhost/api/therapist//availability')
      url.searchParams.set('startDate', '2024-01-15')
      url.searchParams.set('endDate', '2024-01-20')
      
      const request = new Request(url.toString())
      const params = Promise.resolve({ id: '' })
      
      const response = await GET(request, { params })

      expect(response.status).toBe(404)
      const responseData = await response.json()
      expect(responseData.error).toContain('Invalid therapist ID format')
    })

    test('should reject missing date parameters', async () => {
      const { GET } = require('@/app/api/therapist/[id]/availability/route')
      
      const url = new URL('http://localhost/api/therapist/therapist-id-123/availability')
      const request = new Request(url.toString())
      const params = Promise.resolve({ id: 'therapist-id-123' })
      
      const response = await GET(request, { params })

      expect(response.status).toBe(400)
      const responseData = await response.json()
      expect(responseData.error).toContain('startDate and endDate')
    })

    test('should reject invalid date format', async () => {
      const { GET } = require('@/app/api/therapist/[id]/availability/route')
      
      const url = new URL('http://localhost/api/therapist/therapist-id-123/availability')
      url.searchParams.set('startDate', '2024/01/15')
      url.searchParams.set('endDate', '2024-01-20')
      
      const request = new Request(url.toString())
      const params = Promise.resolve({ id: 'therapist-id-123' })
      
      const response = await GET(request, { params })

      expect(response.status).toBe(400)
      const responseData = await response.json()
      expect(responseData.error).toContain('Invalid date format')
    })

    test('should reject when startDate is after endDate', async () => {
      const { GET } = require('@/app/api/therapist/[id]/availability/route')
      
      const url = new URL('http://localhost/api/therapist/therapist-id-123/availability')
      url.searchParams.set('startDate', '2024-01-20')
      url.searchParams.set('endDate', '2024-01-15')
      
      const request = new Request(url.toString())
      const params = Promise.resolve({ id: 'therapist-id-123' })
      
      const response = await GET(request, { params })

      expect(response.status).toBe(400)
      const responseData = await response.json()
      expect(responseData.error).toContain('startDate must be before or equal to endDate')
    })

    test('should return 404 if therapist not found', async () => {
      mockFindTherapistById.mockResolvedValue(null)

      const { GET } = require('@/app/api/therapist/[id]/availability/route')
      
      // Use a valid ObjectId format (24 hex characters)
      const validObjectId = '507f1f77bcf86cd799439011'
      const url = new URL(`http://localhost/api/therapist/${validObjectId}/availability`)
      url.searchParams.set('startDate', '2024-01-15')
      url.searchParams.set('endDate', '2024-01-20')
      
      const request = new Request(url.toString())
      const params = Promise.resolve({ id: validObjectId })
      
      const response = await GET(request, { params })

      expect(response.status).toBe(404)
      const responseData = await response.json()
      expect(responseData.error).toBe('Therapist not found')
    })
  })
})

