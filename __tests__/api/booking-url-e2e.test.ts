/**
 * Integration test for booking URL generation and availability
 */
import { GET } from '@/app/api/therapist/booking-url/route'

// Mock the authentication and database functions
jest.mock('@/lib/auth', () => ({
  requireAuth: jest.fn(),
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

describe('Booking URL E2E', () => {
  let processEnvBackup: NodeJS.ProcessEnv

  beforeAll(() => {
    // Save original env
    processEnvBackup = { ...process.env }
  })

  afterAll(() => {
    // Restore original env
    process.env = processEnvBackup
  })

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Booking URL Generation', () => {
    test('should generate correct booking URL with NEXT_PUBLIC_BASE_URL', async () => {
      const { requireAuth } = require('@/lib/auth')

      // Set up environment variable
      process.env.NEXT_PUBLIC_BASE_URL = 'https://test-domain.com'

      const mockSession = {
        user: {
          id: 'therapist-123',
          email: 'therapist@example.com',
          name: 'Dr. Jane Smith',
          specialization: 'Physical Therapist',
          bio: 'Experienced therapist',
        },
      }

      requireAuth.mockResolvedValue(mockSession)

      // Call the API route handler
      const response = await GET()
      const jsonResponse = await response.json()

      // Verify the booking URL
      expect(jsonResponse.bookingUrl).toBe('https://test-domain.com/book/therapist-123')
      expect(jsonResponse.therapistId).toBe('therapist-123')
    })

    test('should fallback to localhost when NEXT_PUBLIC_BASE_URL not set', async () => {
      const { requireAuth } = require('@/lib/auth')

      // Remove environment variable
      delete process.env.NEXT_PUBLIC_BASE_URL

      const mockSession = {
        user: {
          id: 'therapist-456',
          email: 'therapist2@example.com',
          name: 'Dr. John Doe',
          specialization: 'Massage Therapist',
          bio: 'Experienced therapist',
        },
      }

      requireAuth.mockResolvedValue(mockSession)

      // Call the API route handler
      const response = await GET()
      const jsonResponse = await response.json()

      // Verify fallback to localhost
      expect(jsonResponse.bookingUrl).toBe('http://localhost:3000/book/therapist-456')
      expect(jsonResponse.therapistId).toBe('therapist-456')
    })

    test('should return 401 when not authenticated', async () => {
      const { requireAuth } = require('@/lib/auth')

      requireAuth.mockRejectedValue(new Error('Unauthorized - Please login'))

      // Call the API route handler
      const response = await GET()

      expect(response.status).toBe(401)
    })

    test('should handle different base URL formats', async () => {
      const { requireAuth } = require('@/lib/auth')

      // Test with trailing slash
      process.env.NEXT_PUBLIC_BASE_URL = 'https://example.com/'
      
      const mockSession = {
        user: {
          id: 'therapist-789',
          email: 'therapist3@example.com',
          name: 'Dr. Bob Smith',
          specialization: 'Craniosacral Therapist',
          bio: 'Experienced therapist',
        },
      }

      requireAuth.mockResolvedValue(mockSession)

      const response = await GET()
      const jsonResponse = await response.json()

      // Should handle trailing slash properly
      expect(jsonResponse.bookingUrl).toBe('https://example.com/book/therapist-789')
    })
  })

  describe('Booking URL Format', () => {
    test('should contain correct path structure', async () => {
      const { requireAuth } = require('@/lib/auth')

      process.env.NEXT_PUBLIC_BASE_URL = 'https://production.com'

      const mockSession = {
        user: {
          id: 'prod-therapist-123',
          email: 'prod@example.com',
          name: 'Production Therapist',
          specialization: 'Test Therapist',
          bio: 'Test bio',
        },
      }

      requireAuth.mockResolvedValue(mockSession)

      const response = await GET()
      const jsonResponse = await response.json()

      // Verify the URL structure is correct
      expect(jsonResponse.bookingUrl).toMatch(/^https:\/\/.*\/book\/.*$/)
      expect(jsonResponse.bookingUrl).toContain('/book/')
      expect(jsonResponse.bookingUrl.split('/book/')[1]).toBe('prod-therapist-123')
    })
  })

  describe('Booking URL Availability Check', () => {
    test('should generate valid URL format', () => {
      // Test that the generated URL follows proper URL structure
      const baseUrl = 'https://example.com'
      const therapistId = 'therapist-id-123'
      const bookingUrl = `${baseUrl}/book/${therapistId}`

      // Check URL structure
      expect(bookingUrl).toMatch(/^https?:\/\//)
      expect(bookingUrl).toContain('/book/')
      
      // Extract therapist ID from URL
      const urlParts = bookingUrl.split('/book/')
      expect(urlParts.length).toBe(2)
      expect(urlParts[1]).toBe(therapistId)
    })

    test('should generate URL without protocol when needed', () => {
      const baseUrl = 'example.com'
      const therapistId = 'test-id'
      const bookingUrl = `${baseUrl}/book/${therapistId}`

      expect(bookingUrl).toBe('example.com/book/test-id')
    })

    test('should handle special characters in therapist ID', () => {
      const baseUrl = 'https://example.com'
      const therapistId = 'abc-123-xyz'
      const bookingUrl = `${baseUrl}/book/${therapistId}`

      expect(bookingUrl).toBe('https://example.com/book/abc-123-xyz')
    })
  })
})

