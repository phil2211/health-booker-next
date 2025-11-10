import { getAuthSession } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { findTherapistById } from '@/models/Therapist'
import LogoutButton from '@/components/LogoutButton'
import LanguageSwitcher from '@/components/LanguageSwitcher'
import Link from 'next/link'
import AppointmentsView from '@/components/AppointmentsView'
import en from '../../../../../messages/en.json'
import de from '../../../../../messages/de.json'

interface AppointmentsPageProps {
  params: Promise<{ locale: string }>
}

export default async function AppointmentsPage({ params }: AppointmentsPageProps) {
  const session = await getAuthSession()

  if (!session || !session.user) {
    redirect('/login')
  }

  const { locale } = await params

  // Get translations directly from imported messages
  const messages = { en, de }
  const localeMessages = messages[locale as keyof typeof messages] || messages.en
  const appointmentsMessages = localeMessages.pages?.appointments || {}

  // Create translation function
  const t = (key: string) => appointmentsMessages[key as keyof typeof appointmentsMessages] || key

  // Get full therapist data
  const therapist = await findTherapistById(session.user.id)

  if (!therapist) {
    return <div>Therapist not found</div>
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
              <span className="text-sm text-gray-600">{t('viewAppointments')}</span>
            </div>
            <div className="flex items-center space-x-4">
              <Link
                href="/dashboard"
                className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
              >
                {t('backToDashboard')}
              </Link>
              <LanguageSwitcher />
              <LogoutButton />
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h2 className="text-4xl font-bold text-gray-900 mb-2">
            {t('overview')}
          </h2>
          <p className="text-lg text-gray-600">
            {t('viewManageAppointments')}
          </p>
        </div>

        {/* Appointments View Component */}
        <AppointmentsView therapistId={therapist._id} />
      </div>
    </div>
  )
}
