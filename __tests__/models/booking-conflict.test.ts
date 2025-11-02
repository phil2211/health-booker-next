/**
 * Unit tests for Booking Conflict Detection
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

// Import after mocks are set up
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { ObjectId } = require('mongodb')
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { BookingStatus } = require('@/lib/types')
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { checkBookingConflict } = require('@/models/Booking')
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { getDatabase } = require('@/lib/mongodb')

// Mock console.log to avoid noise in tests
const originalConsoleLog = console.log
beforeAll(() => {
  console.log = jest.fn()
})

afterAll(() => {
  console.log = originalConsoleLog
})

describe('checkBookingConflict', () => {
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

  const therapistId = '507f1f77bcf86cd799439011'
  const appointmentDate = '2024-12-15'
  const startTime = '09:00'
  const endTime = '10:00'

  describe('should return false when no conflicts exist', () => {
    test('no existing bookings', async () => {
      mockCollection.find.mockReturnValue({
        toArray: jest.fn().mockResolvedValue([]),
      })

      const result = await checkBookingConflict(
        therapistId,
        appointmentDate,
        startTime,
        endTime
      )

      expect(result).toBe(false)
      expect(mockCollection.find).toHaveBeenCalled()
    })

    test('different therapist', async () => {
      mockCollection.find.mockReturnValue({
        toArray: jest.fn().mockResolvedValue([]),
      })

      const result = await checkBookingConflict(
        '507f1f77bcf86cd799439012', // Different therapist
        appointmentDate,
        startTime,
        endTime
      )

      expect(result).toBe(false)
    })

    test('different date', async () => {
      mockCollection.find.mockReturnValue({
        toArray: jest.fn().mockResolvedValue([]),
      })

      const result = await checkBookingConflict(
        therapistId,
        '2024-12-16', // Different date
        startTime,
        endTime
      )

      expect(result).toBe(false)
    })

    test('different time slot (before)', async () => {
      mockCollection.find.mockReturnValue({
        toArray: jest.fn().mockResolvedValue([]),
      })

      const result = await checkBookingConflict(
        therapistId,
        appointmentDate,
        '07:00', // Before existing
        '08:00',
      )

      expect(result).toBe(false)
    })

    test('different time slot (after)', async () => {
      mockCollection.find.mockReturnValue({
        toArray: jest.fn().mockResolvedValue([]),
      })

      const result = await checkBookingConflict(
        therapistId,
        appointmentDate,
        '11:00', // After existing
        '12:00',
      )

      expect(result).toBe(false)
    })

    test('adjacent time slot (end to start)', async () => {
      // Existing booking: 09:00-10:00
      // New booking: 10:00-11:00 (should not conflict)
      mockCollection.find.mockReturnValue({
        toArray: jest.fn().mockResolvedValue([
          {
            _id: new ObjectId(),
            therapistId: new ObjectId(therapistId),
            appointmentDate: appointmentDate,
            startTime: '09:00',
            endTime: '10:00',
            status: BookingStatus.CONFIRMED,
          },
        ]),
      })

      const result = await checkBookingConflict(
        therapistId,
        appointmentDate,
        '10:00',
        '11:00',
      )

      expect(result).toBe(false)
    })

    test('cancelled booking should not conflict', async () => {
      // Cancelled bookings are filtered out by the query, so they won't be returned
      mockCollection.find.mockReturnValue({
        toArray: jest.fn().mockResolvedValue([]), // Query filters out cancelled
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

  describe('should return true when conflicts exist', () => {
    test('exact same time slot', async () => {
      mockCollection.find.mockReturnValue({
        toArray: jest.fn().mockResolvedValue([
          {
            _id: new ObjectId(),
            therapistId: new ObjectId(therapistId),
            appointmentDate: appointmentDate,
            startTime: '09:00',
            endTime: '10:00',
            status: BookingStatus.CONFIRMED,
          },
        ]),
      })

      const result = await checkBookingConflict(
        therapistId,
        appointmentDate,
        '09:00',
        '10:00'
      )

      expect(result).toBe(true)
    })

    test('overlapping: new booking starts during existing', async () => {
      // Existing: 09:00-10:00
      // New: 09:30-10:30 (starts during existing)
      mockCollection.find.mockReturnValue({
        toArray: jest.fn().mockResolvedValue([
          {
            _id: new ObjectId(),
            therapistId: new ObjectId(therapistId),
            appointmentDate: appointmentDate,
            startTime: '09:00',
            endTime: '10:00',
            status: BookingStatus.CONFIRMED,
          },
        ]),
      })

      const result = await checkBookingConflict(
        therapistId,
        appointmentDate,
        '09:30',
        '10:30'
      )

      expect(result).toBe(true)
    })

    test('overlapping: new booking ends during existing', async () => {
      // Existing: 09:00-10:00
      // New: 08:30-09:30 (ends during existing)
      mockCollection.find.mockReturnValue({
        toArray: jest.fn().mockResolvedValue([
          {
            _id: new ObjectId(),
            therapistId: new ObjectId(therapistId),
            appointmentDate: appointmentDate,
            startTime: '09:00',
            endTime: '10:00',
            status: BookingStatus.CONFIRMED,
          },
        ]),
      })

      const result = await checkBookingConflict(
        therapistId,
        appointmentDate,
        '08:30',
        '09:30'
      )

      expect(result).toBe(true)
    })

    test('overlapping: new booking contains existing', async () => {
      // Existing: 09:30-09:45
      // New: 09:00-10:00 (contains existing)
      mockCollection.find.mockReturnValue({
        toArray: jest.fn().mockResolvedValue([
          {
            _id: new ObjectId(),
            therapistId: new ObjectId(therapistId),
            appointmentDate: appointmentDate,
            startTime: '09:30',
            endTime: '09:45',
            status: BookingStatus.CONFIRMED,
          },
        ]),
      })

      const result = await checkBookingConflict(
        therapistId,
        appointmentDate,
        '09:00',
        '10:00'
      )

      expect(result).toBe(true)
    })

    test('overlapping: existing booking contains new', async () => {
      // Existing: 08:00-11:00
      // New: 09:00-10:00 (contained in existing)
      mockCollection.find.mockReturnValue({
        toArray: jest.fn().mockResolvedValue([
          {
            _id: new ObjectId(),
            therapistId: new ObjectId(therapistId),
            appointmentDate: appointmentDate,
            startTime: '08:00',
            endTime: '11:00',
            status: BookingStatus.CONFIRMED,
          },
        ]),
      })

      const result = await checkBookingConflict(
        therapistId,
        appointmentDate,
        '09:00',
        '10:00'
      )

      expect(result).toBe(true)
    })
  })

  describe('query structure', () => {
    test('should query with correct therapistId as ObjectId', async () => {
      mockCollection.find.mockReturnValue({
        toArray: jest.fn().mockResolvedValue([]),
      })

      await checkBookingConflict(
        therapistId,
        appointmentDate,
        startTime,
        endTime
      )

      expect(mockDb.collection).toHaveBeenCalledWith('bookings')
      expect(mockCollection.find).toHaveBeenCalled()
      
      const query = mockCollection.find.mock.calls[0][0]
      expect(query).toHaveProperty('$and')
      expect(Array.isArray(query.$and)).toBe(true)
      
      // Check therapistId condition (first element of $and)
      const therapistIdCondition = query.$and[0]
      expect(therapistIdCondition).toHaveProperty('$or')
      expect(therapistIdCondition.$or).toHaveLength(2)
      expect(therapistIdCondition.$or[0].therapistId).toBeInstanceOf(ObjectId)
      expect(therapistIdCondition.$or[1].therapistId).toBe(therapistId)
      
      // Check appointmentDate (second element)
      expect(query.$and[1].appointmentDate).toBe(appointmentDate)
      
      // Check status (third element)
      expect(query.$and[2].status).toEqual({ $ne: BookingStatus.CANCELLED })
    })

    test('should check overlaps in memory', async () => {
      mockCollection.find.mockReturnValue({
        toArray: jest.fn().mockResolvedValue([]),
      })

      await checkBookingConflict(
        therapistId,
        appointmentDate,
        startTime,
        endTime
      )

      // Verify find was called and toArray was called
      expect(mockCollection.find).toHaveBeenCalled()
      const findResult = mockCollection.find.mock.results[0].value
      expect(findResult.toArray).toHaveBeenCalled()
    })
  })

  describe('debug: query structure analysis', () => {
    test('should log query structure for debugging', async () => {
      mockCollection.find.mockReturnValue({
        toArray: jest.fn().mockResolvedValue([]),
      })

      await checkBookingConflict(
        therapistId,
        appointmentDate,
        startTime,
        endTime
      )

      // Verify query structure
      const query = mockCollection.find.mock.calls[0][0]
      expect(query).toHaveProperty('$and')
      expect(query.$and).toHaveLength(3)
    })
  })
})

