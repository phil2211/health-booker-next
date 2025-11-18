import { render, screen, fireEvent } from '@testing-library/react'
import LanguageSwitcher from '@/components/LanguageSwitcher'
import { LocaleProvider } from '@/lib/i18n/LocaleProvider'

// Mock next/navigation
jest.mock('next/navigation', () => ({
  usePathname: () => '/',
  useRouter: () => ({
    push: jest.fn(),
  }),
}))

// Mock window.location
const mockLocation = {
  href: '/',
}
Object.defineProperty(window, 'location', {
  value: mockLocation,
  writable: true,
})

describe('LanguageSwitcher', () => {
  beforeEach(() => {
    // Reset location before each test
    mockLocation.href = '/'
    // Clear cookies
    document.cookie.split(";").forEach((c) => {
      document.cookie = c
        .replace(/^ +/, "")
        .replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/")
    })
  })

  it('renders language buttons', () => {
    render(
      <LocaleProvider>
        <LanguageSwitcher />
      </LocaleProvider>
    )

    expect(screen.getByText('EN')).toBeInTheDocument()
    expect(screen.getByText('DE')).toBeInTheDocument()
  })

  it('highlights current locale', () => {
    render(
      <LocaleProvider>
        <LanguageSwitcher />
      </LocaleProvider>
    )

    // Default locale should be 'en'
    const enButton = screen.getByText('EN')
    const deButton = screen.getByText('DE')

    expect(enButton).toHaveClass('bg-indigo-600', 'text-white')
    expect(deButton).not.toHaveClass('bg-indigo-600')
  })

  it('calls setLocale when clicking language button', () => {
    render(
      <LocaleProvider>
        <LanguageSwitcher />
      </LocaleProvider>
    )

    const deButton = screen.getByText('DE')
    fireEvent.click(deButton)

    // Check if cookie was set
    expect(document.cookie).toContain('NEXT_LOCALE=de')

    // Check if location.href was set (navigation occurred)
    expect(mockLocation.href).toBe('/de')
  })

  it('navigates to correct URL when switching from English to German', () => {
    // Mock pathname as if we're on English page
    jest.doMock('next/navigation', () => ({
      usePathname: () => '/',
      useRouter: () => ({
        push: jest.fn(),
      }),
    }))

    render(
      <LocaleProvider>
        <LanguageSwitcher />
      </LocaleProvider>
    )

    const deButton = screen.getByText('DE')
    fireEvent.click(deButton)

    expect(mockLocation.href).toBe('/de')
  })
})
