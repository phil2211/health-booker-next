'use client'

import { useState, useEffect } from 'react'
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
    const [name, setName] = useState(therapist.name || '')
    const [address, setAddress] = useState(therapist.address || '')
    const [zip, setZip] = useState(therapist.zip || '')
    const [city, setCity] = useState(therapist.city || '')
    const [phoneNumber, setPhoneNumber] = useState(therapist.phoneNumber || '')
    const [linkedinUrl, setLinkedinUrl] = useState(therapist.linkedinUrl || '')
    const [profileImage, setProfileImage] = useState<File | null>(null)
    const [isDragging, setIsDragging] = useState(false)

    // We keep track of both languages in state to preserve data
    const [bioEn, setBioEn] = useState(getInitialValue(therapist.bio, 'en'))
    const [bioDe, setBioDe] = useState(getInitialValue(therapist.bio, 'de'))

    const [specialization, setSpecialization] = useState<string[]>(
        Array.isArray(therapist.specialization) ? therapist.specialization : []
    )
    interface CategoryData {
        category: { en: string; de: string }
        tags: { id: string; name: { en: string; de: string } }[]
    }
    const [availableCategories, setAvailableCategories] = useState<CategoryData[]>([])

    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const res = await fetch('/api/tags')
                if (res.ok) {
                    const data = await res.json()
                    setAvailableCategories(data.categories)
                }
            } catch (e) {
                console.error('Failed to fetch categories', e)
            }
        }
        fetchCategories()
    }, [])

    const [isSaving, setIsSaving] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsSaving(true)
        setError(null)
        setSuccess(false)

        try {
            let body: any
            const headers: HeadersInit = {}

            if (profileImage) {
                const formData = new FormData()
                formData.append('name', name)
                formData.append('address', address)
                formData.append('zip', zip)
                formData.append('city', city)
                formData.append('phoneNumber', phoneNumber)
                formData.append('linkedinUrl', linkedinUrl)
                formData.append('bio', JSON.stringify({ en: bioEn, de: bioDe }))
                formData.append('specialization', JSON.stringify(specialization))
                formData.append('profileImage', profileImage)
                body = formData
            } else {
                headers['Content-Type'] = 'application/json'
                body = JSON.stringify({
                    name,
                    address,
                    zip,
                    city,
                    phoneNumber,
                    linkedinUrl,
                    bio: {
                        en: bioEn,
                        de: bioDe,
                    },
                    specialization,
                })
            }

            const response = await fetch(`/api/therapist/${therapist._id}`, {
                method: 'PATCH',
                headers,
                body,
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

            {/* Profile Image Field */}
            <div>
                <label htmlFor="profileImage" className="block text-sm font-medium text-gray-700 mb-2">
                    {t('dashboard.profileImage')}
                </label>
                <div
                    className={`mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-dashed rounded-md transition-colors ${isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'
                        }`}
                    onDragOver={(e) => {
                        e.preventDefault()
                        setIsDragging(true)
                    }}
                    onDragLeave={(e) => {
                        e.preventDefault()
                        setIsDragging(false)
                    }}
                    onDrop={(e) => {
                        e.preventDefault()
                        setIsDragging(false)
                        const file = e.dataTransfer.files?.[0]
                        if (file) {
                            if (file.size > 1024 * 1024) {
                                setError(t('dashboard.imageTooLarge') || 'Image too large (max 1MB)')
                                return
                            }
                            if (!['image/jpeg', 'image/png', 'image/gif'].includes(file.type)) {
                                setError(t('dashboard.imageRequirements') || 'PNG, JPEG or GIF. Max 1MB.')
                                return
                            }
                            setProfileImage(file)
                            setError(null)
                        }
                    }}
                >
                    <div className="space-y-1 text-center">
                        <svg
                            className="mx-auto h-12 w-12 text-gray-400"
                            stroke="currentColor"
                            fill="none"
                            viewBox="0 0 48 48"
                            aria-hidden="true"
                        >
                            <path
                                d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                                strokeWidth={2}
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            />
                        </svg>
                        <div className="flex text-sm text-gray-600 justify-center">
                            <label
                                htmlFor="profileImage"
                                className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500"
                            >
                                <span>{t('dashboard.uploadFile') || 'Upload a file'}</span>
                                <input
                                    id="profileImage"
                                    name="profileImage"
                                    type="file"
                                    className="sr-only"
                                    accept="image/png, image/jpeg, image/gif"
                                    onChange={(e) => {
                                        const file = e.target.files?.[0]
                                        if (file) {
                                            if (file.size > 1024 * 1024) {
                                                setError(t('dashboard.imageTooLarge') || 'Image too large (max 1MB)')
                                                e.target.value = '' // Reset input
                                                return
                                            }
                                            setProfileImage(file)
                                            setError(null)
                                        }
                                    }}
                                />
                            </label>
                            <p className="pl-1">{t('dashboard.orDragAndDrop') || 'or drag and drop'}</p>
                        </div>
                        <p className="text-xs text-gray-500">
                            {profileImage ? (
                                <span className="text-green-600 font-medium">{profileImage.name}</span>
                            ) : (
                                t('dashboard.imageRequirements') || 'PNG, JPEG or GIF. Max 1MB.'
                            )}
                        </p>
                    </div>
                </div>
            </div>

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
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
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
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
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

            {/* LinkedIn URL Field */}
            <div>
                <label htmlFor="linkedinUrl" className="block text-sm font-medium text-gray-700 mb-2">
                    {t('dashboard.linkedinUrl')}
                </label>
                <input
                    type="url"
                    id="linkedinUrl"
                    value={linkedinUrl}
                    onChange={(e) => setLinkedinUrl(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
                    placeholder="https://www.linkedin.com/in/username"
                />
            </div>

            {/* Specialization Field */}
            <div className="border-t pt-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">{t('dashboard.specialization')}</h2>
                <div className="space-y-6">
                    {availableCategories.map((catGroup) => {
                        const catId = catGroup.category.en; // Use English name as stable ID for grouping
                        const catName = locale === 'en' ? catGroup.category.en : catGroup.category.de;

                        // Check if any tag in this category is selected
                        const selectedTagsInThisCat = catGroup.tags.filter(t => specialization.includes(t.id));
                        const isCategorySelected = selectedTagsInThisCat.length > 0;

                        // Count total selected categories (groups that have at least one tag selected)
                        const selectedCategoryCount = availableCategories.filter(c =>
                            c.tags.some(t => specialization.includes(t.id))
                        ).length;

                        const isMaxCategoriesReached = !isCategorySelected && selectedCategoryCount >= 3;

                        return (
                            <div key={catId} className={`border rounded-lg p-4 ${isCategorySelected ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}`}>
                                <div className="flex items-center justify-between mb-3">
                                    <h3 className={`font-medium ${isCategorySelected ? 'text-blue-700' : 'text-gray-900'}`}>
                                        {catName}
                                    </h3>
                                    {isCategorySelected && (
                                        <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                                            {selectedTagsInThisCat.length} / 3
                                        </span>
                                    )}
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                    {catGroup.tags.map(tag => {
                                        const isSelected = specialization.includes(tag.id);
                                        const isDisabled =
                                            // Disable if category limit reached and this category is not selected
                                            (isMaxCategoriesReached && !isCategorySelected) ||
                                            // Disable if max tags (3) reached for this category and not selected
                                            (isCategorySelected && selectedTagsInThisCat.length >= 3 && !isSelected);

                                        return (
                                            <div key={tag.id} className="flex items-center">
                                                <input
                                                    type="checkbox"
                                                    id={`tag-${tag.id}`}
                                                    checked={isSelected}
                                                    disabled={isDisabled}
                                                    onChange={(e) => {
                                                        if (e.target.checked) {
                                                            setSpecialization([...specialization, tag.id])
                                                        } else {
                                                            setSpecialization(specialization.filter(id => id !== tag.id))
                                                        }
                                                    }}
                                                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                                                />
                                                <label
                                                    htmlFor={`tag-${tag.id}`}
                                                    className={`ml-2 block text-sm ${isDisabled ? 'text-gray-400' : 'text-gray-900'}`}
                                                >
                                                    {locale === 'en' ? tag.name.en : tag.name.de}
                                                </label>
                                            </div>
                                        )
                                    })}
                                </div>
                                {isCategorySelected && selectedTagsInThisCat.length === 0 && (
                                    <p className="text-xs text-red-500 mt-2">{t('dashboard.selectAtLeastOneSubCategory') || 'Please select at least one sub-category'}</p>
                                )}
                            </div>
                        )
                    })}
                </div>
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
