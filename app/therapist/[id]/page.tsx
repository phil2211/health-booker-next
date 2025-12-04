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

  // Convert profile image to base64 if available
  let profileImageSrc = null
  if (therapist.profileImage && therapist.profileImage.data) {
    try {
      const base64 = therapist.profileImage.data.toString('base64')
      profileImageSrc = `data:${therapist.profileImage.contentType};base64,${base64}`
    } catch (e) {
      console.error('Error converting profile image', e)
    }
  }
  // Resolve specialization tags
  let tags: any[] = []
  if (Array.isArray(therapist.specialization) && therapist.specialization.length > 0) {
    if (typeof therapist.specialization[0] === 'string') {
      const { getDatabase } = await import('@/lib/mongodb')
      const db = await getDatabase()

      // Fetch all selected tags
      tags = await db.collection('therapy_tags').find({
        _id: { $in: (therapist.specialization as unknown as string[]).map(id => new ObjectId(id)) }
      }).toArray()
    } else {
      // Already objects
      tags = therapist.specialization
    }
  }

  // Return in API format for consistency
  return {
    therapist: {
      _id: therapist._id,
      name: therapist.name || '',
      specialization: tags,
      bio: therapist.bio || '',
      photoUrl: therapist.photoUrl,
      profileImageSrc,
      linkedinUrl: therapist.linkedinUrl,
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

