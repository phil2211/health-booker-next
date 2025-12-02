import { NextResponse } from 'next/server'
import { ObjectId } from 'mongodb'
import { topUpBalance } from '@/models/Therapist'
import { createErrorResponse } from '@/lib/utils/api'

export const runtime = 'nodejs'

interface TopUpRequest {
    therapistId: string
    amount: number
}

/**
 * POST /api/therapist/topup
 * Top up therapist account balance
 */
export async function POST(request: Request) {
    try {
        const body: TopUpRequest = await request.json()

        // Validate required fields
        if (!body.therapistId || body.amount === undefined) {
            return NextResponse.json(
                { error: 'Missing required fields: therapistId, amount' },
                { status: 400 }
            )
        }

        // Validate amount
        if (typeof body.amount !== 'number' || body.amount <= 0) {
            return NextResponse.json(
                { error: 'Amount must be a positive number' },
                { status: 400 }
            )
        }

        // Validate therapist ID format
        if (!ObjectId.isValid(body.therapistId)) {
            return NextResponse.json(
                { error: 'Invalid therapist ID format' },
                { status: 400 }
            )
        }

        // Perform top up
        const updatedTherapist = await topUpBalance(
            body.therapistId,
            body.amount
        )

        if (!updatedTherapist) {
            return NextResponse.json(
                { error: 'Therapist not found' },
                { status: 404 }
            )
        }

        return NextResponse.json({
            message: 'Top up successful',
            balance: updatedTherapist.balance
        })

    } catch (error) {
        console.error('Top up error:', error)
        return NextResponse.json(
            createErrorResponse(error, 'POST /api/therapist/topup'),
            { status: 500 }
        )
    }
}
