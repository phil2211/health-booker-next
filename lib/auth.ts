import CredentialsProvider from 'next-auth/providers/credentials'
import { findTherapistByEmail, findTherapistById, comparePassword } from '@/models/Therapist'
import { getDatabase } from '@/lib/mongodb'
import { randomBytes } from 'crypto'
import type { NextAuthOptions } from 'next-auth'

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
// Check if MongoDB is available for database sessions
const isMongoDBAvailable = () => {
  try {
    const uri = process.env.MONGODB_URI
    return !!uri
  } catch {
    return false
  }
}

// Custom database session management functions
async function createSession(userId: string, sessionToken: string) {
  const db = await getDatabase()
  const now = new Date()
  const expires = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000) // 90 days

  await db.collection('sessions').insertOne({
    sessionToken,
    userId,
    expires,
    createdAt: now,
    updatedAt: now,
  })
}

async function findSession(sessionToken: string) {
  const db = await getDatabase()
  return await db.collection('sessions').findOne({
    sessionToken,
    expires: { $gt: new Date() }, // Not expired
  })
}

async function updateSession(sessionToken: string) {
  const db = await getDatabase()
  const now = new Date()

  await db.collection('sessions').updateOne(
    { sessionToken },
    { $set: { updatedAt: now } }
  )
}

async function deleteSession(sessionToken: string) {
  const db = await getDatabase()
  await db.collection('sessions').deleteOne({ sessionToken })
}

export const authOptions: NextAuthOptions = {
  // adapter: MongoDBAdapter(clientPromise), // Temporarily disable adapter
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
    strategy: 'jwt', // Temporarily back to JWT
    maxAge: 90 * 24 * 60 * 60, // 90 days
    updateAge: 24 * 60 * 60, // 1 day rolling refresh
  },
  callbacks: {
    async jwt({ token, user, account }: any) {
      if (user) {
        token.id = user.id
        token.email = user.email
        token.name = user.name
        token.specialization = user.specialization
        token.bio = user.bio

        // Create database session on sign in
        if (account) {
          const sessionToken = randomBytes(32).toString('hex')
          token.sessionToken = sessionToken
          await createSession(user.id, sessionToken)
        }
      }
      return token
    },
    async session({ session, token }: any) {
      if (session.user && token) {
        session.user.id = token.id as string
        session.user.email = token.email as string
        session.user.name = token.name as string
        session.user.specialization = token.specialization as string
        session.user.bio = token.bio as string

        // Verify session exists in database and update last seen
        if (token.sessionToken) {
          const dbSession = await findSession(token.sessionToken)
          if (dbSession) {
            await updateSession(token.sessionToken)
          } else {
            // Session doesn't exist or expired, return null to sign out
            return null
          }
        }
      }
      return session
    },
  },
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
  if (!session || !session.user) { // Added !session.user check
    throw new Error('Unauthorized - Please login')
  }
  return session
}

/**
 * Gets the authenticated therapist, throwing an error if not found.
 */
export async function getAuthenticatedTherapist() {
  const session = await requireAuth();
  const therapist = await findTherapistById(session.user.id);
  if (!therapist) {
    throw new Error('Therapist not found');
  }
  return therapist;
}


