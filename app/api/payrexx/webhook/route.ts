import { NextRequest, NextResponse } from 'next/server'
import { verifyPayrexxSignature } from '@/lib/payrexx'
import { updateTherapistSubscription } from '@/models/Therapist'
import { SubscriptionPlan, SubscriptionStatus } from '@/lib/types'

export async function POST(req: NextRequest) {
    try {
        const signatureHeader = req.headers.get('Payrex-Signature')
        const rawBody = await req.text()

        if (!signatureHeader) {
            return NextResponse.json({ error: 'Missing signature header' }, { status: 400 })
        }

        const apiSecret = process.env.PAYREXX_API_SECRET
        if (!apiSecret) {
            console.error('PAYREXX_API_SECRET is not defined')
            return NextResponse.json({ error: 'Server configuration error' }, { status: 500 })
        }

        const isValid = verifyPayrexxSignature(signatureHeader, rawBody, apiSecret)
        if (!isValid) {
            return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
        }

        const payload = JSON.parse(rawBody)
        const transaction = payload.transaction
        const subscription = payload.subscription

        // Handle Transaction Webhook (Initial Payment)
        if (transaction) {
            const status = transaction.status
            const therapistId = transaction.referenceId // We must ensure we pass this when creating the link

            if (status === 'confirmed' && therapistId) {
                // Payment successful, upgrade user
                await updateTherapistSubscription(
                    therapistId,
                    SubscriptionPlan.PRO,
                    SubscriptionStatus.ACTIVE,
                    transaction.subscription?.id || undefined // If it's linked to a subscription
                )
                console.log(`Therapist ${therapistId} upgraded to PRO via transaction ${transaction.id}`)
            }
        }

        // Handle Subscription Webhook (Recurring / Status Change)
        if (subscription) {
            const status = subscription.status
            const therapistId = subscription.referenceId // Assuming referenceId is passed to subscription too

            if (therapistId) {
                let newStatus = SubscriptionStatus.ACTIVE
                let newPlan = SubscriptionPlan.PRO

                switch (status) {
                    case 'active':
                        newStatus = SubscriptionStatus.ACTIVE
                        newPlan = SubscriptionPlan.PRO
                        break
                    case 'cancelled':
                    case 'expired':
                        newStatus = SubscriptionStatus.CANCELED
                        newPlan = SubscriptionPlan.FREE // Downgrade on cancel
                        break
                    case 'suspended':
                    case 'past_due':
                        newStatus = SubscriptionStatus.PAST_DUE
                        // Keep PRO but maybe block access in UI? For now keep PRO.
                        break
                    default:
                        console.log(`Unhandled subscription status: ${status}`)
                        return NextResponse.json({ received: true })
                }

                await updateTherapistSubscription(
                    therapistId,
                    newPlan,
                    newStatus,
                    subscription.id
                )
                console.log(`Therapist ${therapistId} subscription updated to ${status}`)
            }
        }

        return NextResponse.json({ received: true })
    } catch (error) {
        console.error('Error processing Payrexx webhook:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
