'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useLocale } from '@/lib/i18n/LocaleProvider'
import { useTranslation } from '@/lib/i18n/useTranslation'
import WeeklyAvailabilityEditor from '@/components/WeeklyAvailabilityEditor'
import TherapyOfferingsEditor from '@/components/TherapyOfferingsEditor'
import { AvailabilityEntry, TherapyOffering } from '@/lib/types'

interface OnboardingWizardProps {
    therapist: {
        _id: string
        name: string
        email: string
        specialization: string | { en: string; de: string }
        bio: string | { en: string; de: string }
        address: string
        zip: string
        city: string
        phoneNumber: string
        weeklyAvailability: AvailabilityEntry[]
        therapyOfferings?: TherapyOffering[]
        profileImage?: {
            data: string
            contentType: string
        }
    }
}

export default function OnboardingWizard({ therapist }: OnboardingWizardProps) {
    const router = useRouter()
    const locale = useLocale()
    const { t } = useTranslation()

    // Helper to check if a field has content
    const hasContent = (field: string | { en: string; de: string } | undefined) => {
        if (!field) return false
        if (typeof field === 'string') return field.trim().length > 0
        return (field.en && field.en.trim().length > 0) || (field.de && field.de.trim().length > 0)
    }

    // Determine initial step
    const isBasicInfoComplete = !!(therapist.name && therapist.address && therapist.zip && therapist.city && therapist.phoneNumber)
    const isProfileComplete = hasContent(therapist.bio) && hasContent(therapist.specialization)
    const hasOfferings = therapist.therapyOfferings && therapist.therapyOfferings.length > 0

    const [step, setStep] = useState(() => {
        if (isBasicInfoComplete && isProfileComplete && hasOfferings) return 4
        if (isBasicInfoComplete && isProfileComplete) return 3
        if (isBasicInfoComplete) return 2
        return 1
    })
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    // Form State
    const [name, setName] = useState(therapist.name)
    const [address, setAddress] = useState(therapist.address)
    const [zip, setZip] = useState(therapist.zip)
    const [city, setCity] = useState(therapist.city)
    const [phoneNumber, setPhoneNumber] = useState(therapist.phoneNumber)

    const getInitialValue = (field: string | { en: string; de: string } | undefined, lang: 'en' | 'de') => {
        if (!field) return ''
        if (typeof field === 'string') {
            return lang === locale ? field : ''
        }
        return field[lang] || ''
    }

    const [bioEn, setBioEn] = useState(getInitialValue(therapist.bio, 'en'))
    const [bioDe, setBioDe] = useState(getInitialValue(therapist.bio, 'de'))
    const [specializationEn, setSpecializationEn] = useState(getInitialValue(therapist.specialization, 'en'))
    const [specializationDe, setSpecializationDe] = useState(getInitialValue(therapist.specialization, 'de'))

    const [profileImage, setProfileImage] = useState<File | null>(null)
    const [isDragging, setIsDragging] = useState(false)

    const [therapyOfferings, setTherapyOfferings] = useState<TherapyOffering[]>(therapist.therapyOfferings || [])
    const [weeklyAvailability, setWeeklyAvailability] = useState<AvailabilityEntry[]>(therapist.weeklyAvailability || [])

    const formatSwissPhoneNumber = (value: string) => {
        const digits = value.replace(/\D/g, '')
        if (digits.startsWith('41')) {
            const formatted = digits.slice(0, 11)
            if (formatted.length <= 2) return `+${formatted}`
            if (formatted.length <= 4) return `+${formatted.slice(0, 2)} ${formatted.slice(2)}`
            if (formatted.length <= 7) return `+${formatted.slice(0, 2)} ${formatted.slice(2, 4)} ${formatted.slice(4)}`
            if (formatted.length <= 9) return `+${formatted.slice(0, 2)} ${formatted.slice(2, 4)} ${formatted.slice(4, 7)} ${formatted.slice(7)}`
            return `+${formatted.slice(0, 2)} ${formatted.slice(2, 4)} ${formatted.slice(4, 7)} ${formatted.slice(7, 9)} ${formatted.slice(9)}`
        } else if (digits.startsWith('0')) {
            const formatted = digits.slice(0, 10)
            if (formatted.length <= 3) return formatted
            if (formatted.length <= 6) return `${formatted.slice(0, 3)} ${formatted.slice(3)}`
            if (formatted.length <= 8) return `${formatted.slice(0, 3)} ${formatted.slice(3, 6)} ${formatted.slice(6)}`
            return `${formatted.slice(0, 3)} ${formatted.slice(3, 6)} ${formatted.slice(6, 8)} ${formatted.slice(8)}`
        }
        return value
    }

    const handleNext = async () => {
        setError(null)
        if (step === 1) {
            if (!name || !address || !zip || !city || !phoneNumber) {
                setError(t('common.fillAllFields') || 'Please fill in all fields')
                return
            }
            // If profile is already complete, skip to step 3
            if (isProfileComplete) {
                setStep(3)
            } else {
                setStep(2)
            }
        } else if (step === 2) {
            if ((locale === 'en' && (!bioEn || !specializationEn)) || (locale === 'de' && (!bioDe || !specializationDe))) {
                setError(t('common.fillAllFields') || 'Please fill in all fields')
                return
            }
            setStep(3)
        } else if (step === 3) {
            if (therapyOfferings.length === 0) {
                // Optional: require at least one offering?
                // setError(t('therapyOfferings.required') || 'Please add at least one therapy offering')
                // return
            }
            setStep(4)
        } else if (step === 4) {
            // Submit everything
            await handleSubmit()
        }
    }

    const handleBack = () => {
        if (step > 1) {
            setStep(step - 1)
        }
    }

    const handleSubmit = async () => {
        setLoading(true)
        try {
            // 1. Update Profile
            const formData = new FormData()
            formData.append('name', name)
            formData.append('address', address)
            formData.append('zip', zip)
            formData.append('city', city)
            formData.append('phoneNumber', phoneNumber)
            formData.append('bio', JSON.stringify({ en: bioEn, de: bioDe }))
            formData.append('specialization', JSON.stringify({ en: specializationEn, de: specializationDe }))
            if (profileImage) {
                formData.append('profileImage', profileImage)
            }

            const profileResponse = await fetch(`/api/therapist/${therapist._id}`, {
                method: 'PATCH',
                body: formData,
            })

            if (!profileResponse.ok) {
                throw new Error('Failed to update profile')
            }

            // 2. Update Availability and Offerings
            const availabilityResponse = await fetch('/api/therapist/availability', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    weeklyAvailability,
                    therapyOfferings,
                }),
            })

            if (!availabilityResponse.ok) {
                throw new Error('Failed to update availability')
            }

            // Redirect to dashboard
            router.push('/dashboard')
            router.refresh()

        } catch (err) {
            console.error(err)
            setError(err instanceof Error ? err.message : 'An error occurred')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl mx-auto">
                {/* Progress Bar */}
                <div className="mb-8">
                    <div className="flex items-center justify-between mb-2">
                        <span className={`text-sm font-medium ${step >= 1 ? 'text-indigo-600' : 'text-gray-500'}`}>{t('onboarding.step1Label')}</span>
                        <span className={`text-sm font-medium ${step >= 2 ? 'text-indigo-600' : 'text-gray-500'}`}>{t('onboarding.step2Label')}</span>
                        <span className={`text-sm font-medium ${step >= 3 ? 'text-indigo-600' : 'text-gray-500'}`}>{t('onboarding.step3Label')}</span>
                        <span className={`text-sm font-medium ${step >= 4 ? 'text-indigo-600' : 'text-gray-500'}`}>{t('onboarding.step4Label')}</span>
                    </div>
                    <div className="h-2 bg-gray-200 rounded-full">
                        <div
                            className="h-2 bg-indigo-600 rounded-full transition-all duration-300"
                            style={{ width: `${((step - 1) / 3) * 100}%` }}
                        ></div>
                    </div>
                </div>

                <div className="bg-white shadow rounded-lg p-8">
                    <h2 className="text-2xl font-bold text-gray-900 mb-6">
                        {step === 1 && (t('onboarding.step1Title') || 'Basic Information')}
                        {step === 2 && (t('onboarding.step2Title') || 'Profile Details')}
                        {step === 3 && (t('onboarding.step3Title') || 'Therapy Offerings')}
                        {step === 4 && (t('onboarding.step4Title') || 'Set Availability')}
                    </h2>

                    {error && (
                        <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                            {error}
                        </div>
                    )}

                    {/* Step 1: Basic Info */}
                    {step === 1 && (
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">{t('common.name')}</label>
                                <input
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-black focus:ring-indigo-500 focus:border-indigo-500"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">{t('dashboard.address')}</label>
                                <input
                                    type="text"
                                    value={address}
                                    onChange={(e) => setAddress(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-black focus:ring-indigo-500 focus:border-indigo-500"
                                    required
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">{t('dashboard.zip')}</label>
                                    <input
                                        type="text"
                                        value={zip}
                                        onChange={(e) => setZip(e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-black focus:ring-indigo-500 focus:border-indigo-500"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">{t('dashboard.city')}</label>
                                    <input
                                        type="text"
                                        value={city}
                                        onChange={(e) => setCity(e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-black focus:ring-indigo-500 focus:border-indigo-500"
                                        required
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">{t('dashboard.phoneNumber')}</label>
                                <input
                                    type="tel"
                                    value={phoneNumber}
                                    onChange={(e) => setPhoneNumber(formatSwissPhoneNumber(e.target.value))}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-black focus:ring-indigo-500 focus:border-indigo-500"
                                    placeholder="+41 XX XXX XX XX"
                                    required
                                />
                            </div>
                        </div>
                    )}

                    {/* Step 2: Profile */}
                    {step === 2 && (
                        <div className="space-y-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">{t('dashboard.profileImage')}</label>
                                <div
                                    className={`mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-dashed rounded-md transition-colors ${isDragging ? 'border-indigo-500 bg-indigo-50' : 'border-gray-300 hover:border-gray-400'}`}
                                    onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                                    onDragLeave={(e) => { e.preventDefault(); setIsDragging(false); }}
                                    onDrop={(e) => {
                                        e.preventDefault();
                                        setIsDragging(false);
                                        const file = e.dataTransfer.files?.[0];
                                        if (file && ['image/jpeg', 'image/png', 'image/gif'].includes(file.type)) {
                                            setProfileImage(file);
                                        }
                                    }}
                                >
                                    <div className="space-y-1 text-center">
                                        <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                                            <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                                        </svg>
                                        <div className="flex text-sm text-gray-600 justify-center">
                                            <label htmlFor="file-upload" className="relative cursor-pointer bg-white rounded-md font-medium text-indigo-600 hover:text-indigo-500 focus-within:outline-none">
                                                <span>{t('dashboard.uploadFile')}</span>
                                                <input id="file-upload" name="file-upload" type="file" className="sr-only" accept="image/*" onChange={(e) => {
                                                    const file = e.target.files?.[0];
                                                    if (file) setProfileImage(file);
                                                }} />
                                            </label>
                                            <p className="pl-1">{t('dashboard.orDragAndDrop')}</p>
                                        </div>
                                        <p className="text-xs text-gray-500">
                                            {profileImage ? profileImage.name : t('dashboard.imageRequirements')}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">{t('dashboard.specialization')} ({locale === 'en' ? 'English' : 'Deutsch'})</label>
                                <input
                                    type="text"
                                    value={locale === 'en' ? specializationEn : specializationDe}
                                    onChange={(e) => locale === 'en' ? setSpecializationEn(e.target.value) : setSpecializationDe(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-black focus:ring-indigo-500 focus:border-indigo-500"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">{t('dashboard.bio')} ({locale === 'en' ? 'English' : 'Deutsch'})</label>
                                <textarea
                                    value={locale === 'en' ? bioEn : bioDe}
                                    onChange={(e) => locale === 'en' ? setBioEn(e.target.value) : setBioDe(e.target.value)}
                                    rows={4}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-black focus:ring-indigo-500 focus:border-indigo-500"
                                    required
                                />
                            </div>
                        </div>
                    )}

                    {/* Step 3: Therapy Offerings */}
                    {step === 3 && (
                        <div>
                            <TherapyOfferingsEditor
                                therapyOfferings={therapyOfferings}
                                onChange={setTherapyOfferings}
                                therapistBio={{ en: bioEn, de: bioDe }}
                                therapistSpecialization={{ en: specializationEn, de: specializationDe }}
                            />
                        </div>
                    )}

                    {/* Step 4: Availability */}
                    {step === 4 && (
                        <div>
                            <p className="text-gray-600 mb-4">{t('onboarding.step4Description')}</p>
                            <WeeklyAvailabilityEditor
                                weeklyAvailability={weeklyAvailability}
                                onChange={setWeeklyAvailability}
                            />
                        </div>
                    )}

                    {/* Navigation Buttons */}
                    <div className="mt-8 flex justify-between">
                        {step > 1 ? (
                            <button
                                onClick={handleBack}
                                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                                disabled={loading}
                            >
                                {t('common.back')}
                            </button>
                        ) : (
                            <div></div>
                        )}

                        <button
                            onClick={handleNext}
                            disabled={loading}
                            className="px-6 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 flex items-center"
                        >
                            {loading && (
                                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                            )}
                            {step === 4 ? t('onboarding.completeSetup') : t('common.next')}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}
