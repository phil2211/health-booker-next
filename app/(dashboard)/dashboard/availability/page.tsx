import { getAuthSession } from '@/lib/auth'
import { redirect } from 'next/navigation'
import AvailabilityManagement from '@/components/AvailabilityManagement'
import LogoutButton from '@/components/LogoutButton'
import Link from 'next/link'

export default async function AvailabilityPage() {
  const session = await getAuthSession()

  if (!session || !session.user) {
    redirect('/login')
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-blue-50 to-indigo-100">
      {/* Navigation Bar */}
      <nav className="bg-white shadow-lg border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Link href="/dashboard" className="text-xl font-bold text-indigo-600 hover:text-indigo-700">
                HealthBooker
              </Link>
              <span className="text-gray-400">|</span>
              <span className="text-sm text-gray-600">Manage Availability</span>
            </div>
            <div className="flex items-center space-x-4">
              <Link
                href="/dashboard"
                className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
              >
                ← Back to Dashboard
              </Link>
              <LogoutButton />
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h2 className="text-4xl font-bold text-gray-900 mb-2">
            Manage Availability
          </h2>
          <p className="text-lg text-gray-600">
            Set your weekly recurring schedule and block specific dates when you're not available
          </p>
        </div>

        {/* Availability Management Component */}
        <AvailabilityManagement />
      </div>
    </div>
  )
}

