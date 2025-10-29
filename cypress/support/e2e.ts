// ***********************************************************
// This example support/e2e.ts is processed and
// loaded automatically before your test files.
//
// This is a great place to put global configuration and
// behavior that modifies Cypress.
//
// You can change the location of this file or turn off
// automatically serving support files with the
// 'supportFile' configuration option.
//
// You can read more here:
// https://on.cypress.io/configuration
// ***********************************************************

// Import commands.js using ES2015 syntax:
import './commands'

// Alternatively you can use CommonJS syntax:
// require('./commands')

// Handle uncaught exceptions (database errors, network issues, etc.)
Cypress.on('uncaught:exception', (err, runnable) => {
  // Ignore errors related to database connection in test environment
  if (err.message.includes('MongoServerError') || 
      err.message.includes('ECONNREFUSED') ||
      err.message.includes('network')) {
    return false // Prevents Cypress from failing the test
  }
  // Return true to allow other errors to fail the test
  return true
})

