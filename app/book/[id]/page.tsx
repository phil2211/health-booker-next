import { notFound } from 'next/navigation'
import { findTherapistById } from '@/models/Therapist'
import { ObjectId } from 'mongodb'
import BookingPageClient from './BookingPageClient'

interface BookingPageProps {
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
      therapyOfferings: therapist.therapyOfferings, // Include therapy offerings
      createdAt: therapist.createdAt,
      updatedAt: therapist.updatedAt,
    },
  }
}

export default async function BookingPage({ params }: BookingPageProps) {
  const { id } = await params
  const data = await getTherapistProfile(id)

  if (!data || !data.therapist) {
    notFound()
  }

  const therapist = data.therapist

  return (
    <BookingPageClient
      therapistId={therapist._id}
      therapistName={therapist.name}
      blockedSlots={therapist.blockedSlots}
      therapyOfferings={therapist.therapyOfferings}
    />
  )
}

// Enable dynamic params
export const dynamicParams = false

