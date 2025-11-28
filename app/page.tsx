import { getAllTherapists } from '@/models/Therapist'
import HomeClient from './HomeClient'

export const revalidate = 0 // Disable caching for this page to always get latest therapists

export default async function Home() {
  const therapists = await getAllTherapists()

  return <HomeClient therapists={therapists} />
}