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
  cy.get('input[name="email"]').type(email)
  cy.get('input[name="password"]').type(password)
  cy.contains('Sign In').click()
  cy.url().should('include', '/dashboard')
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

