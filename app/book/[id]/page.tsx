import { notFound } from 'next/navigation'
import Link from 'next/link'
import { findTherapistById } from '@/models/Therapist'
import { ObjectId } from 'mongodb'
import BookingInterface from '@/components/BookingInterface'

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
    <div className="min-h-screen bg-linear-to-br from-blue-50 to-indigo-100">
      {/* Navigation Bar */}
      <nav className="bg-white shadow-lg border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Link href="/" className="text-xl font-bold text-indigo-600 hover:text-indigo-700">
                HealthBooker
              </Link>
              <span className="text-gray-400">|</span>
              <span className="text-sm text-gray-600">Book Appointment</span>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/" className="text-sm text-gray-600 hover:text-gray-800">
                Home
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Therapist Info Card */}
        <div className="bg-white rounded-xl shadow-xl border p-8 mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Book with {therapist.name}</h1>
          <p className="text-xl text-indigo-600 font-medium mb-6">{therapist.specialization}</p>
          <div className="border-t pt-6">
            <p className="text-gray-700 leading-relaxed">{therapist.bio}</p>
          </div>
        </div>

        {/* Booking Interface */}
        <BookingInterface therapistId={therapist._id} blockedSlots={therapist.blockedSlots} />

        {/* Back to Profile */}
        <div className="mt-8 text-center">
          <Link
            href={`/therapist/${therapist._id}`}
            className="text-indigo-600 hover:text-indigo-700 font-medium inline-flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Therapist Profile
          </Link>
        </div>
      </div>
    </div>
  )
}

// Enable dynamic params
export const dynamicParams = false

