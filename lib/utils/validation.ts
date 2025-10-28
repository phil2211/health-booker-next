/**
 * Input validation utilities for authentication and forms
 */

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

/**
 * Validate password strength
 * Requirements: at least 8 characters
 */
export function isStrongPassword(password: string): boolean {
  return password.length >= 8
}

/**
 * Sanitize string input to prevent XSS
 */
export function sanitizeInput(input: string): string {
  return input.trim().replace(/[<>]/g, '')
}

/**
 * Validate time format HH:MM
 */
export function isValidTime(time: string): boolean {
  const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/
  return timeRegex.test(time)
}

/**
 * Validate date format YYYY-MM-DD
 */
export function isValidDate(date: string): boolean {
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/
  if (!dateRegex.test(date)) {
    return false
  }
  
  const parsedDate = new Date(date)
  return !isNaN(parsedDate.getTime())
}

/**
 * Check if a date is in the past
 */
export function isDateInPast(date: string): boolean {
  const selectedDate = new Date(date)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return selectedDate < today
}

/**
 * Check if a time is in the past on the current date
 */
export function isTimeInPast(date: string, time: string): boolean {
  const dateTimeStr = `${date}T${time}:00`
  const selectedDateTime = new Date(dateTimeStr)
  return selectedDateTime < new Date()
}

/**
 * Validate phone number format
 * Simple validation - can be enhanced
 */
export function isValidPhone(phone: string): boolean {
  const phoneRegex = /^[\d\s\-\+\(\)]+$/
  return phoneRegex.test(phone) && phone.replace(/\D/g, '').length >= 10
}

