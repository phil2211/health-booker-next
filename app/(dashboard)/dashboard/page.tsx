import { getAuthSession } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { findTherapistById } from '@/models/Therapist'
import { getAppointmentStats } from '@/models/Booking'
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

  if (!therapist.onboardingCompleted) {
    redirect('/onboarding')
  }

  const bookingUrl = `/book/${therapist._id}`

  // Get base URL - use Vercel's automatic VERCEL_URL for preview deployments
  // Priority: VERCEL_URL > NEXT_PUBLIC_BASE_URL > NEXT_PUBLIC_APP_URL > localhost
  const baseUrl = process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : process.env.NEXT_PUBLIC_BASE_URL || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

  // Get appointment stats
  const stats = await getAppointmentStats(therapist._id)

  // Resolve specialization tags
  let displaySpecialization = ''
  let specializationTags: any[] = []

  if (Array.isArray(therapist.specialization) && therapist.specialization.length > 0) {
    if (typeof therapist.specialization[0] === 'string') {
      const { getDatabase } = await import('@/lib/mongodb')
      const db = await getDatabase()
      const { ObjectId } = await import('mongodb')

      // Fetch all selected tags
      specializationTags = await db.collection('therapy_tags').find({
        _id: { $in: (therapist.specialization as unknown as string[]).map(id => new ObjectId(id)) }
      }).toArray()
    } else {
      // Already objects
      specializationTags = therapist.specialization
    }

    // Group by category for display
    // Format: "Category: Tag1, Tag2; Category2: Tag3"
    const groupedTags: Record<string, string[]> = {}
    const groupedTagsDe: Record<string, string[]> = {}

    specializationTags.forEach(tag => {
      const catEn = tag.category.en
      const catDe = tag.category.de

      if (!groupedTags[catEn]) groupedTags[catEn] = []
      if (!groupedTagsDe[catDe]) groupedTagsDe[catDe] = []

      const nameEn = tag.subcategory?.en || tag.name?.en || ''
      const nameDe = tag.subcategory?.de || tag.name?.de || ''

      if (nameEn) groupedTags[catEn].push(nameEn)
      if (nameDe) groupedTagsDe[catDe].push(nameDe)
    })

    const enString = Object.entries(groupedTags)
      .map(([cat, tgs]) => `${cat}: ${tgs.join(', ')}`)
      .join('; ')

    const deString = Object.entries(groupedTagsDe)
      .map(([cat, tgs]) => `${cat}: ${tgs.join(', ')}`)
      .join('; ')

    displaySpecialization = { en: enString, de: deString } as any
  } else if (typeof therapist.specialization === 'string') {
    displaySpecialization = therapist.specialization
  } else if (typeof therapist.specialization === 'object') {
    // It's already the old format {en, de}
    displaySpecialization = therapist.specialization as any
  }

  return (
    <DashboardClient
      therapist={{
        _id: therapist._id,
        name: therapist.name || '',
        specialization: displaySpecialization,
        specializationTags: specializationTags,
        bio: therapist.bio || '',
        email: therapist.email,
        weeklyAvailability: therapist.weeklyAvailability,
        blockedSlots: therapist.blockedSlots,

        balance: therapist.balance,
        negativeBalanceSince: therapist.negativeBalanceSince ? therapist.negativeBalanceSince.toISOString() : undefined,
      }}
      bookingUrl={bookingUrl}
      baseUrl={baseUrl}
      upcomingAppointmentsCount={stats.upcoming}
    />
  )
}

