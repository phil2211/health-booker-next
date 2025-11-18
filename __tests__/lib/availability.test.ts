/**
 * Unit tests for availability utility functions
 */

import { calculateAvailableSlots, generateSlotsFromAvailability, timeToMinutes } from '@/lib/utils/availability'
import { AvailabilityEntry } from '@/lib/types'
import { TherapistDocument } from '@/models/Therapist'

// Mock the therapist and booking models
jest.mock('@/models/Therapist', () => ({
  findTherapistById: jest.fn(),
}))

jest.mock('@/models/Booking', () => ({
  getBookingsByTherapistAndDateRange: jest.fn(),
}))

describe('Availability Utils', () => {
  describe('generateSlotsFromAvailability', () => {
    test('should not generate slots that would exceed availability end time', () => {
      // Test case: Therapist available from 09:00 to 18:00
      // Appointment duration is 60 minutes
      // Should not generate a slot starting at 17:30 (which would end at 18:30)
      const availability: AvailabilityEntry = {
        dayOfWeek: 1, // Monday
        startTime: '09:00',
        endTime: '18:00', // 18:00 = 1080 minutes past midnight
      }

      const slots = generateSlotsFromAvailability('2024-01-15', availability)

      // Should generate slots from 09:00, 10:30, 12:00, 13:30, 15:00, 16:30
      // Should NOT generate 17:30 slot because 17:30 + 60 minutes = 18:30 > 18:00
      expect(slots.length).toBeGreaterThan(0)

      // Check that no slot starts at or after 17:30
      const lateSlots = slots.filter(slot => {
        const startMinutes = slot.startTime!.split(':').map(Number)
        return startMinutes[0] * 60 + startMinutes[1] >= 17 * 60 + 30 // 17:30
      })

      expect(lateSlots.length).toBe(0)

      // Verify the last slot's session ends at 17:30 (16:30 start + 60 min session = 17:30)
      const lastSlot = slots[slots.length - 1]
      expect(lastSlot.sessionEnd).toBe('17:30')

      // Let's verify the slot times more carefully
      // First slot: 09:00 - 10:30 (session: 09:00-10:00, break: 10:00-10:30)
      // Second slot: 10:30 - 12:00 (session: 10:30-11:30, break: 11:30-12:00)
      // Last slot: 16:30 - 18:00 (session: 16:30-17:30, break: 17:30-18:00)
      const slotStartingAt1630 = slots.find(slot => slot.startTime === '16:30')
      expect(slotStartingAt1630).toBeDefined()
      expect(slotStartingAt1630!.sessionEnd).toBe('17:30')
      expect(slotStartingAt1630!.breakEnd).toBe('18:00')

      // Should not have a slot starting at 17:30
      const slotStartingAt1730 = slots.find(slot => slot.startTime === '17:30')
      expect(slotStartingAt1730).toBeUndefined()
    })

    test('should generate slots correctly for shorter availability', () => {
      // Test case: Therapist available from 14:00 to 16:00 (2 hours)
      const availability: AvailabilityEntry = {
        dayOfWeek: 2, // Tuesday
        startTime: '14:00',
        endTime: '16:00',
      }

      const slots = generateSlotsFromAvailability('2024-01-16', availability)

      // Should generate one slot: 14:00 - 15:30 (session: 14:00-15:00, break: 15:00-15:30)
      // Should NOT generate another slot at 15:30 because 15:30 + 60 = 16:30 > 16:00

      expect(slots.length).toBe(1)
      expect(slots[0].startTime).toBe('14:00')
      expect(slots[0].endTime).toBe('15:30')
      expect(slots[0].sessionStart).toBe('14:00')
      expect(slots[0].sessionEnd).toBe('15:00')
      expect(slots[0].breakStart).toBe('15:00')
      expect(slots[0].breakEnd).toBe('15:30')
    })

    test('should handle exact fit availability', () => {
      // Test case: Therapist available exactly 1.5 hours (90 minutes)
      const availability: AvailabilityEntry = {
        dayOfWeek: 3, // Wednesday
        startTime: '10:00',
        endTime: '11:30',
      }

      const slots = generateSlotsFromAvailability('2024-01-17', availability)

      // Should generate one slot: 10:00 - 11:30 (session: 10:00-11:00, break: 11:00-11:30)
      expect(slots.length).toBe(1)
      expect(slots[0].startTime).toBe('10:00')
      expect(slots[0].sessionEnd).toBe('11:00')
      expect(slots[0].breakEnd).toBe('11:30')
    })

    test('should generate slot when session fits exactly at availability end', () => {
      // Test case: Therapist available exactly 60 minutes (10:00 to 11:00)
      const availability: AvailabilityEntry = {
        dayOfWeek: 4, // Thursday
        startTime: '10:00',
        endTime: '11:00',
      }

      const slots = generateSlotsFromAvailability('2024-01-18', availability)

      // Should generate one slot: 10:00 - 11:30 (session: 10:00-11:00, break: 11:00-11:30)
      // Even though break goes beyond availability, session fits exactly
      expect(slots.length).toBe(1)
      expect(slots[0].startTime).toBe('10:00')
      expect(slots[0].sessionEnd).toBe('11:00')
      expect(slots[0].breakEnd).toBe('11:30') // Break goes beyond availability, but that's okay
    })

    test('should NOT generate 17:30 slot when availability ends at 18:00 - exact user scenario', () => {
      // Exact scenario from user: availability ends at 18:00, should not allow 17:30 appointment
      const availability: AvailabilityEntry = {
        dayOfWeek: 1, // Monday (doesn't matter for this test)
        startTime: '09:00',
        endTime: '18:00', // Ends at 18:00
      }

      const slots = generateSlotsFromAvailability('2024-01-15', availability)

      // Check that NO slot starts at 17:30
      const slot1730 = slots.find(slot => slot.startTime === '17:30')
      expect(slot1730).toBeUndefined()

      // Verify the last slot starts at 16:30 (which should be allowed since 16:30 + 60 = 17:30 <= 18:00)
      const lastSlot = slots[slots.length - 1]
      expect(lastSlot.startTime).toBe('16:30')
      expect(lastSlot.sessionEnd).toBe('17:30') // Session ends at 17:30, which is <= 18:00

      // Verify no slot would have sessionEnd > 18:00
      const invalidSlots = slots.filter(slot => {
        const sessionEndMinutes = timeToMinutes(slot.sessionEnd!)
        const availabilityEndMinutes = timeToMinutes('18:00')
        return sessionEndMinutes > availabilityEndMinutes
      })
      expect(invalidSlots.length).toBe(0)
    })

  })
})
