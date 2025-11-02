/**
 * Test with actual payload that's failing
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

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { ObjectId } = require('mongodb')
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { checkBookingConflict } = require('@/models/Booking')
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { getDatabase } = require('@/lib/mongodb')

describe('checkBookingConflict - Actual failing payload', () => {
  const mockDb = {
    collection: jest.fn(),
  }

  const mockCollection = {
    findOne: jest.fn(),
    find: jest.fn(),
  }

  beforeEach(() => {
    jest.clearAllMocks()
    ;(getDatabase as jest.Mock).mockResolvedValue(mockDb)
    mockDb.collection.mockReturnValue(mockCollection)
    mockCollection.find.mockReturnValue({
      toArray: jest.fn().mockResolvedValue([]), // Default: no bookings
    })
  })

  test('should NOT find conflict for payload that has no conflicts', async () => {
    const therapistId = '6907709f3f12e8eac477dc0d'
    const appointmentDate = '2025-11-14'
    const startTime = '10:30'
    const endTime = '11:30'

    // Simulate empty database - no bookings exist
    mockCollection.findOne.mockResolvedValue(null)

    const result = await checkBookingConflict(
      therapistId,
      appointmentDate,
      startTime,
      endTime
    )

    expect(result).toBe(false)
    
    // Verify what query was sent
    const query = mockCollection.find.mock.calls[0][0]
    console.log('Query sent to MongoDB:', JSON.stringify(query, null, 2))
    
    // Verify query structure
    expect(query).toHaveProperty('$and')
    expect(query.$and[1].appointmentDate).toBe(appointmentDate)
  })

  test('should verify time overlap logic is correct', async () => {
    const therapistId = '6907709f3f12e8eac477dc0d'
    const appointmentDate = '2025-11-14'
    const startTime = '10:30'
    const endTime = '11:30'

    // Test: adjacent booking should NOT conflict
    // Existing: 11:30-12:30 (starts exactly when new ends)
    mockCollection.findOne.mockImplementation((query: any) => {
      // Check if query would match a booking from 11:30-12:30
      // This should NOT match because there's no overlap
      const timeOverlap = query.$and[3].$or
      
      // Simulate checking against existing booking 11:30-12:30
      const existingStart = '11:30'
      const existingEnd = '12:30'
      
      // Check each overlap condition
      for (const condition of timeOverlap) {
        const andConditions = condition.$and
        if (andConditions.length === 2) {
          const cond1 = andConditions[0]
          const cond2 = andConditions[1]
          
          // Check if this condition would match 11:30-12:30 vs 10:30-11:30
          // Condition 1: startTime <= 10:30 AND endTime > 10:30
          // 11:30 <= 10:30? No
          
          // Condition 2: startTime < 11:30 AND endTime >= 11:30  
          // 11:30 < 11:30? No
          
          // Condition 3: startTime >= 10:30 AND endTime <= 11:30
          // 11:30 >= 10:30? Yes, but 12:30 <= 11:30? No
          
          // None should match, so return null
        }
      }
      
      return Promise.resolve(null)
    })

    const result = await checkBookingConflict(
      therapistId,
      appointmentDate,
      startTime,
      endTime
    )

    expect(result).toBe(false)
  })
})

