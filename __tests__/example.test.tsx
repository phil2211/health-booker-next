import { render, screen } from '@testing-library/react'
import Home from '@/app/page'

// Mock next-auth to avoid ES module issues
jest.mock('next-auth/react', () => ({
  useSession: () => ({
    data: null,
    status: 'unauthenticated'
  }),
  signIn: jest.fn(),
  signOut: jest.fn()
}))

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    refresh: jest.fn(),
    prefetch: jest.fn()
  })
}))

describe('Home Page', () => {
  it('renders the heading', () => {
    render(<Home />)
    const heading = screen.getByText(/Health Worker Booking System/i)
    expect(heading).toBeInTheDocument()
  })

  it('renders the book appointment link', () => {
    render(<Home />)
    const link = screen.getByText(/Book Appointment/i)
    expect(link).toBeInTheDocument()
  })
})

