import NextAuth from 'next-auth'
import { authConfig } from '@/lib/auth'

// Ensure this route runs in Node.js runtime (not Edge) to support MongoDB
export const runtime = 'nodejs'

export const { handlers, auth, signIn, signOut } = NextAuth(authConfig)

export const { GET, POST } = handlers

