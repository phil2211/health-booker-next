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
function timeToMinutes(time: string): number {
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
  now.setHours(0, 0, 0, 0)
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
    if (blocked.date !== date) return false
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
 * Generate 90-minute slots from weekly availability
 * Each slot is 90 minutes: 60 min session + 30 min break
 */
function generateSlotsFromAvailability(
  date: string,
  availabilityEntry: AvailabilityEntry
): TimeSlot[] {
  const slots: TimeSlot[] = []
  const availabilityStart = timeToMinutes(availabilityEntry.startTime)
  const availabilityEnd = timeToMinutes(availabilityEntry.endTime)
  
  // Generate slots every 90 minutes
  let currentStart = availabilityStart
  
  while (currentStart + 90 <= availabilityEnd) {
    const slotStart = minutesToTime(currentStart)
    const slotEnd = minutesToTime(currentStart + 90)
    const sessionStart = slotStart
    const sessionEnd = minutesToTime(currentStart + 60)
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
    
    currentStart += 90
  }
  
  return slots
}

/**
 * Calculate available time slots for booking
 */
export function calculateAvailableSlots(
  therapist: TherapistDocument,
  startDate: string,
  endDate: string,
  existingBookings: BookingDocument[]
): TimeSlot[] {
  const allSlots: TimeSlot[] = []
  const dates = generateDateRange(startDate, endDate)
  const isNow = new Date()
  
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
      const generatedSlots = generateSlotsFromAvailability(date, avail)
      
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
    
    // Limit to 2 available slots per day (not including booked/blocked)
    const availableSlots = daySlots.filter((s) => s.status === 'available')
    const bookedBlockedSlots = daySlots.filter(
      (s) => s.status === 'booked' || s.status === 'blocked'
    )
    
    // Take up to 2 available slots, sorted by start time
    const limitedAvailableSlots = availableSlots
      .sort((a, b) => timeToMinutes(a.startTime!) - timeToMinutes(b.startTime!))
      .slice(0, 2)
    
    // Combine: booked/blocked slots + limited available slots
    // Sort all by start time
    const combinedSlots = [...bookedBlockedSlots, ...limitedAvailableSlots].sort(
      (a, b) => timeToMinutes(a.startTime!) - timeToMinutes(b.startTime!)
    )
    
    allSlots.push(...combinedSlots)
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

