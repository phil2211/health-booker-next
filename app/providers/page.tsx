import { getAllTherapists } from '@/models/Therapist'
import ProvidersList from '@/components/ProvidersList'

export const revalidate = 0 // Disable caching for this page to always get latest therapists

export default async function ProvidersPage() {
  const therapists = await getAllTherapists()

  return <ProvidersList therapists={therapists} />
}
