'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useLocale } from '@/lib/i18n/LocaleProvider'
import { TherapistDocument } from '@/models/Therapist'

interface ProfileEditFormProps {
    therapist: TherapistDocument
}

export default function ProfileEditForm({ therapist }: ProfileEditFormProps) {
    const router = useRouter()
    const locale = useLocale()

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

    // Initialize state
    const [name, setName] = useState(therapist.name)

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
                    Profile updated successfully! Redirecting...
                </div>
            )}

            {/* Name Field */}
            <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                    Name
                </label>
                <input
                    type="text"
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                />
            </div>

            {/* Email Field (Read-only) */}
            <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                    Email
                </label>
                <input
                    type="email"
                    id="email"
                    value={therapist.email}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 cursor-not-allowed"
                    disabled
                />
                <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
            </div>

            {/* Specialization Field */}
            <div className="border-t pt-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Specialization</h2>

                {locale === 'en' ? (
                    <div>
                        <label htmlFor="specializationEn" className="block text-sm font-medium text-gray-700 mb-2">
                            Specialization (English)
                        </label>
                        <input
                            type="text"
                            id="specializationEn"
                            value={specializationEn}
                            onChange={(e) => setSpecializationEn(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            required
                        />
                    </div>
                ) : (
                    <div>
                        <label htmlFor="specializationDe" className="block text-sm font-medium text-gray-700 mb-2">
                            Specialization (Deutsch)
                        </label>
                        <input
                            type="text"
                            id="specializationDe"
                            value={specializationDe}
                            onChange={(e) => setSpecializationDe(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            required
                        />
                    </div>
                )}
            </div>

            {/* Bio Field */}
            <div className="border-t pt-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Bio</h2>

                {locale === 'en' ? (
                    <div>
                        <label htmlFor="bioEn" className="block text-sm font-medium text-gray-700 mb-2">
                            Bio (English)
                        </label>
                        <textarea
                            id="bioEn"
                            value={bioEn}
                            onChange={(e) => setBioEn(e.target.value)}
                            rows={5}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            required
                        />
                    </div>
                ) : (
                    <div>
                        <label htmlFor="bioDe" className="block text-sm font-medium text-gray-700 mb-2">
                            Bio (Deutsch)
                        </label>
                        <textarea
                            id="bioDe"
                            value={bioDe}
                            onChange={(e) => setBioDe(e.target.value)}
                            rows={5}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            required
                        />
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
                    {isSaving ? 'Saving...' : 'Save Changes'}
                </button>
                <button
                    type="button"
                    onClick={() => router.push('/dashboard')}
                    className="px-6 py-3 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 font-medium"
                >
                    Cancel
                </button>
            </div>
        </form>
    )
}
