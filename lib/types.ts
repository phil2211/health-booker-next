/**
 * Core domain types for the health worker reservation system
 */

export interface HealthProvider {
  _id?: string
  name: string
  specialization: string
  email: string
  phone: string
  availability: ProviderAvailability[]
  bio?: string
  credentials?: string[]
  profileImageUrl?: string
  createdAt?: Date
  updatedAt?: Date
}

export interface ProviderAvailability {
  dayOfWeek: number // 0-6 (Sunday-Saturday)
  startTime: string // HH:mm format
  endTime: string // HH:mm format
  isAvailable: boolean
}

/**
 * Therapist model as per Requirements.md
 * Healthcare professionals who manage appointments
 */
export interface Therapist {
  _id?: string
  email: string
  password: string // hashed
  name: string
  specialization: string | { en: string; de: string }
  bio: string | { en: string; de: string }
  address?: string
  phoneNumber?: string // Swiss phone number format by default
  photoUrl?: string
  weeklyAvailability: AvailabilityEntry[]
  blockedSlots: BlockedSlot[]
  bookings?: Array<{
    _id: string
    patientName: string
    patientEmail: string
    appointmentDate: string // YYYY-MM-DD format
    startTime: string // HH:MM format
    endTime: string // HH:MM format
    status: BookingStatus
    createdAt: Date
  }> // Array of future bookings (more than 3 days old are removed)
  createdAt?: Date
  updatedAt?: Date
}

/**
 * Weekly availability entry
 * dayOfWeek: 0=Sunday, 1=Monday, ..., 6=Saturday
 */
export interface AvailabilityEntry {
  dayOfWeek: number // 0-6 (Sunday-Saturday)
  startTime: string // HH:MM format, 24-hour
  endTime: string // HH:MM format, 24-hour
}

/**
 * Blocked time slot for specific dates or date ranges
 */
export interface BlockedSlot {
  fromDate: string // YYYY-MM-DD format (start of range)
  toDate: string // YYYY-MM-DD format (end of range, can be same as fromDate for single day)
  startTime: string // HH:MM format
  endTime: string // HH:MM format
  // Legacy support: date field for backward compatibility
  date?: string // YYYY-MM-DD format (deprecated, use fromDate/toDate instead)
}

export interface Booking {
  _id?: string
  therapistId: string // Changed from providerId per requirements
  patientName: string
  patientEmail: string
  patientPhone?: string // Optional phone number
  appointmentDate: Date | string // Can be Date object or YYYY-MM-DD string
  startTime: string // HH:MM format
  endTime: string // HH:MM format
  status: BookingStatus
  cancellationToken: string // UUID for cancellation
  reason?: string
  notes?: string
  locale?: string // Language preference for notifications
  reminderSent?: boolean // Flag to track if a reminder has been sent
  createdAt?: Date
  updatedAt?: Date
}

export enum BookingStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  NO_SHOW = 'no_show',
}

export interface Patient {
  _id?: string
  name: string
  email: string
  phone: string
  dateOfBirth?: Date
  address?: string
  emergencyContact?: {
    name: string
    relationship: string
    phone: string
  }
  createdAt?: Date
  updatedAt?: Date
}

export interface AppointmentSlot {
  providerId: string
  date: Date
  startTime: string
  endTime: string
  isAvailable: boolean
}

