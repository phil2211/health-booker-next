/**
 * Unit tests for Therapist model and authentication
 */
import { hashPassword, comparePassword, validateTherapistInput } from '@/models/Therapist'
import { isValidEmail, isStrongPassword } from '@/lib/utils/validation'

describe('Therapist Authentication', () => {
  describe('Password Hashing', () => {
    test('should hash password successfully', async () => {
      const plainPassword = 'testPassword123'
      const hashedPassword = await hashPassword(plainPassword)
      
      expect(hashedPassword).toBeDefined()
      expect(hashedPassword.length).toBeGreaterThan(0)
      expect(hashedPassword).not.toBe(plainPassword)
    })

    test('should hash different passwords differently', async () => {
      const password1 = 'password1'
      const password2 = 'password2'
      
      const hash1 = await hashPassword(password1)
      const hash2 = await hashPassword(password2)
      
      expect(hash1).not.toBe(hash2)
    })

    test('should verify correct password', async () => {
      const plainPassword = 'correctPassword123'
      const hashedPassword = await hashPassword(plainPassword)
      
      const isValid = await comparePassword(plainPassword, hashedPassword)
      expect(isValid).toBe(true)
    })

    test('should reject incorrect password', async () => {
      const plainPassword = 'correctPassword123'
      const wrongPassword = 'wrongPassword123'
      const hashedPassword = await hashPassword(plainPassword)
      
      const isValid = await comparePassword(wrongPassword, hashedPassword)
      expect(isValid).toBe(false)
    })
  })

  describe('Input Validation', () => {
    test('should validate correct therapist input', () => {
      const therapist = {
        email: 'test@example.com',
        password: 'strongPassword123',
        name: 'Dr. John Doe',
        specialization: 'Physical Therapist',
        bio: 'Experienced therapist with 10 years of practice',
      }

      const result = validateTherapistInput(therapist)
      expect(result.valid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    test('should reject missing email', () => {
      const therapist = {
        password: 'strongPassword123',
        name: 'Dr. John Doe',
        specialization: 'Physical Therapist',
        bio: 'Experienced therapist',
      }

      const result = validateTherapistInput(therapist)
      expect(result.valid).toBe(false)
      expect(result.errors).toContain('Email is required')
    })

    test('should reject invalid email format', () => {
      const therapist = {
        email: 'invalid-email',
        password: 'strongPassword123',
        name: 'Dr. John Doe',
        specialization: 'Physical Therapist',
        bio: 'Experienced therapist',
      }

      const result = validateTherapistInput(therapist)
      expect(result.valid).toBe(false)
      expect(result.errors).toContain('Invalid email format')
    })

    test('should reject password shorter than 8 characters', () => {
      const therapist = {
        email: 'test@example.com',
        password: 'short',
        name: 'Dr. John Doe',
        specialization: 'Physical Therapist',
        bio: 'Experienced therapist',
      }

      const result = validateTherapistInput(therapist)
      expect(result.valid).toBe(false)
      expect(result.errors).toContain('Password must be at least 8 characters long')
    })

    test('should reject missing required fields', () => {
      const therapist = {
        email: 'test@example.com',
        password: 'strongPassword123',
      }

      const result = validateTherapistInput(therapist)
      expect(result.valid).toBe(false)
      expect(result.errors.length).toBeGreaterThan(0)
    })
  })
})

describe('Validation Utilities', () => {
  describe('Email Validation', () => {
    test('should validate correct email formats', () => {
      expect(isValidEmail('user@example.com')).toBe(true)
      expect(isValidEmail('test.user@domain.co.uk')).toBe(true)
      expect(isValidEmail('user+tag@example.com')).toBe(true)
    })

    test('should reject invalid email formats', () => {
      expect(isValidEmail('invalid-email')).toBe(false)
      expect(isValidEmail('user@')).toBe(false)
      expect(isValidEmail('@domain.com')).toBe(false)
      expect(isValidEmail('user@domain')).toBe(false)
      expect(isValidEmail('')).toBe(false)
    })
  })

  describe('Password Strength Validation', () => {
    test('should accept passwords with 8 or more characters', () => {
      expect(isStrongPassword('password123')).toBe(true)
      expect(isStrongPassword('12345678')).toBe(true)
      expect(isStrongPassword('qwertyui')).toBe(true)
    })

    test('should reject passwords shorter than 8 characters', () => {
      expect(isStrongPassword('1234567')).toBe(false)
      expect(isStrongPassword('pass')).toBe(false)
      expect(isStrongPassword('')).toBe(false)
    })
  })
})

