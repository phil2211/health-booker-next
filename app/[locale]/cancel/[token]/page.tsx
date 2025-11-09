import { notFound } from 'next/navigation'
import Link from 'next/link'
import CancellationForm from '@/components/CancellationForm'

interface CancelPageProps {
  params: Promise<{ token: string }>
}

async function getBookingDetails(token: string) {
  try {
    const response = await fetch(
      `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/cancel/${token}`,
      { cache: 'no-store' }
    )

    if (!response.ok) {
      return null
    }

    const data = await response.json()
    return data.booking
  } catch (error) {
    console.error('Error fetching booking details:', error)
    return null
  }
}

export default async function CancelPage({ params }: CancelPageProps) {
  const { token } = await params

  if (!token) {
    notFound()
  }

  const booking = await getBookingDetails(token)

  if (!booking) {
    return (
      <div className="min-h-screen bg-linear-to-br from-red-50 to-orange-100 flex items-center justify-center">
        <div className="max-w-md mx-auto bg-white rounded-xl shadow-xl border p-8 text-center">
          <div className="mb-6">
            <svg
              className="w-16 h-16 text-red-500 mx-auto mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Invalid Cancellation Link</h1>
            <p className="text-gray-600 mb-6">
              This cancellation link is invalid or has already been used.
            </p>
            <Link
              href="/"
              className="inline-flex items-center px-6 py-3 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors"
            >
              Return to HealthBooker
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-red-50 to-orange-100">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="text-center mb-8">
          <Link href="/" className="text-2xl font-bold text-indigo-600 hover:text-indigo-700 mb-8 block">
            HealthBooker
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Cancel Your Appointment</h1>
          <p className="text-gray-600">
            Please review your appointment details below and confirm cancellation.
          </p>
        </div>

        {/* Cancellation Form */}
        <CancellationForm booking={booking} token={token} />
      </div>
    </div>
  )
}
