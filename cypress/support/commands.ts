/// <reference types="cypress" />

/**
 * Register a therapist via API
 */
Cypress.Commands.add('registerTherapist', (email, password, name, specialization, bio) => {
  cy.request({
    method: 'POST',
    url: '/api/auth/register',
    body: {
      email,
      password,
      name,
      specialization,
      bio,
    },
    failOnStatusCode: false,
  })
})

/**
 * Login as a therapist
 */
Cypress.Commands.add('loginTherapist', (email, password) => {
  cy.visit('/login')
  cy.url({ timeout: 5000 }).should('include', '/login')
  
  // Wait for form to be visible
  cy.get('input[name="email"]', { timeout: 5000 }).should('be.visible').type(email)
  cy.get('input[name="password"]').type(password)
  
  // Click Sign In and wait for redirect
  cy.contains('Sign In').click()
  
  // Wait for either success redirect or error message
  cy.url({ timeout: 10000 }).should((url) => {
    // Should be on dashboard or still on login with error
    expect(url.includes('/dashboard') || url.includes('/login')).to.be.true
  })
  
  // If we're still on login, there was an error
  cy.url().then((url) => {
    if (url.includes('/login')) {
      // Wait for error message
      cy.contains('Invalid email or password', { timeout: 3000 }).should('be.visible')
      throw new Error('Login failed')
    }
  })
  
  // If we got to dashboard, verify it loaded
  cy.url({ timeout: 10000 }).should('include', '/dashboard')
  cy.contains('Welcome back', { timeout: 5000 }).should('be.visible')
})

/**
 * Logout from dashboard
 */
Cypress.Commands.add('logoutTherapist', () => {
  cy.contains('Logout').click()
  cy.url().should('eq', Cypress.config().baseUrl + '/')
})

declare global {
  namespace Cypress {
    interface Chainable {
      registerTherapist(
        email: string,
        password: string,
        name: string,
        specialization: string,
        bio: string
      ): Chainable<void>
      loginTherapist(email: string, password: string): Chainable<void>
      logoutTherapist(): Chainable<void>
    }
  }
}

export {}

