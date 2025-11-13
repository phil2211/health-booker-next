import { notFound } from 'next/navigation'
import CancelPageClient from './CancelPageClient'

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

  return <CancelPageClient booking={booking} token={token} />
}
