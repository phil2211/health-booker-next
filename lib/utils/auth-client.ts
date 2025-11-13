import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

/**
 * Get the current server session (NextAuth v4 compatible)
 * Use this in server components and API routes
 */
export async function auth() {
  return await getServerSession(authOptions)
}

