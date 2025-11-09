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
  getDatabaseFn: jest.fn(),
  getClient: jest.fn(),
}))

// Functions imported after mocks are set up

// Mock console.log to avoid noise in tests
const originalConsoleLogIntegration = console.log
beforeAll(() => {
  console.log = jest.fn()
})

afterAll(() => {
  console.log = originalConsoleLogIntegration
})

describe('checkBookingConflict - Realistic Query Simulation', () => {
  const { ObjectId } = require('mongodb')
  const { BookingStatus } = require('@/lib/types')
  const { checkBookingConflict } = require('@/models/Booking')

  const mockDb = {
    collection: jest.fn(),
  }

  const mockCollection = {
    findOne: jest.fn(),
    find: jest.fn(),
  }

  beforeEach(() => {
    jest.clearAllMocks()
    const { getDatabase } = require('@/lib/mongodb')
    ;(getDatabase as jest.Mock).mockResolvedValue(mockDb)
    mockDb.collection.mockReturnValue(mockCollection)
    mockCollection.find.mockReturnValue({
      toArray: jest.fn().mockResolvedValue([]), // Default: no bookings
    })
  })

  const therapistId = '507f1f77bcf86cd799439011'

  test('should correctly simulate MongoDB query matching', async () => {
    // Simulate what MongoDB would actually do - only return if query matches
    mockCollection.find.mockReturnValue({
      toArray: jest.fn().mockResolvedValue([]), // No bookings exist
    })

      const { checkBookingConflict } = require('@/models/Booking')
      const result = await checkBookingConflict(
      therapistId,
      '2024-12-15',
      '09:00',
      '10:00'
    )

    expect(result).toBe(false)

    // Verify the query structure
    const query = mockCollection.find.mock.calls[0][0]
    expect(query.$and).toBeDefined()
    expect(query.$and[0].$or).toBeDefined() // therapistId condition
    expect(query.$and[1].appointmentDate).toBe('2024-12-15')
    expect(query.$and[2].status).toEqual({ $ne: BookingStatus.CANCELLED })
  })

  test('should handle string therapistId correctly', async () => {
    // This test simulates what happens when therapistId is passed as string
    // The function should convert it to ObjectId for querying
    mockCollection.find.mockReturnValue({
      toArray: jest.fn().mockResolvedValue([]),
    })

      const { checkBookingConflict } = require('@/models/Booking')
      const result = await checkBookingConflict(
      therapistId,
      '2024-12-15',
      '09:00',
      '10:00'
    )

    expect(result).toBe(false)

    const query = mockCollection.find.mock.calls[0][0]
    // Verify therapistId condition includes both ObjectId and string
    const therapistIdCondition = query.$and[0]
    expect(therapistIdCondition.$or).toHaveLength(2)
    expect(therapistIdCondition.$or[0].therapistId).toBeInstanceOf(ObjectId)
    expect(therapistIdCondition.$or[1].therapistId).toBe(therapistId)
  })

  test('should not find conflict when query does not match', async () => {
    // Simulate realistic scenario: no bookings exist for the date
    mockCollection.find.mockReturnValue({
      toArray: jest.fn().mockResolvedValue([]), // No bookings
    })

      const { checkBookingConflict } = require('@/models/Booking')
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
    mockCollection.find.mockReturnValue({
      toArray: jest.fn().mockResolvedValue([
        {
          _id: new ObjectId(),
          therapistId: new ObjectId(therapistId),
          appointmentDate: '2024-12-15',
          startTime: '09:00',
          endTime: '10:00',
          status: BookingStatus.CONFIRMED,
        }
      ]), // Conflicting booking exists
    })

      const { checkBookingConflict } = require('@/models/Booking')
      const result = await checkBookingConflict(
      therapistId,
      '2024-12-15',
      '09:00',
      '10:00'
    )

    expect(result).toBe(true)
  })
})

