'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useLocale } from '@/lib/i18n/LocaleProvider'
import { TherapistDocument } from '@/models/Therapist'
import { useTranslation } from '@/lib/i18n/useTranslation'

interface ProfileEditFormProps {
    therapist: TherapistDocument
}

export default function ProfileEditForm({ therapist }: ProfileEditFormProps) {
    const router = useRouter()
    const locale = useLocale()
    const { t } = useTranslation()

    // Helper to safely get initial value
    const getInitialValue = (field: string | { en: string; de: string } | undefined, lang: 'en' | 'de') => {
        if (!field) return ''
        if (typeof field === 'string') {
            // Legacy data migration: If it's a string, assume it belongs to the current locale
            // This allows the backend to auto-translate to the other language on save
            return lang === locale ? field : ''
        }
        return field[lang] || ''
    }

    // Helper to format Swiss phone numbers
    const formatSwissPhoneNumber = (value: string) => {
        // Remove all non-digit characters
        const digits = value.replace(/\D/g, '')

        // Format as Swiss phone number: +41 XX XXX XX XX or 0XX XXX XX XX
        if (digits.startsWith('41')) {
            // International format
            const formatted = digits.slice(0, 11) // Limit to 11 digits (41 + 9 digits)
            if (formatted.length <= 2) return `+${formatted}`
            if (formatted.length <= 4) return `+${formatted.slice(0, 2)} ${formatted.slice(2)}`
            if (formatted.length <= 7) return `+${formatted.slice(0, 2)} ${formatted.slice(2, 4)} ${formatted.slice(4)}`
            if (formatted.length <= 9) return `+${formatted.slice(0, 2)} ${formatted.slice(2, 4)} ${formatted.slice(4, 7)} ${formatted.slice(7)}`
            return `+${formatted.slice(0, 2)} ${formatted.slice(2, 4)} ${formatted.slice(4, 7)} ${formatted.slice(7, 9)} ${formatted.slice(9)}`
        } else if (digits.startsWith('0')) {
            // National format
            const formatted = digits.slice(0, 10) // Limit to 10 digits
            if (formatted.length <= 3) return formatted
            if (formatted.length <= 6) return `${formatted.slice(0, 3)} ${formatted.slice(3)}`
            if (formatted.length <= 8) return `${formatted.slice(0, 3)} ${formatted.slice(3, 6)} ${formatted.slice(6)}`
            return `${formatted.slice(0, 3)} ${formatted.slice(3, 6)} ${formatted.slice(6, 8)} ${formatted.slice(8)}`
        }
        return value
    }

    // Initialize state
    const [name, setName] = useState(therapist.name)
    const [address, setAddress] = useState(therapist.address || '')
    const [zip, setZip] = useState(therapist.zip || '')
    const [city, setCity] = useState(therapist.city || '')
    const [phoneNumber, setPhoneNumber] = useState(therapist.phoneNumber || '')

    // We keep track of both languages in state to preserve data
    const [bioEn, setBioEn] = useState(getInitialValue(therapist.bio, 'en'))
    const [bioDe, setBioDe] = useState(getInitialValue(therapist.bio, 'de'))

    const [specializationEn, setSpecializationEn] = useState(getInitialValue(therapist.specialization, 'en'))
    const [specializationDe, setSpecializationDe] = useState(getInitialValue(therapist.specialization, 'de'))

    const [isSaving, setIsSaving] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsSaving(true)
        setError(null)
        setSuccess(false)

        try {
            const response = await fetch(`/api/therapist/${therapist._id}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    name,
                    address,
                    zip,
                    city,
                    phoneNumber,
                    bio: {
                        en: bioEn,
                        de: bioDe,
                    },
                    specialization: {
                        en: specializationEn,
                        de: specializationDe,
                    },
                }),
            })

            if (!response.ok) {
                const data = await response.json()
                throw new Error(data.error || 'Failed to update profile')
            }

            setSuccess(true)
            setTimeout(() => {
                router.push('/dashboard')
                router.refresh()
            }, 1500)
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to update profile')
        } finally {
            setIsSaving(false)
        }
    }

    return (
        <form onSubmit={handleSubmit} className="bg-white shadow-md rounded-lg p-6 space-y-6">
            {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                    {error}
                </div>
            )}

            {success && (
                <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded">
                    {t('dashboard.profileUpdatedSuccess')}
                </div>
            )}

            {/* Name Field */}
            <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                    {t('dashboard.name')}
                </label>
                <input
                    type="text"
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
                    required
                />
            </div>

            {/* Email Field (Read-only) */}
            <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                    {t('dashboard.email')}
                </label>
                <input
                    type="email"
                    id="email"
                    value={therapist.email}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 cursor-not-allowed text-gray-600"
                    disabled
                />
                <p className="text-xs text-gray-500 mt-1">{t('dashboard.emailCannotBeChanged')}</p>
            </div>

            {/* Address Field */}
            <div>
                <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-2">
                    {t('dashboard.address')}
                </label>
                <input
                    type="text"
                    id="address"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
                    placeholder={t('dashboard.addressPlaceholder')}
                />
            </div>

            {/* ZIP and City Fields */}
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label htmlFor="zip" className="block text-sm font-medium text-gray-700 mb-2">
                        {t('dashboard.zip')}
                    </label>
                    <input
                        type="text"
                        id="zip"
                        value={zip}
                        onChange={(e) => setZip(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>
                <div>
                    <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-2">
                        {t('dashboard.city')}
                    </label>
                    <input
                        type="text"
                        id="city"
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>
            </div>

            {/* Phone Number Field */}
            <div>
                <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700 mb-2">
                    {t('dashboard.phoneNumber')}
                </label>
                <input
                    type="tel"
                    id="phoneNumber"
                    value={phoneNumber}
                    onChange={(e) => {
                        const formatted = formatSwissPhoneNumber(e.target.value)
                        setPhoneNumber(formatted)
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
                    placeholder={t('dashboard.phoneNumberPlaceholder')}
                />
                <p className="text-xs text-gray-500 mt-1">{t('dashboard.swissPhoneFormat')}</p>
            </div>

            {/* Specialization Field */}
            <div className="border-t pt-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">{t('dashboard.specialization')}</h2>

                {locale === 'en' ? (
                    <div>
                        <label htmlFor="specializationEn" className="block text-sm font-medium text-gray-700 mb-2">
                            {t('dashboard.specializationEnglish')}
                        </label>
                        <input
                            type="text"
                            id="specializationEn"
                            value={specializationEn}
                            onChange={(e) => setSpecializationEn(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
                            required
                        />
                    </div>
                ) : (
                    <div>
                        <label htmlFor="specializationDe" className="block text-sm font-medium text-gray-700 mb-2">
                            {t('dashboard.specializationDeutsch')}
                        </label>
                        <input
                            type="text"
                            id="specializationDe"
                            value={specializationDe}
                            onChange={(e) => setSpecializationDe(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
                            required
                        />
                    </div>
                )}
            </div>

            {/* Bio Field */}
            <div className="border-t pt-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">{t('dashboard.bio')}</h2>

                {locale === 'en' ? (
                    <div>
                        <label htmlFor="bioEn" className="block text-sm font-medium text-gray-700 mb-2">
                            {t('dashboard.bioEnglish')}
                        </label>
                        <textarea
                            id="bioEn"
                            value={bioEn}
                            onChange={(e) => setBioEn(e.target.value)}
                            rows={5}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
                            required
                        />
                        <p className="text-xs text-gray-500 mt-1">{t('dashboard.markdownSupported')}</p>
                    </div>
                ) : (
                    <div>
                        <label htmlFor="bioDe" className="block text-sm font-medium text-gray-700 mb-2">
                            {t('dashboard.bioDeutsch')}
                        </label>
                        <textarea
                            id="bioDe"
                            value={bioDe}
                            onChange={(e) => setBioDe(e.target.value)}
                            rows={5}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
                            required
                        />
                        <p className="text-xs text-gray-500 mt-1">{t('dashboard.markdownSupported')}</p>
                    </div>
                )}
            </div>

            {/* Submit Button */}
            <div className="border-t pt-6 flex gap-4">
                <button
                    type="submit"
                    disabled={isSaving}
                    className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-medium"
                >
                    {isSaving ? t('dashboard.saving') : t('dashboard.saveChanges')}
                </button>
                <button
                    type="button"
                    onClick={() => router.push('/dashboard')}
                    className="px-6 py-3 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 font-medium"
                >
                    {t('common.cancel')}
                </button>
            </div>
        </form>
    )
}
