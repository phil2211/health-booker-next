'use client'

import { TherapistDocument } from '@/models/Therapist'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import { useTranslation } from '@/lib/i18n/useTranslation'
import { useLocale } from '@/lib/i18n/LocaleProvider'
import { useState, useCallback } from 'react'

import ResponsiveHeader from '@/components/ResponsiveHeader'

const ProviderMap = dynamic(() => import('@/components/ProviderMap'), {
    ssr: false,
    loading: () => (
        <div className="h-full w-full bg-gray-100 animate-pulse rounded-lg flex items-center justify-center text-gray-400">
            Loading Map...
        </div>
    ),
})

interface ProvidersListProps {
    therapists: TherapistDocument[]
}

export default function ProvidersList({ therapists }: ProvidersListProps) {
    const { t } = useTranslation()
    const locale = useLocale()
    const [visibleTherapistIds, setVisibleTherapistIds] = useState<string[] | null>(null)
    const [hoveredTherapistId, setHoveredTherapistId] = useState<string | null>(null)

    const handleVisibleTherapistsChange = useCallback((visibleIds: string[]) => {
        setVisibleTherapistIds(visibleIds)
    }, [])

    const displayedTherapists = visibleTherapistIds
        ? therapists.filter(t => visibleTherapistIds.includes(t._id))
        : therapists

    return (
        <div className="min-h-screen bg-white">
            <ResponsiveHeader
                pageTitle={t('home.viewProviders')}
                showBackToDashboard={false}
                showHomeLink={true}
                showLogoutButton={false}
            />
            <div className="container mx-auto px-4 py-8">
                <h1 className="text-3xl font-bold mb-8 text-gray-900">{t('home.viewProviders')}</h1>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-1 space-y-6 overflow-y-auto max-h-[800px] pr-2">
                        {displayedTherapists.length === 0 ? (
                            <p className="text-gray-500">No providers found in this area.</p>
                        ) : (
                            displayedTherapists.map((therapist) => (
                                <div
                                    key={therapist._id}
                                    className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow border border-gray-100"
                                    onMouseEnter={() => setHoveredTherapistId(therapist._id)}
                                    onMouseLeave={() => setHoveredTherapistId(null)}
                                >
                                    <h2 className="text-xl font-semibold mb-2 text-gray-900">{therapist.name}</h2>
                                    <p className="text-blue-600 font-medium mb-2">
                                        {typeof therapist.specialization === 'string'
                                            ? therapist.specialization
                                            : (therapist.specialization as any)?.[locale] || (therapist.specialization as any)?.en || 'Specialization'}
                                    </p>
                                    {therapist.address && (
                                        <p className="text-sm text-gray-500 mb-4 flex items-start">
                                            <svg className="w-4 h-4 mr-1 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                            </svg>
                                            {therapist.address}, {therapist.zip} {therapist.city}
                                        </p>
                                    )}
                                    <div className="mt-4">
                                        <Link
                                            href={`/book/${therapist._id}`}
                                            className="block w-full text-center bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors font-medium"
                                        >
                                            {t('home.bookAppointment')}
                                        </Link>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    <div className="lg:col-span-2 h-[600px] sticky top-4">
                        <ProviderMap
                            therapists={therapists}
                            onVisibleTherapistsChange={handleVisibleTherapistsChange}
                            hoveredTherapistId={hoveredTherapistId}
                        />
                    </div>
                </div>
            </div>
        </div>
    )
}
