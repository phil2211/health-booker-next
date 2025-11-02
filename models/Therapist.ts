import { Therapist, AvailabilityEntry, BlockedSlot } from '@/lib/types'
import bcrypt from 'bcryptjs'
import { getDatabase } from '@/lib/mongodb'
import { ObjectId } from 'mongodb'

export type TherapistDocument = Therapist & {
  _id: string
  createdAt: Date
  updatedAt: Date
}

/**
 * Hash a password using bcrypt
 */
export async function hashPassword(password: string): Promise<string> {
  const saltRounds = 12
  return bcrypt.hash(password, saltRounds)
}

/**
 * Compare a plain text password with a hashed password
 */
export async function comparePassword(plainPassword: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(plainPassword, hashedPassword)
}

/**
 * Validate therapist data for registration
 */
export function validateTherapistInput( therapist: Partial<Therapist> ): { valid: boolean; errors: string[] } {
  const errors: string[] = []

  if (!therapist.email || typeof therapist.email !== 'string') {
    errors.push('Email is required')
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(therapist.email)) {
    errors.push('Invalid email format')
  }

  if (!therapist.password || typeof therapist.password !== 'string') {
    errors.push('Password is required')
  } else if (therapist.password.length < 8) {
    errors.push('Password must be at least 8 characters long')
  }

  if (!therapist.name || typeof therapist.name !== 'string') {
    errors.push('Name is required')
  }

  if (!therapist.specialization || typeof therapist.specialization !== 'string') {
    errors.push('Specialization is required')
  }

  if (!therapist.bio || typeof therapist.bio !== 'string') {
    errors.push('Bio is required')
  }

  return {
    valid: errors.length === 0,
    errors,
  }
}

/**
 * Validate availability entry
 */
export function validateAvailabilityEntry(entry: AvailabilityEntry): boolean {
  if (typeof entry.dayOfWeek !== 'number' || entry.dayOfWeek < 0 || entry.dayOfWeek > 6) {
    return false
  }

  if (!entry.startTime || !entry.endTime) {
    return false
  }

  // Check time format HH:MM
  const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/
  if (!timeRegex.test(entry.startTime) || !timeRegex.test(entry.endTime)) {
    return false
  }

  // Check that start time is before end time
  const start = entry.startTime.split(':').map(Number)
  const end = entry.endTime.split(':').map(Number)
  const startMinutes = start[0] * 60 + start[1]
  const endMinutes = end[0] * 60 + end[1]

  return endMinutes > startMinutes
}

/**
 * Validate blocked slot
 * Supports both new format (fromDate/toDate) and legacy format (date)
 */
export function validateBlockedSlot(slot: BlockedSlot): boolean {
  // Support both new format (fromDate/toDate) and legacy format (date)
  const fromDate = slot.fromDate || slot.date
  const toDate = slot.toDate || slot.date

  // Validate date format
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/
  if (!fromDate || !toDate || !dateRegex.test(fromDate) || !dateRegex.test(toDate)) {
    return false
  }

  // Check that fromDate <= toDate
  const from = new Date(fromDate + 'T00:00:00.000Z')
  const to = new Date(toDate + 'T00:00:00.000Z')
  if (from > to) {
    return false
  }

  // Validate time format
  const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/
  if (!timeRegex.test(slot.startTime) || !timeRegex.test(slot.endTime)) {
    return false
  }

  // Check that start datetime is before end datetime (considering both date and time)
  const startDateTime = new Date(fromDate + 'T' + slot.startTime + ':00')
  const endDateTime = new Date(toDate + 'T' + slot.endTime + ':00')
  
  return startDateTime < endDateTime
}

/**
 * Find a therapist by email
 */
export async function findTherapistByEmail(email: string): Promise<TherapistDocument | null> {
  const db = await getDatabase()
  const therapist = await db.collection('therapists').findOne({ email })
  
  if (!therapist) return null
  
  return {
    ...therapist,
    _id: therapist._id.toString(),
  } as TherapistDocument
}

/**
 * Find a therapist by ID
 */
export async function findTherapistById(id: string): Promise<TherapistDocument | null> {
  const db = await getDatabase()
  const therapist = await db.collection('therapists').findOne({ _id: new ObjectId(id) })
  
  if (!therapist) return null
  
  return {
    ...therapist,
    _id: therapist._id.toString(),
  } as TherapistDocument
}

