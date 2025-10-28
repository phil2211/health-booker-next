import { NextAuthOptions, Session } from 'next-auth'
import { JWT } from 'next-auth/jwt'
import CredentialsProvider from 'next-auth/providers/credentials'
import { findTherapistByEmail, comparePassword } from '@/models/Therapist'

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
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string
    specialization: string
    bio: string
  }
}

/**
 * NextAuth configuration for therapist authentication
 */
export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Email and password are required')
        }

        // Find therapist by email
        const therapist = await findTherapistByEmail(credentials.email)
        
        if (!therapist) {
          throw new Error('Invalid email or password')
        }

        // Compare passwords
        const passwordMatch = await comparePassword(credentials.password, therapist.password)
        
        if (!passwordMatch) {
          throw new Error('Invalid email or password')
        }

        // Return therapist data (without password)
        return {
          id: therapist._id,
          email: therapist.email,
          name: therapist.name,
          specialization: therapist.specialization,
          bio: therapist.bio,
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
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.email = user.email
        token.name = user.name
        token.specialization = user.specialization
        token.bio = user.bio
      }
      return token
    },
    async session({ session, token }) {
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
  secret: process.env.AUTH_SECRET,
}

/**
 * Helper to get server session
 */
export async function getAuthSession() {
  const { getServerSession } = await import('next-auth')
  return getServerSession(authOptions)
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

