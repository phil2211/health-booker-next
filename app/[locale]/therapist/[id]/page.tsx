import { notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import LanguageSwitcher from '@/components/LanguageSwitcher'
import { findTherapistById } from '@/models/Therapist'
import { ObjectId } from 'mongodb'
import { getTranslations } from 'next-intl/server'

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

  // Get translations
  const t = await getTranslations('pages.therapist')

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
              <span className="text-sm text-gray-600">{t('profile')}</span>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/" className="text-sm text-gray-600 hover:text-gray-800">
                {t('backToHome')}
              </Link>
              <LanguageSwitcher />
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Profile Card */}
        <div className="bg-white rounded-xl shadow-xl border p-8">
          {/* Header */}
          <div className="text-center mb-8 pb-8 border-b">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">{therapist.name}</h1>
            <p className="text-xl text-indigo-600 font-medium">{therapist.specialization}</p>
          </div>

          {/* Profile Photo (if available) */}
          {therapist.photoUrl && (
            <div className="flex justify-center mb-8">
              <Image
                src={therapist.photoUrl}
                alt={therapist.name}
                width={192}
                height={192}
                className="w-48 h-48 rounded-full object-cover border-4 border-indigo-200 shadow-lg"
              />
            </div>
          )}

          {/* Bio Section */}
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-3">{t('about')} {therapist.name.split(' ')[0]}</h2>
              <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{therapist.bio}</p>
            </div>

            {/* Contact Information */}
            <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
              <h3 className="text-md font-semibold text-gray-900 mb-3">{t('contactInformation')}</h3>
              <p className="text-sm text-gray-600 mb-1">
                <span className="font-medium">Email:</span> {therapist.email}
              </p>
            </div>

            {/* Booking Call to Action */}
            <div className="mt-8 bg-indigo-50 rounded-lg p-6 border border-indigo-200">
              <h3 className="text-lg font-semibold text-indigo-900 mb-3">
                {t('readyToBook')}
              </h3>
              <p className="text-indigo-700 mb-4">
                {t('viewAvailableSlots', { therapistName: therapist.name })}
              </p>
              <Link
                href={`/book/${therapist._id}`}
                className="inline-block w-full sm:w-auto bg-indigo-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-indigo-700 transition-colors text-center"
              >
                {t('viewAvailabilityBook')}
              </Link>
            </div>
          </div>
        </div>

        {/* Back to Home */}
        <div className="mt-8 text-center">
          <Link
            href="/"
            className="text-indigo-600 hover:text-indigo-700 font-medium inline-flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            {t('backToHome')}
          </Link>
        </div>
      </div>
    </div>
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

