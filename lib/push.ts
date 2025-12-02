import webpush from 'web-push'
import { Therapist, Patient } from '@/lib/types'

// Configure web-push
if (process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
    webpush.setVapidDetails(
        `mailto:${process.env.RESEND_FROM_EMAIL || 'test@example.com'}`,
        process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
        process.env.VAPID_PRIVATE_KEY
    )
} else {
    console.warn('VAPID keys are not set. Push notifications will not work.')
}

export async function sendPushNotification(subscription: any, payload: string | Buffer) {
    if (!process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || !process.env.VAPID_PRIVATE_KEY) {
        console.warn('Cannot send push notification: VAPID keys missing')
        return
    }
    try {
        await webpush.sendNotification(subscription, payload)
        console.log('Push notification sent successfully')
    } catch (error) {
        console.error('Error sending push notification:', error)
    }
}

export async function sendNotificationToUser(
    user: Therapist | Patient,
    title: string,
    message: string,
    url: string = '/'
) {
    if (!user.pushSubscription) {
        console.log(`User ${user.name} has no push subscription`)
        return
    }

    const payload = JSON.stringify({
        title,
        body: message,
        url,
    })

    await sendPushNotification(user.pushSubscription, payload)
}
