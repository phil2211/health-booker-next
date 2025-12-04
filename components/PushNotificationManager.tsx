'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'

function urlBase64ToUint8Array(base64String: string) {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
    const base64 = (base64String + padding).replace(/\-/g, '+').replace(/_/g, '/')

    const rawData = window.atob(base64)
    const outputArray = new Uint8Array(rawData.length)

    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i)
    }
    return outputArray
}

export function PushNotificationManager() {
    const { data: session } = useSession()
    const [isSupported, setIsSupported] = useState(false)
    const [subscription, setSubscription] = useState<PushSubscription | null>(null)
    const [permission, setPermission] = useState<NotificationPermission>('default')

    async function registerServiceWorker() {
        try {
            const registration = await navigator.serviceWorker.register('/sw.js', {
                scope: '/',
                updateViaCache: 'none',
            })
            console.log('Service Worker registered with scope:', registration.scope)
        } catch (error) {
            console.error('Service Worker registration failed:', error)
        }
    }

    async function checkSubscription() {
        const registration = await navigator.serviceWorker.ready
        const sub = await registration.pushManager.getSubscription()
        setSubscription(sub)
    }

    useEffect(() => {
        if ('serviceWorker' in navigator && 'PushManager' in window) {
            setTimeout(() => {
                setIsSupported(true)
                setPermission(Notification.permission)
                registerServiceWorker()
                checkSubscription()
            }, 0)
        }
    }, [])

    async function saveSubscription(sub: PushSubscription) {
        await fetch('/api/push/subscribe', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(sub),
        })
    }

    async function subscribeToPush() {
        try {
            const registration = await navigator.serviceWorker.ready
            const response = await fetch('/api/push/vapid-public-key')
            const { publicKey } = await response.json()

            if (!publicKey) {
                console.error('VAPID public key not found')
                return
            }

            const convertedVapidKey = urlBase64ToUint8Array(publicKey)

            const sub = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: convertedVapidKey,
            })

            setSubscription(sub)
            await saveSubscription(sub)
            setPermission(Notification.permission)
        } catch (error) {
            console.error('Failed to subscribe to push notifications:', error)
        }
    }

    if (!isSupported || !session) {
        return null
    }

    if (permission === 'denied') {
        return null // User denied, don't bug them
    }

    if (subscription) {
        return null // Already subscribed
    }

    return (
        <div className="fixed bottom-4 right-4 z-50 p-4 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 max-w-sm">
            <div className="flex items-start gap-3">
                <div className="flex-1">
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                        Enable Notifications
                    </h3>
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                        Get notified about your appointments and updates.
                    </p>
                </div>
                <button
                    onClick={() => setIsSupported(false)} // Dismiss for session
                    className="text-gray-400 hover:text-gray-500"
                >
                    <span className="sr-only">Close</span>
                    <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L10 10 5.707 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                </button>
            </div>
            <div className="mt-3">
                <button
                    onClick={subscribeToPush}
                    className="w-full rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                >
                    Enable Notifications
                </button>
            </div>
        </div>
    )
}