/**
 * Create a new therapist account
 */
export async function createTherapist(
  email: string,
  hashedPassword: string,
  name: string,
  specialization: string,
  bio: string,
  photoUrl?: string
): Promise<TherapistDocument> {
  const db = await getDatabase()
  
  const now = new Date()
  const therapist: Omit<TherapistDocument, '_id'> = {
    email,
    password: hashedPassword,
    name,
    specialization,
    bio,
    photoUrl,
    weeklyAvailability: [],
    blockedSlots: [],
    createdAt: now,
    updatedAt: now,
  }

  const result = await db.collection('therapists').insertOne(therapist)
  
  return {
    ...therapist,
    _id: result.insertedId.toString(),
  }
}

/**
 * Get all therapists (for public listing)
 */
export async function getAllTherapists(): Promise<TherapistDocument[]> {
  const db = await getDatabase()
  const therapists = await db
    .collection('therapists')
    .find({})
    .project({ password: 0 }) // Exclude password
    .toArray()
  
  return therapists.map((therapist) => ({
    ...therapist,
    _id: therapist._id.toString(),
  })) as TherapistDocument[]
}

/**
 * Ensure email uniqueness index exists
 */
export async function ensureEmailIndex(): Promise<void> {
  const db = await getDatabase()
  await db.collection('therapists').createIndex({ email: 1 }, { unique: true })
}

/**
 * Update therapist's weekly availability
 */
export async function updateTherapistWeeklyAvailability(
  therapistId: string,
  weeklyAvailability: AvailabilityEntry[]
): Promise<TherapistDocument | null> {
  const db = await getDatabase()
  
  const now = new Date()
  const result = await db.collection('therapists').findOneAndUpdate(
    { _id: new ObjectId(therapistId) },
    {
      $set: {
        weeklyAvailability,
        updatedAt: now,
      },
    },
    { returnDocument: 'after' }
  )
  
  if (!result || !result.value) return null
  
  return {
    ...result.value,
    _id: result.value._id.toString(),
  } as TherapistDocument
}

/**
 * Update therapist's blocked slots
 */
export async function updateTherapistBlockedSlots(
  therapistId: string,
  blockedSlots: BlockedSlot[]
): Promise<TherapistDocument | null> {
  const db = await getDatabase()
  
  const now = new Date()
  const result = await db.collection('therapists').findOneAndUpdate(
    { _id: new ObjectId(therapistId) },
    {
      $set: {
        blockedSlots,
        updatedAt: now,
      },
    },
    { returnDocument: 'after' }
  )
  
  if (!result || !result.value) return null
  
  return {
    ...result.value,
    _id: result.value._id.toString(),
  } as TherapistDocument
}

/**
 * Update therapist availability (weekly availability and/or blocked slots)
 */
export async function updateTherapistAvailability(
  therapistId: string,
  weeklyAvailability?: AvailabilityEntry[],
  blockedSlots?: BlockedSlot[]
): Promise<TherapistDocument | null> {
  try {
    const db = await getDatabase()
    
    // Validate ObjectId format
    if (!ObjectId.isValid(therapistId)) {
      console.error('Invalid therapist ID format:', therapistId)
      return null
    }
    
    const now = new Date()
    const updateFields: any = {
      updatedAt: now,
    }
    
    if (weeklyAvailability !== undefined) {
      updateFields.weeklyAvailability = weeklyAvailability
    }
    
    if (blockedSlots !== undefined) {
      updateFields.blockedSlots = blockedSlots
    }
    
    // Use updateOne instead of findOneAndUpdate for more reliable results
    const updateResult = await db.collection('therapists').updateOne(
      { _id: new ObjectId(therapistId) },
      {
        $set: updateFields,
      }
    )
    
    // Check if update was successful
    if (updateResult.matchedCount === 0) {
      console.error('Therapist not found for update:', therapistId)
      return null
    }
    
    // Fetch the updated document
    const updatedTherapist = await db.collection('therapists').findOne(
      { _id: new ObjectId(therapistId) }
    )
    
    if (!updatedTherapist) {
      console.error('Therapist not found after update:', therapistId)
      return null
    }
    
    return {
      ...updatedTherapist,
      _id: updatedTherapist._id.toString(),
    } as TherapistDocument
  } catch (error) {
    console.error('Error updating therapist availability:', error)
    throw error // Re-throw to be caught by API route
  }
}

