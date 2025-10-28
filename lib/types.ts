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

export interface Booking {
  _id?: string
  providerId: string
  patientId: string
  appointmentDate: Date
  startTime: string
  endTime: string
  status: BookingStatus
  reason?: string
  notes?: string
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

