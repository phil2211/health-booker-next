import { HealthProvider } from '@/lib/types'

/**
 * MongoDB model for HealthProvider collection
 * This serves as a type-safe interface for provider documents
 */
export type HealthProviderDocument = HealthProvider & {
  _id: string
  createdAt: Date
  updatedAt: Date
}

/**
 * Helper function to validate provider data
 */
export function validateHealthProvider(provider: Partial<HealthProvider>): boolean {
  return !!(
    provider.name &&
    provider.specialization &&
    provider.email &&
    provider.phone &&
    provider.availability &&
    provider.availability.length > 0
  )
}

