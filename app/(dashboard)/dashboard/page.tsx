import { getAuthSession } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { findTherapistById } from '@/models/Therapist'
import DashboardClient from './DashboardClient'

export default async function DashboardPage() {
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

  const bookingUrl = `/book/${therapist._id}`

  // Get base URL - use Vercel's automatic VERCEL_URL for preview deployments
  // Priority: VERCEL_URL > NEXT_PUBLIC_BASE_URL > NEXT_PUBLIC_APP_URL > localhost
  const baseUrl = process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : process.env.NEXT_PUBLIC_BASE_URL || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

  return (
    <DashboardClient
      therapist={{
        _id: therapist._id,
        name: therapist.name,
        specialization: therapist.specialization,
        bio: therapist.bio,
        email: therapist.email,
        weeklyAvailability: therapist.weeklyAvailability,
        blockedSlots: therapist.blockedSlots,
      }}
      bookingUrl={bookingUrl}
      baseUrl={baseUrl}
    />
  )
}

