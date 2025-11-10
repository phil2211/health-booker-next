import { getAuthSession } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { findTherapistById } from '@/models/Therapist'
import AppointmentsPageClient from './AppointmentsPageClient'

export default async function AppointmentsPage() {
  const session = await getAuthSession()

  if (!session || !session.user) {
    redirect('/login')
  }

  // Get full therapist data
  const therapist = await findTherapistById(session.user.id)

  if (!therapist) {
    // Note: This is a server component, so we can't use useTranslation here
    // In a real app, you might want to redirect or show a proper error page
    return <div>Therapist not found</div>
  }

  return <AppointmentsPageClient therapistId={therapist._id} />
}
