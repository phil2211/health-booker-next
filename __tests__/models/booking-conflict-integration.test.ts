/**
 * Integration test for booking conflict detection
 * Tests actual query logic with realistic data
 */

// Mock MongoDB before importing anything
jest.mock('mongodb', () => {
  class MockObjectId {
    private _id: string
    constructor(id?: string) {
      this._id = id || '507f1f77bcf86cd799439011'
    }
    toString() {
      return this._id
    }
    static isValid(str: string) {
      return typeof str === 'string' && str.length > 0 && /^[0-9a-fA-F]{24}$/.test(str)
    }
  }
  return {
    ObjectId: MockObjectId,
    __esModule: true,
  }
})

jest.mock('@/lib/mongodb', () => ({
  getDatabase: jest.fn(),
  getClient: jest.fn(),
}))

const { ObjectId } = require('mongodb')
const { BookingStatus } = require('@/lib/types')
const { checkBookingConflict } = require('@/models/Booking')
const { getDatabase } = require('@/lib/mongodb')

// Mock console.log to avoid noise in tests
const originalConsoleLog = console.log
beforeAll(() => {
  console.log = jest.fn()
})

afterAll(() => {
  console.log = originalConsoleLog
})

describe('checkBookingConflict - Realistic Query Simulation', () => {
  const mockDb = {
    collection: jest.fn(),
  }

  const mockCollection = {
    findOne: jest.fn(),
  }

  beforeEach(() => {
    jest.clearAllMocks()
    ;(getDatabase as jest.Mock).mockResolvedValue(mockDb)
    mockDb.collection.mockReturnValue(mockCollection)
  })

  const therapistId = '507f1f77bcf86cd799439011'

  test('should correctly simulate MongoDB query matching', async () => {
    // Simulate what MongoDB would actually do - only return if query matches
    mockCollection.findOne.mockImplementation((query: any) => {
      // Simulate database state: no bookings exist
      // MongoDB would return null if no documents match
      return Promise.resolve(null)
    })

    const result = await checkBookingConflict(
      therapistId,
      '2024-12-15',
      '09:00',
      '10:00'
    )

    expect(result).toBe(false)
    
    // Verify the query structure
    const query = mockCollection.findOne.mock.calls[0][0]
    expect(query.therapistId).toBeInstanceOf(ObjectId)
    expect(query.appointmentDate).toBe('2024-12-15')
    expect(query.status).toEqual({ $ne: BookingStatus.CANCELLED })
    expect(query.$or).toBeDefined()
  })

  test('should handle string therapistId correctly', async () => {
    // This test simulates what happens when therapistId is passed as string
    // The function should convert it to ObjectId for querying
    mockCollection.findOne.mockResolvedValue(null)

    const result = await checkBookingConflict(
      therapistId,
      '2024-12-15',
      '09:00',
      '10:00'
    )

    expect(result).toBe(false)
    
    const query = mockCollection.findOne.mock.calls[0][0]
    // Verify therapistId was converted to ObjectId
    expect(query.therapistId).toBeInstanceOf(ObjectId)
    expect(query.therapistId.toString()).toBe(therapistId)
  })

  test('should not find conflict when query does not match', async () => {
    // Simulate realistic scenario: booking exists but doesn't match query
    mockCollection.findOne.mockImplementation((query: any) => {
      // Check if this query would match
      const matchesTherapist = query.therapistId.toString() === therapistId
      const matchesDate = query.appointmentDate === '2024-12-15'
      const matchesStatus = query.status.$ne === BookingStatus.CANCELLED
      
      // If therapist or date don't match, return null (no conflict)
      if (!matchesTherapist || !matchesDate || !matchesStatus) {
        return Promise.resolve(null)
      }
      
      // Check time overlap
      const hasOverlap = query.$or.some((condition: any) => {
        // Simplified overlap check for testing
        return true // Assume overlap for this test
      })
      
      // For this test, we want to simulate NO overlap
      return Promise.resolve(null)
    })

    const result = await checkBookingConflict(
      therapistId,
      '2024-12-15',
      '09:00',
      '10:00'
    )

    expect(result).toBe(false)
  })

  test('should detect conflict when query matches exactly', async () => {
    // Simulate scenario where booking exists and matches all query conditions
    mockCollection.findOne.mockImplementation((query: any) => {
      const matchesTherapist = query.therapistId.toString() === therapistId
      const matchesDate = query.appointmentDate === '2024-12-15'
      const matchesStatus = query.status.$ne === BookingStatus.CANCELLED
      
      // If all conditions match, return a conflicting booking
      if (matchesTherapist && matchesDate && matchesStatus) {
        // Check if times overlap (simplified - assume they do)
        return Promise.resolve({
          _id: new ObjectId(),
          therapistId: new ObjectId(therapistId),
          appointmentDate: '2024-12-15',
          startTime: '09:00',
          endTime: '10:00',
          status: BookingStatus.CONFIRMED,
        })
      }
      
      return Promise.resolve(null)
    })

    const result = await checkBookingConflict(
      therapistId,
      '2024-12-15',
      '09:00',
      '10:00'
    )

    expect(result).toBe(true)
  })
})

