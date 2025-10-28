import { handlers } from '@/lib/utils/auth-client'

// Ensure this route runs in Node.js runtime (not Edge) to support MongoDB
export const runtime = 'nodejs'

export const { GET, POST } = handlers

