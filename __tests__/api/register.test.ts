/**
 * Integration tests for therapist registration API
 */
import { POST } from '@/app/api/auth/register/route'
import { NextRequest } from 'next/server'

// Mock the Therapist model
jest.mock('@/models/Therapist', () => ({
  createTherapist: jest.fn(),
  findTherapistByEmail: jest.fn(),
  ensureEmailIndex: jest.fn(),
  hashPassword: jest.fn(),
}))

// Mock validation utilities
jest.mock('@/lib/utils/validation', () => ({
  isValidEmail: jest.fn(),
}))

describe('/api/auth/register', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('should register a new therapist successfully', async () => {
    const { createTherapist, findTherapistByEmail, hashPassword, ensureEmailIndex } = await import('@/models/Therapist')
    const { isValidEmail } = await import('@/lib/utils/validation')

    // Mock functions
    ;(ensureEmailIndex as jest.Mock).mockResolvedValue(undefined)
    ;(isValidEmail as jest.Mock).mockReturnValue(true)
    ;(findTherapistByEmail as jest.Mock).mockResolvedValue(null) // Email not taken
    ;(hashPassword as jest.Mock).mockResolvedValue('hashed_password_123')
    ;(createTherapist as jest.Mock).mockResolvedValue({
      _id: 'therapist_123',
      email: 'test@example.com',
      name: 'Dr. Test',
      specialization: 'Test Therapy',
      bio: 'Test bio',
      weeklyAvailability: [],
      blockedSlots: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    })

    const requestBody = {
      email: 'test@example.com',
      password: 'password123',
      name: 'Dr. Test',
      specialization: 'Test Therapy',
      bio: 'Test bio',
    }

    const request = new NextRequest('http://localhost:3000/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(requestBody),
      headers: { 'Content-Type': 'application/json' },
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(201)
    expect(data.message).toBe('Therapist registered successfully')
    expect(data.therapist).toBeDefined()
    expect(data.therapist.email).toBe('test@example.com')
    expect(data.therapist.password).toBeUndefined() // Password should not be returned
  })

  test('should reject duplicate email', async () => {
    const { findTherapistByEmail } = await import('@/models/Therapist')
    const { isValidEmail } = await import('@/lib/utils/validation')

    ;(isValidEmail as jest.Mock).mockReturnValue(true)
    ;(findTherapistByEmail as jest.Mock).mockResolvedValue({
      _id: 'existing_therapist',
      email: 'test@example.com',
    })

    const requestBody = {
      email: 'test@example.com',
      password: 'password123',
      name: 'Dr. Test',
      specialization: 'Test Therapy',
      bio: 'Test bio',
    }

    const request = new NextRequest('http://localhost:3000/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(requestBody),
      headers: { 'Content-Type': 'application/json' },
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(409)
    expect(data.error).toBe('Email already registered')
  })

  test('should reject invalid email format', async () => {
    const { isValidEmail } = await import('@/lib/utils/validation')

    ;(isValidEmail as jest.Mock).mockReturnValue(false)

    const requestBody = {
      email: 'invalid-email',
      password: 'password123',
      name: 'Dr. Test',
      specialization: 'Test Therapy',
      bio: 'Test bio',
    }

    const request = new NextRequest('http://localhost:3000/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(requestBody),
      headers: { 'Content-Type': 'application/json' },
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe('Invalid email format')
  })

  test('should handle server errors', async () => {
    const { findTherapistByEmail } = await import('@/models/Therapist')
    const { isValidEmail } = await import('@/lib/utils/validation')

    ;(isValidEmail as jest.Mock).mockReturnValue(true)
    ;(findTherapistByEmail as jest.Mock).mockRejectedValue(new Error('Database error'))

    const requestBody = {
      email: 'test@example.com',
      password: 'password123',
      name: 'Dr. Test',
      specialization: 'Test Therapy',
      bio: 'Test bio',
    }

    const request = new NextRequest('http://localhost:3000/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(requestBody),
      headers: { 'Content-Type': 'application/json' },
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data.error).toBe('Internal server error')
  })
})

