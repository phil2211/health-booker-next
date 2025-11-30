'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { useTranslation } from '@/lib/i18n/useTranslation'
import { useLocale } from '@/lib/i18n/LocaleProvider'
import ProvidersList from '@/components/ProvidersList'
import { TherapistDocument, SerializedTherapistDocument } from '@/models/Therapist'

interface HomeClientProps {
    therapists: SerializedTherapistDocument[]
}

export default function HomeClient({ therapists }: HomeClientProps) {
    const { data: session, status } = useSession()
    const router = useRouter()
    const { t } = useTranslation()
    const locale = useLocale()

    useEffect(() => {
        if (status === 'authenticated' && session) {
            // Preserve locale in redirect
            const dashboardPath = locale === 'en' ? '/dashboard' : `/${locale}/dashboard`
            router.push(dashboardPath)
        }
    }, [session, status, router, locale])

    // Show loading while checking authentication
    if (status === 'loading') {
        return (
            <div className="min-h-screen bg-linear-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">{t('common.loading')}</p>
                </div>
            </div>
        )
    }

    // Show providers list if not authenticated (or while redirecting)
    // We render this even if authenticated to avoid flash of content before redirect, 
    // but the useEffect will handle the redirect.
    // Actually, if authenticated, we might want to return null or a loading state to avoid showing the public page.
    // But the original code returned null at the end, so let's stick to showing the public page if unauthenticated.

    if (status === 'unauthenticated' || !session) {
        return (
            <ProvidersList
                therapists={therapists}
                showLoginRegisterLinks={true}
                title={t('home.title')}
            />
        )
    }

    return null
}
