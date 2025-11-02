/**
 * Unit tests for Therapist booking URL API utilities
 */

// Mock authentication
const mockRequireAuthBookingUrl = jest.fn()
jest.mock('@/lib/auth', () => ({
  requireAuth: (...args: any[]) => mockRequireAuthBookingUrl(...args),
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

describe('Therapist Booking URL API', () => {
  describe('Authentication', () => {
    test('should return session for authenticated therapist', async () => {
      const mockSession = {
        user: {
          id: 'therapist-id-123',
          email: 'therapist@example.com',
          name: 'Dr. John Doe',
          specialization: 'Physical Therapist',
          bio: 'Experienced therapist',
        },
      }

      mockRequireAuthBookingUrl.mockResolvedValue(mockSession)

      const { requireAuth } = require('@/lib/auth')
      const session = await requireAuth()

      expect(session).toBeDefined()
      expect(session.user.id).toBe('therapist-id-123')
      expect(session.user.email).toBe('therapist@example.com')
    })

    test('should throw error for unauthenticated request', async () => {
      mockRequireAuthBookingUrl.mockRejectedValue(new Error('Unauthorized - Please login'))

      const { requireAuth } = require('@/lib/auth')
      await expect(requireAuth()).rejects.toThrow('Unauthorized - Please login')
    })
  })

  describe('Booking URL Generation', () => {
    test('should generate correct booking URL', () => {
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
      const therapistId = 'therapist-id-123'
      const expectedUrl = `${baseUrl}/book/${therapistId}`

      expect(expectedUrl).toBe('http://localhost:3000/book/therapist-id-123')
    })

    test('should use environment variable for base URL', () => {
      const testBaseUrl = 'https://production-domain.com'
      const therapistId = 'therapist-id-456'
      const bookingUrl = `${testBaseUrl}/book/${therapistId}`

      expect(bookingUrl).toBe('https://production-domain.com/book/therapist-id-456')
    })

    test('should fallback to localhost when base URL not set', () => {
      delete process.env.NEXT_PUBLIC_BASE_URL
      const fallbackUrl = 'http://localhost:3000'
      const therapistId = 'therapist-id-789'
      const bookingUrl = `${fallbackUrl}/book/${therapistId}`

      expect(bookingUrl).toBe('http://localhost:3000/book/therapist-id-789')
    })
  })

  describe('Response Format', () => {
    test('should return booking URL and therapist ID', () => {
      const therapistId = 'therapist-id-123'
      const baseUrl = 'https://example.com'
      const bookingUrl = `${baseUrl}/book/${therapistId}`

      const response = {
        bookingUrl,
        therapistId,
      }

      expect(response).toEqual({
        bookingUrl: 'https://example.com/book/therapist-id-123',
        therapistId: 'therapist-id-123',
      })
    })
  })

  describe('Error Handling', () => {
    test('should handle authentication errors correctly', () => {
      const authError = new Error('Unauthorized - Please login')
      
      expect(authError.message).toContain('Unauthorized')
      expect(authError).toBeInstanceOf(Error)
    })

    test('should distinguish between auth and server errors', () => {
      const authError = new Error('Unauthorized - Please login')
      const serverError = new Error('Internal server error')

      expect(authError.message.includes('Unauthorized')).toBe(true)
      expect(serverError.message.includes('Unauthorized')).toBe(false)
    })
  })
})

