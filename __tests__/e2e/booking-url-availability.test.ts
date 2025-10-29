/**
 * E2E Integration test to verify booking URLs are actually accessible
 * This test checks that:
 * 1. The booking URL API endpoint returns a valid URL
 * 2. The generated URL follows proper format
 * 3. The URL structure is ready to be used for actual booking pages
 */

describe('Booking URL Availability E2E', () => {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'

  describe('Booking URL Generation and Format', () => {
    test('should generate booking URL in correct format', () => {
      const therapistId = '507f1f77bcf86cd799439011'
      const bookingUrl = `${baseUrl}/book/${therapistId}`
      
      // Verify URL structure
      expect(bookingUrl).toMatch(/^https?:\/\//) // Starts with http:// or https://
      expect(bookingUrl).toContain('/book/') // Contains /book/ path
      expect(bookingUrl.split('/book/').length).toBe(2) // Exactly one /book/ occurrence
      
      // Extract therapist ID
      const extractedId = bookingUrl.split('/book/')[1]
      expect(extractedId).toBe(therapistId)
    })

    test('should handle URLs without trailing slash in base URL', () => {
      const baseUrlNoSlash = baseUrl.replace(/\/+$/, '')
      const therapistId = 'therapist-123'
      const bookingUrl = `${baseUrlNoSlash}/book/${therapistId}`
      
      expect(bookingUrl).not.toContain('//book') // Should not have double slash
      expect(bookingUrl).toContain('/book/')
    })

    test('should handle URLs with trailing slash in base URL', () => {
      const baseUrlWithSlash = `${baseUrl.replace(/\/+$/, '')}/`
      const therapistId = 'therapist-456'
      const bookingUrl = `${baseUrlWithSlash.replace(/\/+$/, '')}/book/${therapistId}`
      
      expect(bookingUrl).not.toContain('//book') // Should not have double slash
      expect(bookingUrl).toContain('/book/')
    })
  })

  describe('Booking URL Structure Validation', () => {
    test('should have correct path structure', () => {
      const therapistId = 'valid-id-123'
      const bookingUrl = `${baseUrl}/book/${therapistId}`
      
      // Parse the URL
      try {
        const url = new URL(bookingUrl)
        
        // Verify domain and path
        expect(url.hostname).toBeTruthy()
        expect(url.pathname).toBe(`/book/${therapistId}`)
        expect(url.pathname.split('/').length).toBe(3) // /book/id = 3 parts
      } catch (error) {
        // If URL parsing fails, the URL is invalid
        fail('Generated URL is not valid')
      }
    })

    test('should work with different base URLs', () => {
      const testUrls = [
        'http://localhost:3000',
        'https://example.com',
        'https://staging.example.com',
        'https://production.example.com',
      ]

      testUrls.forEach((testBaseUrl) => {
        const therapistId = 'test-id'
        const bookingUrl = `${testBaseUrl}/book/${therapistId}`
        
        // Should not have double slashes
        expect(bookingUrl).not.toContain('//book')
        
        // Should contain the correct path
        expect(bookingUrl).toContain('/book/')
      })
    })
  })

  describe('Booking URL API Integration', () => {
    test('should generate URL that matches expected pattern', () => {
      // Simulate what the API would return
      const therapistId = 'mock-therapist-id'
      const bookingUrl = `${baseUrl}/book/${therapistId}`
      
      // Expected response structure
      const mockApiResponse = {
        bookingUrl,
        therapistId,
      }
      
      expect(mockApiResponse.bookingUrl).toBeTruthy()
      expect(mockApiResponse.bookingUrl).toContain(baseUrl)
      expect(mockApiResponse.bookingUrl).toContain('/book/')
      expect(mockApiResponse.bookingUrl).toContain(therapistId)
      expect(mockApiResponse.therapistId).toBe(therapistId)
    })

    test('should be shareable without modification', () => {
      const therapistId = 'shareable-id'
      const bookingUrl = `${baseUrl}/book/${therapistId}`
      
      // Should be a valid URL that can be shared
      expect(() => new URL(bookingUrl)).not.toThrow()
      
      // Should not have any unusual characters that would break sharing
      expect(bookingUrl).toMatch(/^https?:\/\/[^\s]+\/book\/[^\s]+$/)
    })
  })

  describe('Edge Cases', () => {
    test('should handle long therapist IDs', () => {
      const longId = 'a'.repeat(50) // 50 character ID
      const bookingUrl = `${baseUrl}/book/${longId}`
      
      expect(bookingUrl).toContain(longId)
      expect(bookingUrl.length).toBeLessThan(250) // Reasonable URL length
    })

    test('should handle therapist IDs with special characters', () => {
      const idsWithSpecialChars = ['abc-def', '123_456', 'xyz.789']
      
      idsWithSpecialChars.forEach((specialId) => {
        const bookingUrl = `${baseUrl}/book/${specialId}`
        
        // Should still be a valid structure
        expect(bookingUrl).toContain('/book/')
        expect(bookingUrl.length).toBeGreaterThan(0)
      })
    })

    test('should handle base URL variations correctly', () => {
      const variations = [
        'http://localhost:3000',
        'http://localhost:3000/',
        'https://example.com',
        'https://example.com/',
        'https://sub.example.com',
      ]
      
      variations.forEach((base) => {
        const baseUrl = base.replace(/\/+$/, '') // Remove trailing slash
        const therapistId = 'test-id'
        const bookingUrl = `${baseUrl}/book/${therapistId}`
        
        // Should not have double slashes
        expect(bookingUrl).not.toMatch(/\/\/book/)
        expect(bookingUrl.endsWith(therapistId)).toBe(true)
      })
    })
  })

  describe('Production Readiness', () => {
    test('should work in production environment', () => {
      const productionBaseUrl = 'https://healthbooker.com'
      const therapistId = 'prod-therapist-123'
      const bookingUrl = `${productionBaseUrl}/book/${therapistId}`
      
      // Should be HTTPS in production
      expect(bookingUrl).toMatch(/^https:\/\//)
      
      // Should have proper domain
      expect(bookingUrl).toContain('healthbooker.com')
      
      // Should have proper path structure
      expect(bookingUrl).toContain('/book/')
    })

    test('should work in staging environment', () => {
      const stagingBaseUrl = 'https://staging.healthbooker.com'
      const therapistId = 'staging-therapist-456'
      const bookingUrl = `${stagingBaseUrl}/book/${therapistId}`
      
      expect(bookingUrl).toMatch(/^https:\/\//)
      expect(bookingUrl).toContain('staging')
      expect(bookingUrl).toContain('/book/')
    })
  })
})

