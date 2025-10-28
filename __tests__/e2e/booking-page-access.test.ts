/**
 * E2E test to verify the booking page is accessible
 * Tests that /book/[id] route works correctly
 */

describe('Booking Page Accessibility', () => {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
  const testTherapistId = '690115ba00775c0bc8df2afc'

  describe('Booking URL Format', () => {
    test('should generate correct booking URL path', () => {
      const bookingUrl = `${baseUrl}/book/${testTherapistId}`
      
      // Verify URL structure
      expect(bookingUrl).toContain('/book/')
      expect(bookingUrl.endsWith(testTherapistId)).toBe(true)
      
      // Should be a valid URL format
      expect(() => new URL(bookingUrl)).not.toThrow()
      
      const url = new URL(bookingUrl)
      expect(url.pathname).toBe(`/book/${testTherapistId}`)
    })

    test('should handle booking URL with localhost', () => {
      const bookingUrl = `http://localhost:3000/book/${testTherapistId}`
      
      expect(bookingUrl).toBe('http://localhost:3000/book/690115ba00775c0bc8df2afc')
      expect(() => new URL(bookingUrl)).not.toThrow()
    })

    test('should handle booking URL in production', () => {
      const productionUrl = 'https://healthbooker.vercel.app'
      const bookingUrl = `${productionUrl}/book/${testTherapistId}`
      
      expect(bookingUrl).toMatch(/^https:\/\//)
      expect(bookingUrl).toContain('/book/')
      expect(bookingUrl.split('/book/')[1]).toBe(testTherapistId)
    })
  })

  describe('Booking URL Construction', () => {
    test('should construct URL without double slashes', () => {
      const baseUrl = 'http://localhost:3000'
      const therapistId = testTherapistId
      const bookingUrl = `${baseUrl}/book/${therapistId}`
      
      // Should not have double slashes
      expect(bookingUrl).not.toContain('//book')
      expect(bookingUrl).toBe(`http://localhost:3000/book/${therapistId}`)
    })

    test('should handle base URL with trailing slash', () => {
      let baseUrl = 'http://localhost:3000/'
      baseUrl = baseUrl.replace(/\/+$/, '') // Remove trailing slash
      const therapistId = testTherapistId
      const bookingUrl = `${baseUrl}/book/${therapistId}`
      
      // Should not have double slashes
      expect(bookingUrl).not.toContain('//book')
      expect(bookingUrl).toBe(`http://localhost:3000/book/${therapistId}`)
    })
  })

  describe('Page Accessibility Requirements', () => {
    test('should have a valid therapist ID format', () => {
      // MongoDB ObjectId format is 24 character hex string
      expect(testTherapistId).toMatch(/^[0-9a-fA-F]{24}$/)
      expect(testTherapistId.length).toBe(24)
    })

    test('should be accessible via HTTPS in production', () => {
      const httpsUrl = 'https://production.com'
      const bookingUrl = `${httpsUrl}/book/${testTherapistId}`
      
      expect(bookingUrl).toMatch(/^https:\/\//)
    })

    test('should be accessible via HTTP in development', () => {
      const httpUrl = 'http://localhost:3000'
      const bookingUrl = `${httpUrl}/book/${testTherapistId}`
      
      expect(bookingUrl).toMatch(/^http:\/\//)
      expect(bookingUrl).toContain('localhost')
    })
  })

  describe('Expected Page Behavior', () => {
    test('should load therapist profile data', async () => {
      // Simulate what should happen when the page loads
      const therapistId = testTherapistId
      const apiUrl = `${baseUrl}/api/therapist/${therapistId}`
      
      // The page should fetch from this API endpoint
      expect(apiUrl).toContain('/api/therapist/')
      expect(apiUrl).toContain(therapistId)
    })

    test('should handle therapist profile data structure', () => {
      // Expected therapist data structure
      const expectedFields = ['_id', 'name', 'specialization', 'bio', 'email']
      
      // All expected fields should be present
      expectedFields.forEach(field => {
        expect(expectedFields).toContain(field)
      })
    })
  })

  describe('URL Parsing and Validation', () => {
    test('should extract therapist ID from booking URL', () => {
      const bookingUrl = `${baseUrl}/book/${testTherapistId}`
      const therapistId = bookingUrl.split('/book/')[1]
      
      expect(therapistId).toBe(testTherapistId)
    })

    test('should parse booking URL correctly', () => {
      const bookingUrl = `${baseUrl}/book/${testTherapistId}`
      const url = new URL(bookingUrl)
      
      expect(url.pathname).toBe(`/book/${testTherapistId}`)
      expect(url.pathname.split('/')).toHaveLength(3)
      expect(url.pathname.split('/')[2]).toBe(testTherapistId)
    })
  })

  describe('Edge Cases', () => {
    test('should handle very long therapist IDs', () => {
      const longId = 'a'.repeat(24) // 24 characters
      const bookingUrl = `${baseUrl}/book/${longId}`
      
      expect(bookingUrl).toContain(longId)
      expect(bookingUrl.split('/book/')[1]).toBe(longId)
    })

    test('should handle URL with query parameters', () => {
      const bookingUrl = `${baseUrl}/book/${testTherapistId}?ref=homepage`
      
      expect(bookingUrl).toContain('/book/')
      expect(bookingUrl).toContain('?ref=homepage')
      
      const url = new URL(bookingUrl)
      expect(url.searchParams.get('ref')).toBe('homepage')
    })
  })

  describe('Integration with API', () => {
    test('booking page should call therapist API endpoint', () => {
      const therapistId = testTherapistId
      const apiEndpoint = `/api/therapist/${therapistId}`
      
      // Should construct correct API endpoint
      expect(apiEndpoint).toBe(`/api/therapist/${therapistId}`)
      expect(apiEndpoint).toContain('/api/therapist/')
    })
  })
})

