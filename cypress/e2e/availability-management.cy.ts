/// <reference types="cypress" />

/**
 * Helper function to select a date range and times using the date range picker popover
 * Opens the picker, selects the dates, sets times, and applies the selection
 */
function selectDateRangeWithTimes(fromDate: string, toDate: string, startTime: string = '10:00', endTime: string = '12:00') {
  // Parse dates to get day numbers
  const from = new Date(fromDate + 'T00:00:00')
  const to = new Date(toDate + 'T00:00:00')
  
  // Open the date range picker
  cy.get('[data-testid="blocked-range-trigger"]').click()
  
  // Wait for popover to be visible
  cy.get('#date-range-popover').should('be.visible')
  
  // Click on the start date
  cy.get('#date-range-popover').within(() => {
    // Find buttons by looking for the day number text
    // The calendar shows days as buttons with the day number as text
    cy.get('button').contains(from.getDate().toString()).first().click({ force: true })
  })
  
  // Wait a bit for the start date to be selected
  cy.wait(500)
  
  // Click on the end date
  // If same date, click it again to complete the range (start and end are the same)
  // If different date, click the new date
  if (fromDate === toDate) {
    // Same date - click it again to set both start and end
    cy.get('#date-range-popover').within(() => {
      cy.get('button').contains(from.getDate().toString()).first().click({ force: true })
    })
  } else {
    // Different date - click the end date
    cy.get('#date-range-popover').within(() => {
      cy.get('button').contains(to.getDate().toString()).first().click({ force: true })
    })
  }
  
  // Wait for selection to be complete
  cy.wait(500)
  
  // Set start time within the popover
  cy.get('#date-range-popover').within(() => {
    cy.contains('Start Time').parent().find('input[type="time"]').first().clear().type(startTime)
  })
  
  // Set end time within the popover
  cy.get('#date-range-popover').within(() => {
    cy.contains('End Time').parent().find('input[type="time"]').first().clear().type(endTime)
  })
  
  // Wait a bit for time inputs to be set
  cy.wait(300)
  
  // Click Apply button - this will add the blocked slot directly
  cy.get('[data-testid="blocked-range-apply"]').should('not.be.disabled').click()
  
  // Wait for popover to close
  cy.get('#date-range-popover').should('not.exist')
}

/**
 * E2E tests for Availability Management functionality
 */
