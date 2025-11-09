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

// Mock next-intl
jest.mock('next-intl', () => ({
  useTranslations: (namespace: string) => (key: string) => {
    const fullKey = namespace ? `${namespace}.${key}` : key
    const translations: Record<string, string> = {
      'landing.title': 'Health Worker Booking System',
      'landing.subtitle': 'Easily schedule appointments with qualified health professionals',
      'landing.bookAppointment': 'Book Appointment',
      'landing.viewProviders': 'View Providers',
      'landing.therapistLogin': 'Therapist Login',
      'landing.therapistRegister': 'Therapist Register',
      'landing.features.easyBooking.title': 'Easy Booking',
      'landing.features.qualifiedProfessionals.title': 'Qualified Professionals',
      'landing.features.secureSystem.title': 'Secure System',
    }
    return translations[fullKey] || fullKey
  },
  NextIntlClientProvider: ({ children }: { children: React.ReactNode }) => children
}))

import { render, screen } from '@testing-library/react'
import Home from '@/app/[locale]/page'

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

