import Link from 'next/link'

export default function Home() {
  return (
    <div className="min-h-screen bg-linear-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            Health Worker Booking System
          </h1>
          <p className="text-xl text-gray-700 mb-8">
            Easily schedule appointments with qualified health professionals
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/bookings"
              className="bg-indigo-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-indigo-700 transition-colors"
            >
              Book Appointment
            </Link>
            <Link
              href="/providers"
              className="bg-white text-indigo-600 px-6 py-3 rounded-lg font-semibold border-2 border-indigo-600 hover:bg-indigo-50 transition-colors"
            >
              View Providers
            </Link>
          </div>
          
          <div className="flex gap-4 justify-center mt-4">
            <Link
              href="/login"
              className="text-indigo-600 px-6 py-2 font-semibold hover:text-indigo-700 transition-colors"
            >
              Therapist Login
            </Link>
            <Link
              href="/register"
              className="text-indigo-600 px-6 py-2 font-semibold hover:text-indigo-700 transition-colors"
            >
              Therapist Register
            </Link>
          </div>
        </div>

        <div className="mt-20 grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-xl font-semibold text-gray-900 mb-3">
              Easy Booking
            </h3>
            <p className="text-gray-600">
              Simple and intuitive appointment scheduling with real-time availability
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-xl font-semibold text-gray-900 mb-3">
              Qualified Professionals
            </h3>
            <p className="text-gray-600">
              Choose from a network of certified health workers and specialists
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-xl font-semibold text-gray-900 mb-3">
              Secure System
            </h3>
            <p className="text-gray-600">
              Your personal information and health data are always protected
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

