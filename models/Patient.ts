import { Patient } from '@/lib/types'

/**
 * MongoDB model for Patient collection
 * This serves as a type-safe interface for patient documents
 */
export type PatientDocument = Patient & {
  _id?: string
  createdAt: Date
  updatedAt: Date
}

/**
 * Helper function to validate patient data
 */
export function validatePatient(patient: Partial<Patient>): boolean {
  return !!(
    patient.name &&
    patient.email &&
    patient.phone
  )
}

