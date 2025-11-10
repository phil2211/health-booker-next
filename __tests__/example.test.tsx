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
      'pages.dashboard.dashboardTitle': 'Dashboard',
      'pages.dashboard.welcome': 'Welcome',
      'pages.dashboard.totalAvailability': 'Total Availability',
      'pages.dashboard.blockedSlots': 'Blocked Slots',
      'pages.dashboard.profileStatus': 'Profile Status',
      'pages.dashboard.yourProfile': 'Your Profile',
      'pages.dashboard.availabilityManagement': 'Availability Management',
      'pages.dashboard.viewAppointments': 'View Appointments',
      'common.logout': 'Logout',
    }
    return translations[fullKey] || fullKey
  },
  getTranslations: (namespace: string) => async (key: string) => {
    const fullKey = namespace ? `${namespace}.${key}` : key
    const translations: Record<string, string> = {
      'pages.dashboard.dashboardTitle': 'Dashboard',
      'pages.dashboard.welcome': 'Welcome',
      'pages.dashboard.welcomeBack': 'Welcome back',
      'pages.dashboard.manageAppointments': 'Manage your appointments, availability, and profile settings',
      'pages.dashboard.totalAvailability': 'Total Availability',
      'pages.dashboard.blockedSlots': 'Blocked Slots',
      'pages.dashboard.profileStatus': 'Profile Status',
      'pages.dashboard.yourProfile': 'Your Profile',
      'pages.dashboard.availabilityManagement': 'Availability Management',
      'pages.dashboard.viewAppointments': 'View Appointments',
      'pages.availability.manageAvailability': 'Manage Availability',
      'pages.availability.setWeeklySchedule': 'Set your weekly recurring schedule and block specific dates when you\'re not available',
      'pages.appointments.overview': 'Appointments Overview',
      'pages.appointments.viewManageAppointments': 'View and manage all your scheduled appointments',
      'common.logout': 'Logout',
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

