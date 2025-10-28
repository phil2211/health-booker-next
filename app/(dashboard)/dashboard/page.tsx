import { getAuthSession } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { findTherapistById } from '@/models/Therapist'
import LogoutButton from '@/components/LogoutButton'
import CopyUrlButton from '@/components/CopyUrlButton'

export default async function DashboardPage() {
  const session = await getAuthSession()

  if (!session || !session.user) {
    redirect('/login')
  }

  // Get full therapist data
  const therapist = await findTherapistById(session.user.id)
  
  if (!therapist) {
    return <div>Therapist not found</div>
  }

  const bookingUrl = `/book/${therapist._id}`

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <h1 className="text-xl font-semibold text-gray-900">HealthBooker Dashboard</h1>
            <LogoutButton />
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h2 className="text-3xl font-bold text-gray-900">Welcome back, {therapist.name}!</h2>
          <p className="text-gray-600 mt-1">Manage your appointments and availability</p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Profile Card */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Your Profile</h3>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-500">Specialization</p>
                <p className="text-gray-900 font-medium">{therapist.specialization}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Bio</p>
                <p className="text-gray-700">{therapist.bio}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Email</p>
                <p className="text-gray-900 font-medium">{therapist.email}</p>
              </div>
            </div>
          </div>

          {/* Booking URL Card */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Your Booking URL</h3>
            <p className="text-sm text-gray-600 mb-4">
              Share this URL with patients to let them book appointments with you:
            </p>
            <div className="bg-gray-50 border rounded-md p-3 mb-4">
              <code className="text-sm break-all">
                {process.env.AUTH_URL?.replace('http://', '').replace('https://', '')}
                {bookingUrl}
              </code>
            </div>
            <div className="flex gap-2">
              <CopyUrlButton 
                url={`${process.env.AUTH_URL || 'http://localhost:3000'}${bookingUrl}`}
              />
            </div>
          </div>
        </div>

        {/* Availability Section */}
        <div className="mt-6 bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Availability Settings</h3>
          <p className="text-gray-600 mb-4">
            You currently have {therapist.weeklyAvailability.length} weekly availability entries and{' '}
            {therapist.blockedSlots.length} blocked time slots configured.
          </p>
          <button className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition-colors">
            Manage Availability
          </button>
        </div>
      </div>
    </div>
  )
}

