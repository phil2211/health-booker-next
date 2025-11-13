import NextAuth from 'next-auth'
import { authOptions } from '@/lib/auth'

// Ensure this route runs in Node.js runtime (not Edge) to support MongoDB
export const runtime = 'nodejs'

const handler = NextAuth(authOptions)

export { handler as GET, handler as POST }

