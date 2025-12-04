'use client'

import { useState, useEffect } from 'react'
import { X } from 'lucide-react'

export default function InstallPrompt() {
    const [isIOS, setIsIOS] = useState(false)
    const [isStandalone, setIsStandalone] = useState(false)
    const [deferredPrompt, setDeferredPrompt] = useState<any>(null)
    const [showPrompt, setShowPrompt] = useState(false)
    const [dontShowAgain, setDontShowAgain] = useState(false)

    useEffect(() => {
        // Check if already in standalone mode
        const isStandaloneMode = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone
        setTimeout(() => setIsStandalone(isStandaloneMode), 0)

        if (isStandaloneMode) return

        // Check if user has dismissed the prompt permanently
        const isDismissed = localStorage.getItem('health-booker-pwa-prompt-hidden') === 'true'
        if (isDismissed) return

        // Detect iOS
        const userAgent = window.navigator.userAgent.toLowerCase()
        const isIosDevice = /iphone|ipad|ipod/.test(userAgent)
        setTimeout(() => setIsIOS(isIosDevice), 0)

        // Handle Android/Chrome beforeinstallprompt
        const handleBeforeInstallPrompt = (e: Event) => {
            e.preventDefault()
            setDeferredPrompt(e)
            // Only show if not iOS (iOS shows immediately if logic allows, or we wait for user interaction? 
            // Actually for Android we wait for this event. For iOS we just show it if it's not standalone.)
            if (!isIosDevice) {
                setShowPrompt(true)
            }
        }

        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)

        // For iOS, we can show it immediately if not standalone
        if (isIosDevice) {
            // Add a small delay or check if visited before to not be annoying? 
            // For now, let's just show it.
            setTimeout(() => setShowPrompt(true), 0)
        }

        return () => {
            window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
        }
    }, [])

    const handleInstallClick = async () => {
        if (deferredPrompt) {
            deferredPrompt.prompt()
            const { outcome } = await deferredPrompt.userChoice
            if (outcome === 'accepted') {
                setDeferredPrompt(null)
                setShowPrompt(false)
            }
        }
    }

    const handleDismiss = () => {
        if (dontShowAgain) {
            localStorage.setItem('health-booker-pwa-prompt-hidden', 'true')
        }
        setShowPrompt(false)
    }

    if (!showPrompt || isStandalone) return null

    return (
        <div className="fixed bottom-4 left-4 right-4 z-50 bg-white dark:bg-gray-800 p-4 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 md:max-w-md md:mx-auto animate-in slide-in-from-bottom-10 fade-in duration-300">
            <button
                onClick={handleDismiss}
                className="absolute top-2 right-2 p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
                <X size={20} />
            </button>

            <div className="flex flex-col gap-3">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-sm">
                        HB
                    </div>
                    <div>
                        <h3 className="font-semibold text-gray-900 dark:text-white">Install Health Booker</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Add to home screen for quick access</p>
                    </div>
                </div>

                {isIOS ? (
                    <div className="text-sm text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg">
                        <p>To install this app on your iPhone:</p>
                        <ol className="list-decimal list-inside mt-1 space-y-1">
                            <li>Tap the <span className="font-semibold">Share</span> icon below <span className="inline-block">⎋</span></li>
                            <li>Scroll down and select <span className="font-semibold">Add to Home Screen</span> <span className="inline-block">⊞</span></li>
                        </ol>
                    </div>
                ) : (
                    <button
                        onClick={handleInstallClick}
                        className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors shadow-sm active:scale-[0.98]"
                    >
                        Install App
                    </button>
                )}

                <div className="flex items-center gap-2 mt-1">
                    <input
                        type="checkbox"
                        id="dontShowAgain"
                        checked={dontShowAgain}
                        onChange={(e) => setDontShowAgain(e.target.checked)}
                        className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                    />
                    <label htmlFor="dontShowAgain" className="text-xs text-gray-500 dark:text-gray-400 select-none cursor-pointer">
                        Don't show this again
                    </label>
                </div>
            </div>
        </div>
    )
}
