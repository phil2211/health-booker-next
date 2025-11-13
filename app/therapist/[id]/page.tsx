import { notFound } from 'next/navigation'
import { findTherapistById } from '@/models/Therapist'
import { ObjectId } from 'mongodb'
import TherapistPageClient from './TherapistPageClient'

interface TherapistPageProps {
  params: Promise<{ id: string }>
}

async function getTherapistProfile(id: string) {
  // Validate ID format (MongoDB ObjectId)
  if (!ObjectId.isValid(id)) {
    return null
  }

  // Call the model function directly
  const therapist = await findTherapistById(id)

  if (!therapist) {
    return null
  }

  // Return in API format for consistency
  return {
    therapist: {
      _id: therapist._id,
      name: therapist.name,
      specialization: therapist.specialization,
      bio: therapist.bio,
      photoUrl: therapist.photoUrl,
      email: therapist.email,
      weeklyAvailability: therapist.weeklyAvailability,
      blockedSlots: therapist.blockedSlots,
      createdAt: therapist.createdAt,
      updatedAt: therapist.updatedAt,
    },
  }
}

export default async function TherapistProfilePage({ params }: TherapistPageProps) {
  const { id } = await params
  const data = await getTherapistProfile(id)

  if (!data || !data.therapist) {
    notFound()
  }

  const therapist = data.therapist

  return (
    <TherapistPageClient therapist={therapist} />
  )
}

// Enable dynamic params for this route - allow unknown IDs
export const dynamicParams = true

// Optional: generate static params for known therapists in production
export async function generateStaticParams() {
  // Return empty array to allow all dynamic routes
  // Therapists will be fetched dynamically at request time
  return []
}

// Force dynamic rendering
export const dynamic = 'force-dynamic'

