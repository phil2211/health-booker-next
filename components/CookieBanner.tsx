'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

export default function CookieBanner() {
    const [isVisible, setIsVisible] = useState(false)

    useEffect(() => {
        // Check if user has already acknowledged cookies
        const hasAcknowledged = localStorage.getItem('cookie_consent')
        if (!hasAcknowledged) {
            setIsVisible(true)
        }
    }, [])

    const handleAccept = () => {
        localStorage.setItem('cookie_consent', 'true')
        setIsVisible(false)
    }

    if (!isVisible) return null

    return (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg p-4 z-50 animate-in slide-in-from-bottom-4 duration-500">
            <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="text-sm text-gray-600">
                    <p>
                        We use essential cookies to ensure our website functions properly.
                        For more information, please read our <Link href="/privacy" className="text-indigo-600 hover:text-indigo-500 underline">Privacy Policy</Link>.
                    </p>
                </div>
                <button
                    onClick={handleAccept}
                    className="whitespace-nowrap px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors"
                >
                    Got it
                </button>
            </div>
        </div>
    )
}