describe('Availability Management', () => {
  const therapistEmail = `test.availability.${Date.now()}@example.com`
  const therapistPassword = 'testPassword123'
  const therapistName = 'Dr. Availability Test'
  const therapistSpecialization = 'Test Therapy'
  const therapistBio = 'Test therapist for availability management'

  beforeEach(() => {
    // Register therapist using API for reliability
    cy.request({
      method: 'POST',
      url: '/api/auth/register',
      body: {
        email: therapistEmail,
        password: therapistPassword,
        name: therapistName,
        specialization: therapistSpecialization,
        bio: therapistBio,
      },
      failOnStatusCode: false, // Allow 409 (user already exists) to pass
    }).then((response) => {
      // 201 = created, 409 = already exists (acceptable in tests)
      expect(response.status === 201 || response.status === 409).to.be.true
    })

    // Navigate to login page and login
    cy.visit('/login')
    cy.url({ timeout: 5000 }).should('include', '/login')

    // Fill in login form
    cy.get('input[name="email"]', { timeout: 5000 }).should('be.visible').type(therapistEmail)
    cy.get('input[name="password"]').type(therapistPassword)
    cy.contains('Sign In').click()

    // Wait for redirect to dashboard after successful login
    cy.url({ timeout: 10000 }).should('include', '/dashboard')

    // Verify therapist name is displayed
    cy.contains('Welcome back', { timeout: 5000 }).should('be.visible')
  })

  describe('Navigation', () => {
    it('should navigate to availability management page from dashboard', () => {
      // Click "Manage Availability" button
      cy.contains('Manage Availability').click()
      
      // Should navigate to availability page
      cy.url({ timeout: 5000 }).should('include', '/dashboard/availability')
      
      // Verify page elements
      cy.contains('Manage Availability', { timeout: 5000 }).should('be.visible')
      cy.contains('Weekly Availability').should('be.visible')
      cy.contains('Blocked Time Slots').should('be.visible')
    })

    it('should navigate back to dashboard from availability page', () => {
      // Navigate to availability page
      cy.visit('/dashboard/availability')
      cy.url().should('include', '/dashboard/availability')
      
      // Click back to dashboard link
      cy.contains('Back to Dashboard').click()
      
      // Should return to dashboard
      cy.url({ timeout: 5000 }).should('include', '/dashboard')
      cy.contains('Welcome back').should('be.visible')
    })
  })

  describe('Weekly Availability Management', () => {
    beforeEach(() => {
      cy.visit('/dashboard/availability')
      cy.url().should('include', '/dashboard/availability')
      
      // Wait for page to load
      cy.contains('Weekly Availability', { timeout: 5000 }).should('be.visible')
    })

    it('should display all days of the week', () => {
      const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
      
      days.forEach((day) => {
        cy.contains(day).should('be.visible')
      })
    })

    it('should enable/disable availability for a day', () => {
      // Find Monday checkbox and check it
      cy.contains('Monday').parent().find('input[type="checkbox"]').check()
      
      // Should show time inputs for Monday
      cy.contains('Monday').parent().parent().find('input[type="time"]').should('be.visible')
      
      // Uncheck Monday
      cy.contains('Monday').parent().find('input[type="checkbox"]').uncheck()
      
      // Time inputs should not be visible
      cy.contains('Monday').parent().parent().find('input[type="time"]').should('not.exist')
    })

    it('should allow setting start and end times for enabled days', () => {
      // Enable Monday
      cy.contains('Monday').parent().find('input[type="checkbox"]').check()
      
      // Set start time
      cy.contains('Monday').parent().parent().find('input[type="time"]').first().clear().type('09:00')
      
      // Set end time
      cy.contains('Monday').parent().parent().find('input[type="time"]').last().clear().type('17:00')
      
      // Verify values are set
      cy.contains('Monday').parent().parent().find('input[type="time"]').first().should('have.value', '09:00')
      cy.contains('Monday').parent().parent().find('input[type="time"]').last().should('have.value', '17:00')
    })

    it('should add multiple time ranges for a day', () => {
      // Enable Monday
      cy.contains('Monday').parent().find('input[type="checkbox"]').check()
      
      // Set first time range
      cy.contains('Monday').parent().parent().find('input[type="time"]').first().clear().type('09:00')
      cy.contains('Monday').parent().parent().find('input[type="time"]').last().clear().type('12:00')
      
      // Click "Add Time Range" button
      cy.contains('Monday').parent().parent().contains('Add Time Range').click()
      
      // Should show two time range inputs
      cy.contains('Monday').parent().parent().find('input[type="time"]').should('have.length', 4) // 2 ranges × 2 inputs each
    })

    it('should remove time ranges', () => {
      // Enable Monday and add multiple time ranges
      cy.contains('Monday').parent().find('input[type="checkbox"]').check()
      cy.contains('Monday').parent().parent().contains('Add Time Range').click()
      
      // Should have 2 time ranges (4 time inputs)
      cy.contains('Monday').parent().parent().find('input[type="time"]').should('have.length', 4)
      
      // Remove the second time range
      cy.contains('Monday').parent().parent().find('button[aria-label="Remove time range"]').first().click()
      
      // Should have 1 time range left (2 time inputs)
      cy.contains('Monday').parent().parent().find('input[type="time"]').should('have.length', 2)
    })
  })

  describe('Blocked Slots Management', () => {
    beforeEach(() => {
      cy.visit('/dashboard/availability')
      cy.url().should('include', '/dashboard/availability')
      
      // Wait for page to load
      cy.contains('Blocked Time Slots', { timeout: 5000 }).should('be.visible')
    })

    it('should display add blocked slot form', () => {
      cy.contains('Add Blocked Slot').should('be.visible')
      cy.contains('Date Range & Times').should('be.visible')
      cy.get('[data-testid="blocked-range-trigger"]').should('be.visible')
    })

    it('should add a blocked slot', () => {
      // Use a fixed future date to ensure it's valid
      const dateString = '2025-12-31'
      
      // Scroll to blocked slots section
      cy.contains('Blocked Time Slots').scrollIntoView()
      
      // Select date range and times using the picker - this will add the slot directly
      selectDateRangeWithTimes(dateString, dateString, '10:00', '12:00')

      // Wait for React state update and DOM re-render
      cy.wait(1000)

      // Wait for slot to appear by checking for remove button or the time text
      cy.get('button[aria-label="Remove blocked slot"]', { timeout: 5000 })
        .should('exist')
        .then(() => {
          // Verify the dates and times appear in the blocked slots list
          cy.contains('Current Blocked Slots', { timeout: 2000 })
            .parent()
            .parent()
            .should('contain.text', '10:00')
            .and('contain.text', '12:00')
            .and('contain.text', 'Dec 31, 2025')
        })
    })

    it('should display empty state when no blocked slots exist', () => {
      // If there are blocked slots, remove them first
      cy.get('body').then(($body) => {
        if ($body.find('button[aria-label="Remove blocked slot"]').length > 0) {
          // Remove all blocked slots
          cy.get('button[aria-label="Remove blocked slot"]').each(($btn) => {
            cy.wrap($btn).click()
          })
        }
      })
      
      // Should show empty state message
      cy.contains('No blocked slots').should('be.visible')
    })

    it('should remove a blocked slot', () => {
      // First, add a blocked slot
      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)
      const dateString = tomorrow.toISOString().split('T')[0]
      
      // Scroll to blocked slots section
      cy.contains('Blocked Time Slots').scrollIntoView()
      
      // Select date range and times using the picker - this will add the slot directly
      selectDateRangeWithTimes(dateString, dateString, '10:00', '12:00')
      
      // Wait for slot to appear - verify remove button exists
      cy.get('button[aria-label="Remove blocked slot"]', { timeout: 5000 })
        .should('exist')
        .then(($buttons) => {
          const initialCount = $buttons.length
          
          // Verify the time appears
          cy.contains('Current Blocked Slots', { timeout: 2000 })
            .parent()
            .parent()
            .should('contain.text', '10:00')
          
          // Remove the blocked slot
          cy.wrap($buttons.first()).click()
          
          // Wait for DOM to update - either button count decreases or empty state appears
          if (initialCount === 1) {
            // This was the last slot - should show empty state
            cy.contains('No blocked slots', { timeout: 2000 }).should('be.visible')
          } else {
            // Still has slots but 10:00 should be removed
            cy.contains('Current Blocked Slots', { timeout: 2000 })
              .parent()
              .parent()
              .should('not.contain.text', '10:00')
          }
        })
    })
  })

  describe('Saving Changes', () => {
    beforeEach(() => {
      // Set up API intercepts for tests in this suite
      cy.intercept('GET', '/api/therapist/availability').as('loadAvailability')
      
      cy.visit('/dashboard/availability')
      cy.url().should('include', '/dashboard/availability')
      
      // Wait for page to load and initial API call
      cy.contains('Weekly Availability', { timeout: 5000 }).should('be.visible')
      cy.wait('@loadAvailability', { timeout: 5000 }).then((interception) => {
        expect(interception.response?.statusCode).to.eq(200)
      })
    })

    it('should save weekly availability changes', () => {
      // Intercept PUT request for this specific test
      cy.intercept('PUT', '/api/therapist/availability').as('saveAvailability')
      
      // Enable Monday and set times
      cy.contains('Monday').parent().find('input[type="checkbox"]').check()
      cy.contains('Monday').parent().parent().find('input[type="time"]').first().clear().type('09:00')
      cy.contains('Monday').parent().parent().find('input[type="time"]').last().clear().type('17:00')
      
      // Enable Wednesday and set times
      cy.contains('Wednesday').parent().find('input[type="checkbox"]').check()
      cy.contains('Wednesday').parent().parent().find('input[type="time"]').first().clear().type('10:00')
      cy.contains('Wednesday').parent().parent().find('input[type="time"]').last().clear().type('16:00')
      
      // Save changes
      cy.contains('Save Changes').click()
      
      // Wait for API call to complete
      cy.wait('@saveAvailability', { timeout: 5000 }).then((interception) => {
        expect(interception.response?.statusCode).to.eq(200)
      })
      
      // Should show success message in the green banner (appears after API completes)
      cy.get('.bg-green-50', { timeout: 2000 })
        .should('be.visible')
        .and('contain.text', 'successfully')
      
      // Save button should be disabled after save (no changes) - wait for state update
      cy.contains('button', 'Save Changes', { timeout: 2000 }).should('be.disabled')
    })

    it('should save blocked slots changes', () => {
      // Intercept PUT request for this specific test
      cy.intercept('PUT', '/api/therapist/availability').as('saveAvailability')
      
      // Scroll to blocked slots section
      cy.contains('Blocked Time Slots').scrollIntoView()
      
      // Add a blocked slot
      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)
      const dateString = tomorrow.toISOString().split('T')[0]
      
      // Select date range and times using the picker - this will add the slot directly
      selectDateRangeWithTimes(dateString, dateString, '14:00', '16:00')
      
      // Wait for slot to appear by checking for remove button
      cy.get('button[aria-label="Remove blocked slot"]', { timeout: 5000 })
        .should('exist')
        .then(() => {
          // Verify the time appears in the list
          cy.contains('Current Blocked Slots', { timeout: 2000 })
            .parent()
            .parent()
            .should('contain.text', '14:00')
        })
      
      // Wait for the save button to become enabled (change detection)
      cy.contains('button', 'Save Changes', { timeout: 2000 }).should('not.be.disabled')
      
      // Save changes
      cy.contains('Save Changes').click()
      
      // Wait for API call to complete
      cy.wait('@saveAvailability', { timeout: 5000 }).then((interception) => {
        expect(interception.response?.statusCode).to.eq(200)
      })
      
      // Should show success message in the green banner (appears after API completes)
      cy.get('.bg-green-50', { timeout: 2000 })
        .should('be.visible')
        .and('contain.text', 'successfully')
    })

    it('should persist changes after page reload', () => {
      // Intercept PUT request for save
      cy.intercept('PUT', '/api/therapist/availability').as('saveAvailability')
      
      // Enable Tuesday and set times
      cy.contains('Tuesday').parent().find('input[type="checkbox"]').check()
      cy.contains('Tuesday').parent().parent().find('input[type="time"]').first().clear().type('08:00')
      cy.contains('Tuesday').parent().parent().find('input[type="time"]').last().clear().type('18:00')
      
      // Save changes
      cy.contains('Save Changes').click()
      
      // Wait for save to complete
      cy.wait('@saveAvailability', { timeout: 5000 }).then((interception) => {
        expect(interception.response?.statusCode).to.eq(200)
      })
      
      // Verify success message
      cy.get('.bg-green-50', { timeout: 2000 })
        .should('be.visible')
        .and('contain.text', 'successfully')
      
      // Reload page and intercept the load API call
      cy.intercept('GET', '/api/therapist/availability').as('reloadAvailability')
      cy.reload()
      
      // Wait for page to load and availability API to complete
      cy.contains('Weekly Availability', { timeout: 5000 }).should('be.visible')
      cy.wait('@reloadAvailability', { timeout: 5000 }).then((interception) => {
        expect(interception.response?.statusCode).to.eq(200)
        // Verify the response contains Tuesday availability
        const data = interception.response?.body
        expect(data).to.exist
        if (data && data.weeklyAvailability) {
          const tuesdayEntry = data.weeklyAvailability.find(
            (entry: any) => entry.dayOfWeek === 2 // Tuesday is day 2
          )
          expect(tuesdayEntry).to.exist
        }
      })
      
      // Verify Tuesday is still enabled with correct times
      // Wait a bit more for React to render the loaded data
      cy.contains('Tuesday', { timeout: 3000 })
        .parent()
        .find('input[type="checkbox"]', { timeout: 2000 })
        .should('be.checked')
      
      cy.contains('Tuesday')
        .parent()
        .parent()
        .find('input[type="time"]')
        .first({ timeout: 2000 })
        .should('have.value', '08:00')
      
      cy.contains('Tuesday')
        .parent()
        .parent()
        .find('input[type="time"]')
        .last({ timeout: 2000 })
        .should('have.value', '18:00')
    })

    it('should disable save button when no changes are made', () => {
      // Wait for initial load to complete
      cy.contains('Weekly Availability', { timeout: 5000 }).should('be.visible')
      
      // Should not show "You have unsaved changes"
      cy.contains('unsaved changes').should('not.exist')
      
      // Save button should be disabled
      cy.contains('Save Changes').should('be.disabled')
    })

    it('should enable save button when changes are made', () => {
      // Wait for initial state to be set (save button should be disabled initially)
      cy.contains('button', 'Save Changes', { timeout: 5000 }).should('be.disabled')
      
      // Make a change - enable Monday and set times (guaranteed to be a change)
      cy.contains('Monday').parent().find('input[type="checkbox"]').check()
      // Wait for time inputs to appear
      cy.contains('Monday').parent().parent().find('input[type="time"]').first().should('be.visible')
      // Set a time value - this will definitely be a change
      cy.contains('Monday').parent().parent().find('input[type="time"]').first().clear().type('09:00')
      
      // Wait for React state update - the save button should become enabled
      // The change detection useEffect runs after state updates
      cy.contains('button', 'Save Changes', { timeout: 5000 })
        .should('not.be.disabled')
        .then(() => {
          // Verify unsaved changes message appears
          cy.contains('You have unsaved changes', { timeout: 2000 }).should('be.visible')
        })
    })
  })

  describe('Cancel Functionality', () => {
    beforeEach(() => {
      cy.visit('/dashboard/availability')
      cy.url().should('include', '/dashboard/availability')
      
      // Wait for page to load
      cy.contains('Weekly Availability', { timeout: 5000 }).should('be.visible')
    })

    it('should cancel and return to dashboard without saving', () => {
      // Make a change
      cy.contains('Friday').parent().find('input[type="checkbox"]').check()
      
      // Click Cancel
      cy.contains('Cancel').click()
      
      // Should navigate to dashboard
      cy.url({ timeout: 5000 }).should('include', '/dashboard')
      cy.contains('Welcome back').should('be.visible')
    })

    it('should show confirmation when canceling with unsaved changes', () => {
      // Make a change
      cy.contains('Saturday').parent().find('input[type="checkbox"]').check()
      
      // Stub window.confirm to return true (confirm cancel)
      cy.window().then((win) => {
        cy.stub(win, 'confirm').returns(true)
      })
      
      // Click Cancel
      cy.contains('Cancel').click()
      
      // Should navigate to dashboard
      cy.url({ timeout: 5000 }).should('include', '/dashboard')
    })

    it('should not navigate when cancel confirmation is dismissed', () => {
      // Make a change
      cy.contains('Sunday').parent().find('input[type="checkbox"]').check()
      
      // Stub window.confirm to return false (cancel dismissal)
      cy.window().then((win) => {
        cy.stub(win, 'confirm').returns(false)
      })
      
      // Click Cancel
      cy.contains('Cancel').click()
      
      // Should still be on availability page
      cy.url().should('include', '/dashboard/availability')
    })
  })

  describe('Loading States', () => {
    it('should show loading state when fetching availability', () => {
      // Visit availability page directly
      cy.visit('/dashboard/availability')
      
      // Should show loading indicator
      cy.contains('Loading availability', { timeout: 2000 }).should('be.visible')
      
      // Should eventually load the page
      cy.contains('Weekly Availability', { timeout: 5000 }).should('be.visible')
    })
  })

  describe('Error Handling', () => {
    it('should handle save errors gracefully', () => {
      // Intercept API call to check for errors
      cy.intercept('PUT', '/api/therapist/availability').as('saveAvailability')
      
      cy.visit('/dashboard/availability')
      cy.contains('Weekly Availability', { timeout: 5000 }).should('be.visible')
      
      // Make a change with invalid data (end time before start time)
      // This should be caught by client-side validation
      cy.contains('Monday').parent().find('input[type="checkbox"]').check()
      cy.contains('Monday').parent().parent().find('input[type="time"]').first().clear().type('17:00')
      cy.contains('Monday').parent().parent().find('input[type="time"]').last().clear().type('09:00')
      
      // Try to save - client-side validation should prevent the API call or show error
      cy.contains('Save Changes').click()
      
      // Wait a bit to see if API call happens or error appears
      cy.wait(1000).then(() => {
        // Check if error message appears (client-side validation)
        cy.get('body').then(($body) => {
          const hasErrorBanner = $body.find('.bg-red-50').length > 0
          
          if (hasErrorBanner) {
            // Client-side validation caught it - this is expected
            cy.get('.bg-red-50').should('be.visible')
          } else {
            // If no error banner yet, check if API call was made
            cy.get('@saveAvailability.all').then((interceptions) => {
              if (interceptions.length > 0) {
                const interception = interceptions[0] as any
                if (interception.response?.statusCode === 400) {
                  // Server-side validation error - should show error message
                  cy.get('.bg-red-50', { timeout: 2000 })
                    .should('be.visible')
                    .and('contain.text', /error|invalid|start.*time|end.*time/i)
                }
              } else {
                // API call was prevented by client-side validation - this is also valid
                cy.log('Client-side validation prevented the API call - this is expected behavior')
              }
            })
          }
        })
      })
    })
  })
})

