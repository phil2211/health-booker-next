import { AvailabilityEntry, BlockedSlot } from '@/lib/types'
import { TherapistDocument } from '@/models/Therapist'
import { BookingDocument } from '@/models/Booking'

export interface TimeSlot {
  date: string // YYYY-MM-DD
  startTime: string // HH:MM (slot start, includes break time)
  endTime: string // HH:MM (slot end)
  status: 'available' | 'booked' | 'blocked' | 'unavailable' | 'break'
  sessionStart?: string // HH:MM
  sessionEnd?: string // HH:MM
  breakStart?: string // HH:MM
  breakEnd?: string // HH:MM
  bookingId?: string
  patientName?: string
  patientEmail?: string
}

/**
 * Convert time string (HH:MM) to minutes since midnight
 */
export function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number)
  return hours * 60 + minutes
}

/**
 * Convert minutes since midnight to time string (HH:MM)
 */
function minutesToTime(minutes: number): string {
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`
}

/**
 * Add minutes to a time string
 */
function addMinutes(time: string, minutes: number): string {
  const totalMinutes = timeToMinutes(time) + minutes
  return minutesToTime(totalMinutes)
}

/**
 * Check if two time ranges overlap
 */
function timeRangesOverlap(
  start1: string,
  end1: string,
  start2: string,
  end2: string
): boolean {
  const start1Min = timeToMinutes(start1)
  const end1Min = timeToMinutes(end1)
  const start2Min = timeToMinutes(start2)
  const end2Min = timeToMinutes(end2)

  return start1Min < end2Min && start2Min < end1Min
}

/**
 * Generate all dates in a range
 */
function generateDateRange(startDate: string, endDate: string): string[] {
  const dates: string[] = []
  const start = new Date(startDate + 'T00:00:00.000Z')
  const end = new Date(endDate + 'T00:00:00.000Z')

  const current = new Date(start)
  while (current <= end) {
    dates.push(current.toISOString().split('T')[0])
    current.setDate(current.getDate() + 1)
  }

  return dates
}

/**
 * Get day of week from date string (0 = Sunday, 6 = Saturday)
 */
function getDayOfWeek(dateString: string): number {
  const date = new Date(dateString + 'T00:00:00.000Z')
  return date.getUTCDay()
}

/**
 * Check if a date is in the past
 */
function isPastDate(dateString: string): boolean {
  const date = new Date(dateString + 'T00:00:00.000Z')
  const now = new Date()
  // Use UTC methods to ensure consistent timezone comparison
  now.setUTCHours(0, 0, 0, 0)
  return date < now
}

/**
 * Check if a slot overlaps with a blocked slot
 */
function isBlocked(
  date: string,
  slotStart: string,
  slotEnd: string,
  blockedSlots: BlockedSlot[]
): boolean {
  return blockedSlots.some((blocked) => {
    // Support both new format (fromDate/toDate) and legacy format (date)
    const blockedFromDate = blocked.fromDate || blocked.date || ''
    const blockedToDate = blocked.toDate || blocked.date || ''

    // Check if the date falls within the blocked date range
    const checkDate = new Date(date + 'T00:00:00.000Z')
    const fromDate = new Date(blockedFromDate + 'T00:00:00.000Z')
    const toDate = new Date(blockedToDate + 'T00:00:00.000Z')

    // Date must be within the range (inclusive)
    if (checkDate < fromDate || checkDate > toDate) {
      return false
    }

    // Check if time ranges overlap
    return timeRangesOverlap(
      slotStart,
      slotEnd,
      blocked.startTime,
      blocked.endTime
    )
  })
}

/**
 * Check if a slot overlaps with a booking
 */
function findBookingForSlot(
  date: string,
  slotStart: string,
  slotEnd: string,
  bookings: BookingDocument[]
): BookingDocument | undefined {
  return bookings.find((booking) => {
    const bookingDate = booking.appointmentDate instanceof Date
      ? booking.appointmentDate.toISOString().split('T')[0]
      : String(booking.appointmentDate)

    if (bookingDate !== date) return false

    // Check if the booking slot overlaps with our generated slot
    // The booking might use different time format, but we compare start times
    const bookingSlotStart = booking.startTime
    const bookingSlotEnd = booking.endTime

    return timeRangesOverlap(slotStart, slotEnd, bookingSlotStart, bookingSlotEnd)
  })
}


/**
 * Generate slots from weekly availability based on therapy offering configuration
 * If no offering is provided, defaults to 60 min session + 30 min break
 */
export function generateSlotsFromAvailability(
  date: string,
  availabilityEntry: AvailabilityEntry,
  therapyOffering?: { duration: number; breakDuration: number }
): TimeSlot[] {
  const slots: TimeSlot[] = []
  const availabilityStart = timeToMinutes(availabilityEntry.startTime)
  const availabilityEnd = timeToMinutes(availabilityEntry.endTime)

  // Use therapy offering durations if provided, otherwise use defaults
  const sessionDuration = therapyOffering?.duration || 60
  const breakDuration = therapyOffering?.breakDuration || 30
  const totalSlotDuration = sessionDuration + breakDuration

  // Generate slots based on the total duration
  let currentStart = availabilityStart

  while (currentStart + sessionDuration <= availabilityEnd) {
    const slotStart = minutesToTime(currentStart)
    const slotEnd = minutesToTime(currentStart + totalSlotDuration)
    const sessionStart = slotStart
    const sessionEnd = minutesToTime(currentStart + sessionDuration)
    const breakStart = sessionEnd
    const breakEnd = slotEnd

    slots.push({
      date,
      startTime: slotStart,
      endTime: slotEnd,
      status: 'available',
      sessionStart,
      sessionEnd,
      breakStart,
      breakEnd,
    })

    currentStart += totalSlotDuration
  }

  return slots
}


/**
 * Calculate available time slots for booking
 * Uses the first active therapy offering for slot generation, or defaults to 60+30 minutes
 */
export function calculateAvailableSlots(
  therapist: TherapistDocument,
  startDate: string,
  endDate: string,
  existingBookings: BookingDocument[],
  offeringId?: string
): TimeSlot[] {
  const allSlots: TimeSlot[] = []
  const dates = generateDateRange(startDate, endDate)
  const isNow = new Date()

  // Get the specific therapy offering if ID provided, otherwise first active, or defaults
  let activeOffering = offeringId
    ? therapist.therapyOfferings?.find(o => o._id === offeringId)
    : therapist.therapyOfferings?.find(o => o.isActive)

  // If specific offering requested but not found/active, fallback to first active
  if (offeringId && !activeOffering) {
    activeOffering = therapist.therapyOfferings?.find(o => o.isActive)
  }

  const therapyOfferingConfig = activeOffering
    ? { duration: activeOffering.duration, breakDuration: activeOffering.breakDuration }
    : undefined // Will use defaults (60+30) in generateSlotsFromAvailability

  for (const date of dates) {
    const dayOfWeek = getDayOfWeek(date)
    const pastDate = isPastDate(date)

    // Find weekly availability for this day of week
    const dayAvailability = therapist.weeklyAvailability.filter(
      (avail) => avail.dayOfWeek === dayOfWeek
    )

    if (dayAvailability.length === 0) {
      // No availability for this day
      if (!pastDate) {
        allSlots.push({
          date,
          startTime: '00:00',
          endTime: '00:00',
          status: 'unavailable',
        })
      }
      continue
    }

    // Generate slots for each availability entry
    const daySlots: TimeSlot[] = []

    for (const avail of dayAvailability) {
      const generatedSlots = generateSlotsFromAvailability(date, avail, therapyOfferingConfig)

      for (const slot of generatedSlots) {
        // Check if blocked
        if (isBlocked(date, slot.startTime!, slot.endTime!, therapist.blockedSlots)) {
          slot.status = 'blocked'
          daySlots.push(slot)
          continue
        }

        // Check if booked
        const booking = findBookingForSlot(
          date,
          slot.startTime!,
          slot.endTime!,
          existingBookings
        )

        if (booking) {
          slot.status = 'booked'
          slot.bookingId = booking._id
          slot.patientName = booking.patientName
          slot.patientEmail = booking.patientEmail
          daySlots.push(slot)
          continue
        }

        // For past dates, don't show available slots
        if (pastDate) {
          continue
        }

        // Available slot
        slot.status = 'available'
        daySlots.push(slot)
      }

      // Add break slots (30 minutes after each session, but before next slot)
      // These are already included in the slot structure above
      // We need to add explicit break markers between slots if there's a gap
    }

    // Sort all slots by start time and add to allSlots
    const sortedDaySlots = daySlots.sort(
      (a, b) => timeToMinutes(a.startTime!) - timeToMinutes(b.startTime!)
    )

    allSlots.push(...sortedDaySlots)
  }

  // Add break slots explicitly - 30 minutes after each available/booked session
  const slotsWithBreaks: TimeSlot[] = []

  for (const slot of allSlots) {
    slotsWithBreaks.push(slot)

    // If it's an available or booked slot (not blocked/unavailable), add break slot
    if (slot.status === 'available' || slot.status === 'booked') {
      // The break is already included in the 90-minute slot structure
      // But we can add explicit break markers if needed
      // For now, the break is part of the slot itself
    }
  }

  return slotsWithBreaks
}


