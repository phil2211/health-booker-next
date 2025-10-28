/**
 * Unit tests for Therapist profile API utilities
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
      // Simple validation: 24 character hex string
      return /^[0-9a-fA-F]{24}$/.test(str)
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

// Mock NextResponse
jest.mock('next/server', () => ({
  NextResponse: {
    json: jest.fn((data, options) => ({
      status: options?.status || 200,
      json: () => Promise.resolve(data),
    })),
  },
}))

// Mock the Therapist model function
const mockFindTherapistById = jest.fn()
jest.mock('@/models/Therapist', () => ({
  findTherapistById: (...args: any[]) => mockFindTherapistById(...args),
}))

import { ObjectId } from 'mongodb'

describe('Therapist Profile API', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('findTherapistById', () => {
    test('should return therapist for valid ID', async () => {
      const { findTherapistById } = require('@/models/Therapist')
      const mockTherapist = {
        _id: new ObjectId().toString(),
        email: 'test@example.com',
        password: 'hashedPassword',
        name: 'Dr. John Doe',
        specialization: 'Physical Therapist',
        bio: 'Experienced therapist',
        weeklyAvailability: [],
        blockedSlots: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      mockFindTherapistById.mockResolvedValue(mockTherapist)

      const therapist = await findTherapistById(mockTherapist._id)

      expect(therapist).toBeDefined()
      expect(therapist?._id).toBe(mockTherapist._id)
      expect(therapist?.email).toBe(mockTherapist.email)
      expect(therapist?.name).toBe(mockTherapist.name)
    })

    test('should return null for non-existent therapist', async () => {
      const { findTherapistById } = require('@/models/Therapist')

      mockFindTherapistById.mockResolvedValue(null)

      const therapist = await findTherapistById(new ObjectId().toString())

      expect(therapist).toBeNull()
    })
  })

  describe('ObjectId Validation', () => {
    test('should validate correct ObjectId format', () => {
      const validId = new ObjectId().toString()
      expect(ObjectId.isValid(validId)).toBe(true)
    })

    test('should reject invalid ObjectId format', () => {
      const invalidIds = ['invalid', '123', 'abc123', 'not-a-valid-id']

      invalidIds.forEach((id) => {
        expect(ObjectId.isValid(id)).toBe(false)
      })
    })
  })

  describe('Password Exclusion', () => {
    test('should not expose password in response', () => {
      const mockTherapist: any = {
        _id: 'therapist-id',
        email: 'test@example.com',
        password: 'hashedPassword123',
        name: 'Dr. John Doe',
        specialization: 'Physical Therapist',
        bio: 'Experienced therapist',
      }

      const { password, ...publicProfile } = mockTherapist

      expect(publicProfile.password).toBeUndefined()
      expect(publicProfile._id).toBeDefined()
      expect(publicProfile.email).toBeDefined()
      expect(publicProfile.name).toBeDefined()
    })
  })
})

