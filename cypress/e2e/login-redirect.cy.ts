/**
 * E2E test specifically for login redirect verification
 */
describe('Login Redirect Test', () => {
  const therapistEmail = `test.therapist.${Date.now()}@example.com`
  const therapistPassword = 'testPassword123'
  const therapistName = 'Dr. Test Therapist'
  const therapistSpecialization = 'Test Therapy'
  const therapistBio = 'This is a test therapist bio'

  beforeEach(() => {
    // Start from home page
    cy.visit('/')
  })

  it('should redirect to dashboard after successful login', () => {
    // Step 1: Register a new therapist
    cy.contains('Therapist Register').click()
    cy.url().should('include', '/register')

    cy.get('input[name="email"]').type(therapistEmail)
    cy.get('input[name="password"]').type(therapistPassword)
    cy.get('input[name="confirmPassword"]').type(therapistPassword)
    cy.get('input[name="name"]').type(therapistName)
    cy.get('input[name="specialization"]').type(therapistSpecialization)
    cy.get('textarea[name="bio"]').type(therapistBio)

    cy.contains('Create Account').click()

    // Should redirect to login page
    cy.url().should('include', '/login', { timeout: 10000 })

    // Step 2: Login with the registered credentials
    cy.get('input[name="email"]').type(therapistEmail)
    cy.get('input[name="password"]').type(therapistPassword)
    cy.contains('Sign In').click()

    // Step 3: Verify redirect to dashboard
    // Wait for URL to change to dashboard
    cy.url({ timeout: 10000 }).should('include', '/dashboard')

    // Step 4: Verify dashboard content is displayed
    cy.contains('Welcome back', { timeout: 10000 }).should('be.visible')
    cy.contains(therapistName, { timeout: 10000 }).should('be.visible')
    cy.contains('HealthBooker', { timeout: 10000 }).should('be.visible')
    
    // Verify logout button exists
    cy.contains('Logout').should('be.visible')

    console.log('✅ Login redirect test passed')
  })

  it('should show error and stay on login page for invalid credentials', () => {
    cy.contains('Therapist Login').click()
    cy.url().should('include', '/login')

    cy.get('input[name="email"]').type('invalid@example.com')
    cy.get('input[name="password"]').type('wrongPassword123')
    cy.contains('Sign In').click()

    // Should show error message
    cy.contains('Invalid email or password', { timeout: 5000 }).should('be.visible')
    
    // Should still be on login page
    cy.url().should('include', '/login')
  })
})

