import { Therapist, AvailabilityEntry, BlockedSlot, TherapyOffering } from '@/lib/types'
import bcrypt from 'bcryptjs'
import { getDatabase } from '@/lib/mongodb'
import { ObjectId } from 'mongodb'

export type TherapistDocument = Therapist & {
  _id: string
  createdAt: Date
  updatedAt: Date
  // Payment Model
  balance: number
  negativeBalanceSince?: Date
  transactions?: any[] // Using any[] to avoid circular dependency issues for now, or import Transaction
  profileImage?: {
    data: Buffer
    contentType: string
  }
}

export type SerializedTherapistDocument = Omit<TherapistDocument, 'profileImage'> & {
  profileImage?: {
    data: string
    contentType: string
  }
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
export function validateTherapistInput(therapist: Partial<Therapist>): { valid: boolean; errors: string[] } {
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

  // Name, specialization, and bio are now optional during initial registration
  // They will be collected during onboarding

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
  name?: string,
  specialization?: string,
  bio?: string,
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
    // Initialize Payment Model
    balance: 0,
    transactions: [],
    onboardingCompleted: false,
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
export async function getAllTherapists(): Promise<SerializedTherapistDocument[]> {
  const db = await getDatabase()
  const therapists = await db
    .collection('therapists')
    .find({})
    .project({ password: 0 }) // Exclude password
    .toArray()

  return therapists.map((therapist) => {
    const doc = {
      ...therapist,
      _id: therapist._id.toString(),
    } as any

    if (doc.profileImage && doc.profileImage.data) {
      // Convert Buffer to base64 string for client-side consumption
      return {
        ...doc,
        profileImage: {
          ...doc.profileImage,
          data: doc.profileImage.data.toString('base64'),
        },
      }
    }

    return doc
  }) as SerializedTherapistDocument[]
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

  if (!result) return null

  return {
    ...result,
    _id: result._id.toString(),
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

  if (!result) return null

  return {
    ...result,
    _id: result._id.toString(),
  } as TherapistDocument
}

/**
 * Update therapist availability (weekly availability and/or blocked slots)
 */
export async function updateTherapistAvailability(
  therapistId: string,
  weeklyAvailability?: AvailabilityEntry[],
  blockedSlots?: BlockedSlot[],
  therapyOfferings?: TherapyOffering[]
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

    if (therapyOfferings !== undefined) {
      updateFields.therapyOfferings = therapyOfferings
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


/**
 * Update therapist profile (name, specialization, bio)
 */
export async function updateTherapistProfile(
  therapistId: string,
  profileData: {
    name?: string
    specialization?: string | { en: string; de: string }
    bio?: string | { en: string; de: string }
    address?: string
    zip?: string
    city?: string
    phoneNumber?: string
    linkedinUrl?: string
    profileImage?: {
      data: Buffer
      contentType: string
    }
  }
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

    if (profileData.name !== undefined) updateFields.name = profileData.name
    if (profileData.specialization !== undefined) updateFields.specialization = profileData.specialization
    if (profileData.bio !== undefined) updateFields.bio = profileData.bio
    if (profileData.address !== undefined) updateFields.address = profileData.address
    if (profileData.zip !== undefined) updateFields.zip = profileData.zip
    if (profileData.city !== undefined) updateFields.city = profileData.city
    if (profileData.phoneNumber !== undefined) updateFields.phoneNumber = profileData.phoneNumber
    if (profileData.linkedinUrl !== undefined) updateFields.linkedinUrl = profileData.linkedinUrl
    if (profileData.profileImage !== undefined) updateFields.profileImage = profileData.profileImage

    // Check if onboarding is completed
    const currentTherapist = await db.collection('therapists').findOne({ _id: new ObjectId(therapistId) })

    if (currentTherapist) {
      const hasName = updateFields.name || currentTherapist.name
      const hasSpecialization = updateFields.specialization || currentTherapist.specialization
      const hasBio = updateFields.bio || currentTherapist.bio
      const hasAddress = updateFields.address || currentTherapist.address

      if (hasName && hasSpecialization && hasBio && hasAddress) {
        updateFields.onboardingCompleted = true
      }
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
    console.error('Error updating therapist profile:', error)
    throw error // Re-throw to be caught by API route
  }
}



/**
 * Update therapist balance and log transaction in a new collection
 * Supports ACID transactions via MongoDB session
 */
import { ClientSession } from 'mongodb'

export async function updateTherapistBalance(
  therapistId: string,
  amount: number,
  description: string,
  bookingId?: string,
  session?: ClientSession
): Promise<TherapistDocument | null> {
  const db = await getDatabase()
  const now = new Date()

  // 1. Get current therapist to check balance
  const therapist = await db.collection('therapists').findOne(
    { _id: new ObjectId(therapistId) },
    { session }
  )

  if (!therapist) {
    throw new Error('Therapist not found')
  }

  const currentBalance = therapist.balance || 0
  const newBalance = currentBalance + amount

  // 2. Prepare updates
  const updates: any = {
    balance: newBalance,
    updatedAt: now
  }

  // Handle negative balance tracking
  if (newBalance < 0 && currentBalance >= 0) {
    updates.negativeBalanceSince = now
  } else if (newBalance >= 0 && therapist.negativeBalanceSince) {
    updates.negativeBalanceSince = null
  }

  // 3. Update therapist balance
  const updateResult = await db.collection('therapists').findOneAndUpdate(
    { _id: new ObjectId(therapistId) },
    { $set: updates },
    {
      session,
      returnDocument: 'after'
    }
  )

  if (!updateResult) {
    throw new Error('Failed to update therapist balance')
  }

  // 4. Create transaction record in new collection
  const transaction = {
    therapistId: new ObjectId(therapistId),
    type: amount >= 0 ? 'CREDIT' : 'CHARGE',
    amount: Math.abs(amount),
    date: now,
    description,
    bookingId: bookingId ? new ObjectId(bookingId) : undefined,
    createdAt: now
  }

  await db.collection('transactions').insertOne(transaction, { session })

  return {
    ...updateResult,
    _id: updateResult._id.toString(),
  } as TherapistDocument
}

/**
 * Deduct amount from therapist balance and log transaction
 * Wrapper around updateTherapistBalance for backward compatibility
 */
export async function deductBalance(
  therapistId: string,
  amount: number,
  description: string,
  bookingId?: string,
  session?: ClientSession
): Promise<TherapistDocument | null> {
  return updateTherapistBalance(therapistId, -amount, description, bookingId, session)
}

/**
 * Top up therapist balance and log transaction
 * Wrapper around updateTherapistBalance for backward compatibility
 */
export async function topUpBalance(
  therapistId: string,
  amount: number,
  description: string = 'Account Top Up',
  session?: ClientSession
): Promise<TherapistDocument | null> {
  return updateTherapistBalance(therapistId, amount, description, undefined, session)
}
