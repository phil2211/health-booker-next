/**
 * E2E tests for authentication flows
 */
describe('Authentication Flow', () => {
  const therapistEmail = `test.therapist.${Date.now()}@example.com`
  const therapistPassword = 'testPassword123'
  const therapistName = 'Dr. Test Therapist'
  const therapistSpecialization = 'Test Therapy'
  const therapistBio = 'This is a test therapist bio'

  beforeEach(() => {
    cy.visit('/')
  })

  describe('Registration', () => {
    it('should successfully register a new therapist', () => {
      // Navigate to register page
      cy.contains('Therapist Register').click()
      cy.url().should('include', '/register')

      // Fill in registration form
      cy.get('input[name="email"]').type(therapistEmail)
      cy.get('input[name="password"]').type(therapistPassword)
      cy.get('input[name="confirmPassword"]').type(therapistPassword)
      cy.get('input[name="name"]').type(therapistName)
      cy.get('input[name="specialization"]').type(therapistSpecialization)
      cy.get('textarea[name="bio"]').type(therapistBio)

      // Submit form
      cy.contains('Create Account').click()

      // Should redirect to login page after successful registration
      cy.url().should('include', '/login')
    })

    it('should show error for passwords that do not match', () => {
      cy.contains('Therapist Register').click()

      cy.get('input[name="email"]').type(therapistEmail)
      cy.get('input[name="password"]').type('password123')
      cy.get('input[name="confirmPassword"]').type('differentPassword')
      cy.get('input[name="name"]').type(therapistName)
      cy.get('input[name="specialization"]').type(therapistSpecialization)
      cy.get('textarea[name="bio"]').type(therapistBio)

      cy.contains('Create Account').click()

      // Should show error message
      cy.contains('Passwords do not match').should('be.visible')
    })

    it('should show error for password shorter than 8 characters', () => {
      cy.contains('Therapist Register').click()

      cy.get('input[name="email"]').type(therapistEmail)
      cy.get('input[name="password"]').type('short')
      cy.get('input[name="confirmPassword"]').type('short')

      cy.contains('Create Account').click()

      // Browser validation should prevent submission (minLength=8)
      // Or custom validation message
      cy.get('input[name="password"]:invalid').should('exist')
    })
  })

  describe('Login', () => {
    it('should successfully log in with valid credentials', () => {
      // First, register a therapist
      cy.contains('Therapist Register').click()
      cy.get('input[name="email"]').type(therapistEmail)
      cy.get('input[name="password"]').type(therapistPassword)
      cy.get('input[name="confirmPassword"]').type(therapistPassword)
      cy.get('input[name="name"]').type(therapistName)
      cy.get('input[name="specialization"]').type(therapistSpecialization)
      cy.get('textarea[name="bio"]').type(therapistBio)
      cy.contains('Create Account').click()

      // Wait for redirect to login page
      cy.url().should('include', '/login')

      // Now login
      cy.contains('Therapist Login').click()
      cy.url().should('include', '/login')

      cy.get('input[name="email"]').type(therapistEmail)
      cy.get('input[name="password"]').type(therapistPassword)
      cy.contains('Sign In').click()

      // Should redirect to dashboard after successful login
      cy.url().should('include', '/dashboard')

      // Verify therapist name is displayed
      cy.contains(therapistName).should('be.visible')
    })

    it('should show error for invalid credentials', () => {
      cy.contains('Therapist Login').click()

      cy.get('input[name="email"]').type('wrong@example.com')
      cy.get('input[name="password"]').type('wrongPassword')
      cy.contains('Sign In').click()

      // Should show error message
      cy.contains('Invalid email or password').should('be.visible')
      cy.url().should('include', '/login') // Should still be on login page
    })

    it('should show error for missing credentials', () => {
      cy.contains('Therapist Login').click()
      cy.contains('Sign In').click()

      // Browser validation should prevent submission
      cy.get('input[name="email"]:invalid').should('exist')
      cy.get('input[name="password"]:invalid').should('exist')
    })
  })

  describe('Dashboard Access', () => {
    it('should redirect to login when accessing dashboard without authentication', () => {
      cy.visit('/dashboard')

      // Should redirect to login page
      cy.url().should('include', '/login')
    })

    it('should display therapist profile in dashboard after login', () => {
      // Register and login
      cy.contains('Therapist Register').click()
      cy.get('input[name="email"]').type(therapistEmail)
      cy.get('input[name="password"]').type(therapistPassword)
      cy.get('input[name="confirmPassword"]').type(therapistPassword)
      cy.get('input[name="name"]').type(therapistName)
      cy.get('input[name="specialization"]').type(therapistSpecialization)
      cy.get('textarea[name="bio"]').type(therapistBio)
      cy.contains('Create Account').click()

      cy.url().should('include', '/login')

      // Login
      cy.contains('Therapist Login').click()
      cy.get('input[name="email"]').type(therapistEmail)
      cy.get('input[name="password"]').type(therapistPassword)
      cy.contains('Sign In').click()

      // Should be on dashboard
      cy.url().should('include', '/dashboard')

      // Verify dashboard content
      cy.contains('Welcome back').should('be.visible')
      cy.contains(therapistName).should('be.visible')
      cy.contains(therapistSpecialization).should('be.visible')
      cy.contains(therapistBio).should('be.visible')

      // Verify booking URL is displayed
      cy.contains('Your Booking URL').should('be.visible')
      cy.contains('/book/').should('be.visible')
    })

    it('should allow logout from dashboard', () => {
      // Register and login
      cy.contains('Therapist Register').click()
      cy.get('input[name="email"]').type(therapistEmail)
      cy.get('input[name="password"]').type(therapistPassword)
      cy.get('input[name="confirmPassword"]').type(therapistPassword)
      cy.get('input[name="name"]').type(therapistName)
      cy.get('input[name="specialization"]').type(therapistSpecialization)
      cy.get('textarea[name="bio"]').type(therapistBio)
      cy.contains('Create Account').click()

      cy.contains('Therapist Login').click()
      cy.get('input[name="email"]').type(therapistEmail)
      cy.get('input[name="password"]').type(therapistPassword)
      cy.contains('Sign In').click()

      // Click logout button
      cy.contains('Logout').click()

      // Should redirect to home page
      cy.url().should('eq', Cypress.config().baseUrl + '/')
    })
  })

  describe('Navigation', () => {
    it('should navigate between login and register pages', () => {
      cy.contains('Therapist Login').click()
      cy.url().should('include', '/login')

      // Click register link
      cy.contains('Register here').click()
      cy.url().should('include', '/register')

      // Click login link
      cy.contains('Sign in here').click()
      cy.url().should('include', '/login')
    })

    it('should have back to home link', () => {
      cy.contains('Therapist Login').click()
      cy.url().should('include', '/login')

      cy.contains('Back to home').click()
      cy.url().should('eq', Cypress.config().baseUrl + '/')
    })
  })
})

