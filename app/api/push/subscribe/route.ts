import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import clientPromise from '@/lib/mongodb'
import { ObjectId } from 'mongodb'

export async function POST(request: Request) {
    try {
        const session = await getServerSession(authOptions)
        if (!session || !session.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const subscription = await request.json()
        const client = await clientPromise
        const db = client.db()

        // Determine if user is therapist or patient based on session or check both collections
        // For simplicity, let's try to update both or check role if available in session

        const { email } = session.user

        // Try updating Patient
        const patientUpdate = await db.collection('patients').updateOne(
            { email },
            { $set: { pushSubscription: subscription } }
        )

        if (patientUpdate.matchedCount === 0) {
            // Try updating Therapist
            await db.collection('therapists').updateOne(
                { email },
                { $set: { pushSubscription: subscription } }
            )
        }

        return NextResponse.json({ message: 'Subscription saved' })
    } catch (error) {
        console.error('Error saving subscription:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
