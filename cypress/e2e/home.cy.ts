describe('Home Page', () => {
  beforeEach(() => {
    cy.visit('/')
  })

  it('should display the main heading', () => {
    cy.contains('Health Worker Booking System').should('be.visible')
  })

  it('should have working navigation links', () => {
    cy.contains('Book Appointment').should('be.visible')
    cy.contains('View Providers').should('be.visible')
  })

  it('should navigate to booking page when clicking Book Appointment', () => {
    cy.contains('Book Appointment').click()
    cy.url().should('include', '/bookings')
  })
})

