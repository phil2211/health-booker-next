import { getAuthSession } from '@/lib/auth'
import { redirect } from 'next/navigation'
import AvailabilityPageClient from './AvailabilityPageClient'

export default async function AvailabilityPage() {
  const session = await getAuthSession()

  if (!session || !session.user) {
    redirect('/login')
  }

  return <AvailabilityPageClient />
}

