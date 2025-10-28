import CredentialsProvider from 'next-auth/providers/credentials'
import { findTherapistByEmail, comparePassword } from '@/models/Therapist'
import type { NextAuthConfig } from 'next-auth'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      email: string
      name: string
      specialization: string
      bio: string
    }
  }

  interface User {
    id: string
    email: string
    name: string
    specialization: string
    bio: string
  }

  interface JWT {
    id: string
    specialization: string
    bio: string
  }
}

/**
 * NextAuth configuration for therapist authentication
 */
export const authConfig: NextAuthConfig = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        const email = String(credentials.email)
        const password = String(credentials.password)

        try {
          // Find therapist by email
          const therapist = await findTherapistByEmail(email)
          
          if (!therapist) {
            return null
          }

          // Compare passwords
          const passwordMatch = await comparePassword(password, therapist.password)
          
          if (!passwordMatch) {
            return null
          }

          // Return therapist data (without password)
          return {
            id: therapist._id,
            email: therapist.email,
            name: therapist.name,
            specialization: therapist.specialization,
            bio: therapist.bio,
          }
        } catch (error) {
          console.error('Auth error:', error)
          return null
        }
      },
    }),
  ],
  pages: {
    signIn: '/login',
    error: '/login',
  },
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  callbacks: {
    jwt({ token, user }: any) {
      if (user) {
        token.id = user.id
        token.email = user.email
        token.name = user.name
        token.specialization = user.specialization
        token.bio = user.bio
      }
      return token
    },
    session({ session, token }: any) {
      if (session.user && token) {
        session.user.id = token.id as string
        session.user.email = token.email as string
        session.user.name = token.name as string
        session.user.specialization = token.specialization as string
        session.user.bio = token.bio as string
      }
      return session
    },
  },
  trustHost: true,
}

/**
 * Helper to get server session
 */
export async function getAuthSession() {
  const { auth } = await import('@/lib/utils/auth-client')
  return auth()
}

/**
 * Check if user is authenticated
 */
export async function requireAuth() {
  const session = await getAuthSession()
  if (!session) {
    throw new Error('Unauthorized - Please login')
  }
  return session
}

