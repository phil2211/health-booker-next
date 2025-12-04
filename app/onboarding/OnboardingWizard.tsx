'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useLocale } from '@/lib/i18n/LocaleProvider'
import { useTranslation } from '@/lib/i18n/useTranslation'
import WeeklyAvailabilityEditor from '@/components/WeeklyAvailabilityEditor'
import TherapyOfferingsEditor from '@/components/TherapyOfferingsEditor'
import ResponsiveHeader from '@/components/ResponsiveHeader'
import { AvailabilityEntry, TherapyOffering, TherapyTag } from '@/lib/types'
import { AsYouType } from 'libphonenumber-js'

interface OnboardingWizardProps {
    therapist: {
        _id: string
        name: string
        gender?: string
        email: string
        specialization: any[] | string | { en: string; de: string }
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
    const isBasicInfoComplete = !!(therapist.name && therapist.address && therapist.zip && therapist.city)
    const isProfileComplete = hasContent(therapist.bio) && (Array.isArray(therapist.specialization) ? therapist.specialization.length > 0 : hasContent(therapist.specialization as any))
    const hasOfferings = therapist.therapyOfferings && therapist.therapyOfferings.length > 0

    const [step, setStep] = useState(() => {
        if (isBasicInfoComplete && isProfileComplete && hasOfferings) return 4
        if (isBasicInfoComplete && isProfileComplete) return 3
        if (isBasicInfoComplete) return 2
        return 1
    })
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})

    const scrollToError = () => {
        setTimeout(() => {
            const firstError = document.querySelector('[aria-invalid="true"]')
            if (firstError) {
                firstError.scrollIntoView({ behavior: 'smooth', block: 'center' })
                if (firstError instanceof HTMLElement) firstError.focus()
            }
        }, 100)
    }

    const validateStep = (currentStep: number) => {
        const errors: Record<string, string> = {}
        let isValid = true

        if (currentStep === 1) {
            if (!gender) errors.gender = t('common.required') || 'Required'
            if (!name.trim()) errors.name = t('common.required') || 'Required'
            if (!address.trim()) errors.address = t('common.required') || 'Required'
            if (!zip.trim()) errors.zip = t('common.required') || 'Required'
            if (!city.trim()) errors.city = t('common.required') || 'Required'
        } else if (currentStep === 2) {
            if (locale === 'en' && !bioEn.trim()) errors.bio = t('common.required') || 'Required'
            if (locale === 'de' && !bioDe.trim()) errors.bio = t('common.required') || 'Required'
            if (specialization.length === 0) errors.specialization = t('dashboard.selectAtLeastOneSubCategory') || 'Please select at least one sub-category'
        } else if (currentStep === 3) {
            therapyOfferings.forEach(offering => {
                const nameVal = typeof offering.name === 'string' ? offering.name : (locale === 'en' ? offering.name.en : offering.name.de)
                if (!nameVal || !nameVal.trim()) {
                    errors[`${offering._id}-name`] = t('common.required') || 'Required'
                }
                if (!offering.duration) {
                    errors[`${offering._id}-duration`] = t('common.required') || 'Required'
                }
                if (offering.price === undefined || offering.price === null) {
                    errors[`${offering._id}-price`] = t('common.required') || 'Required'
                }
            })
        }

        if (Object.keys(errors).length > 0) {
            setFieldErrors(errors)
            isValid = false
            scrollToError()
        } else {
            setFieldErrors({})
        }
        return isValid
    }

    // Form State
    const [gender, setGender] = useState(therapist.gender || '')
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

    const [specialization, setSpecialization] = useState<TherapyTag[]>([])

    interface CategoryData {
        category: { en: string; de: string }
        tags: TherapyTag[]
    }
    const [availableCategories, setAvailableCategories] = useState<CategoryData[]>([])

    // Track which category cards are visible/active
    const [activeCategoryIds, setActiveCategoryIds] = useState<string[]>([])
    const [hasInitializedActiveCats, setHasInitializedActiveCats] = useState(false)

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

    // Initialize active categories and specialization from saved data once categories are loaded
    useEffect(() => {
        if (availableCategories.length > 0 && !hasInitializedActiveCats) {
            const currentSpec = therapist.specialization || [];
            let normalizedSpec: TherapyTag[] = [];

            if (Array.isArray(currentSpec)) {
                if (currentSpec.length > 0) {
                    if (typeof currentSpec[0] === 'string') {
                        // Legacy: map IDs to objects
                        const allTags = availableCategories.flatMap(c => c.tags);
                        // @ts-ignore - currentSpec is string[] here but TS might think it's TherapyTag[]
                        normalizedSpec = currentSpec.map(id => allTags.find(t => t._id === id)).filter(Boolean) as TherapyTag[];
                    } else {
                        // Already objects
                        normalizedSpec = currentSpec as TherapyTag[];
                    }
                }
            }

            setSpecialization(normalizedSpec);

            const initialActive = availableCategories
                .filter(c => c.tags.some(t => normalizedSpec.some(s => s._id === t._id)))
                .map(c => c.category.en)
            setActiveCategoryIds(initialActive)
            setHasInitializedActiveCats(true)
        }
    }, [availableCategories, hasInitializedActiveCats, therapist.specialization])

    const [profileImage, setProfileImage] = useState<File | null>(null)
    const [isDragging, setIsDragging] = useState(false)
    const [isGeneratingBio, setIsGeneratingBio] = useState(false)
    const [isBioManuallyEdited, setIsBioManuallyEdited] = useState(() => {
        return !!(getInitialValue(therapist.bio, 'en') || getInitialValue(therapist.bio, 'de'))
    })

    const generateBio = async (specs: TherapyTag[]) => {
        // Don't overwrite if manually edited and not empty
        if (isBioManuallyEdited && (bioEn.trim() || bioDe.trim())) return

        setIsGeneratingBio(true)
        try {
            const response = await fetch('/api/generate-bio', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    specialization: specs,
                    locale,
                    gender
                })
            })

            if (response.ok) {
                const data = await response.json()
                if (data.bio) {
                    if (data.bio.en) setBioEn(data.bio.en)
                    if (data.bio.de) setBioDe(data.bio.de)
                }
            }
        } catch (error) {
            console.error('Failed to generate bio:', error)
        } finally {
            setIsGeneratingBio(false)
        }
    }

    const [therapyOfferings, setTherapyOfferings] = useState<TherapyOffering[]>(() => {
        if (therapist.therapyOfferings && therapist.therapyOfferings.length > 0) {
            return therapist.therapyOfferings
        }
        return [{
            _id: 'default-initial-consultation',
            name: { en: "Initial Consultation", de: "Erstkonsultation" },
            description: { en: "Initial consultation to discuss your needs and goals.", de: "Erstgespräch zur Besprechung Ihrer Bedürfnisse und Ziele." },
            duration: 60,
            breakDuration: 15,
            price: 120,
            isActive: true
        }]
    })
    const [weeklyAvailability, setWeeklyAvailability] = useState<AvailabilityEntry[]>(therapist.weeklyAvailability || [])

    const formatSwissPhoneNumber = (value: string) => {
        return new AsYouType('CH').input(value)
    }

    const handleNext = async () => {
        setError(null)
        if (!validateStep(step)) {
            setError(t('common.checkErrors') || 'Please check the errors below')
            return
        }

        if (step === 1) {
            // If profile is already complete, skip to step 3
            if (isProfileComplete) {
                setStep(3)
            } else {
                setStep(2)
            }
        } else if (step === 2) {
            setStep(3)
        } else if (step === 3) {
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
            formData.append('gender', gender)
            formData.append('name', name)
            formData.append('address', address)
            formData.append('zip', zip)
            formData.append('city', city)
            formData.append('phoneNumber', phoneNumber)
            formData.append('bio', JSON.stringify({ en: bioEn, de: bioDe }))
            formData.append('specialization', JSON.stringify(specialization))
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
        <div className="min-h-screen bg-gray-50">
            <ResponsiveHeader pageTitle={t('onboarding.title')} showBackToDashboard={false} />
            <div className="py-12 px-4 sm:px-6 lg:px-8">
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
                                    <label className="block text-sm font-medium text-gray-700 mb-1">{t('common.gender')}</label>
                                    <select
                                        value={gender}
                                        onChange={(e) => setGender(e.target.value)}
                                        className={`w-full px-3 py-2 border rounded-md text-black focus:ring-indigo-500 focus:border-indigo-500 ${fieldErrors.gender ? 'border-red-500' : 'border-gray-300'}`}
                                        required
                                        aria-invalid={!!fieldErrors.gender}
                                    >
                                        <option value="" disabled>{t('common.gender')}</option>
                                        <option value="female">{t('common.genders.female')}</option>
                                        <option value="male">{t('common.genders.male')}</option>
                                    </select>
                                    {fieldErrors.gender && <p className="mt-1 text-sm text-red-600">{fieldErrors.gender}</p>}
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">{t('common.name')}</label>
                                    <input
                                        type="text"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        className={`w-full px-3 py-2 border rounded-md text-black focus:ring-indigo-500 focus:border-indigo-500 ${fieldErrors.name ? 'border-red-500' : 'border-gray-300'}`}
                                        required
                                        aria-invalid={!!fieldErrors.name}
                                    />
                                    {fieldErrors.name && <p className="mt-1 text-sm text-red-600">{fieldErrors.name}</p>}
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">{t('dashboard.address')}</label>
                                    <input
                                        type="text"
                                        value={address}
                                        onChange={(e) => setAddress(e.target.value)}
                                        className={`w-full px-3 py-2 border rounded-md text-black focus:ring-indigo-500 focus:border-indigo-500 ${fieldErrors.address ? 'border-red-500' : 'border-gray-300'}`}
                                        required
                                        aria-invalid={!!fieldErrors.address}
                                    />
                                    {fieldErrors.address && <p className="mt-1 text-sm text-red-600">{fieldErrors.address}</p>}
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">{t('dashboard.zip')}</label>
                                        <input
                                            type="text"
                                            value={zip}
                                            onChange={(e) => setZip(e.target.value)}
                                            className={`w-full px-3 py-2 border rounded-md text-black focus:ring-indigo-500 focus:border-indigo-500 ${fieldErrors.zip ? 'border-red-500' : 'border-gray-300'}`}
                                            required
                                            aria-invalid={!!fieldErrors.zip}
                                        />
                                        {fieldErrors.zip && <p className="mt-1 text-sm text-red-600">{fieldErrors.zip}</p>}
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">{t('dashboard.city')}</label>
                                        <input
                                            type="text"
                                            value={city}
                                            onChange={(e) => setCity(e.target.value)}
                                            className={`w-full px-3 py-2 border rounded-md text-black focus:ring-indigo-500 focus:border-indigo-500 ${fieldErrors.city ? 'border-red-500' : 'border-gray-300'}`}
                                            required
                                            aria-invalid={!!fieldErrors.city}
                                        />
                                        {fieldErrors.city && <p className="mt-1 text-sm text-red-600">{fieldErrors.city}</p>}
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">{t('dashboard.phoneNumber')} ({t('common.optional') || 'Optional'})</label>
                                    <input
                                        type="tel"
                                        value={phoneNumber}
                                        onChange={(e) => setPhoneNumber(formatSwissPhoneNumber(e.target.value))}
                                        className={`w-full px-3 py-2 border rounded-md text-black focus:ring-indigo-500 focus:border-indigo-500 ${fieldErrors.phoneNumber ? 'border-red-500' : 'border-gray-300'}`}
                                        placeholder="+41 XX XXX XX XX"
                                        aria-invalid={!!fieldErrors.phoneNumber}
                                    />
                                    {fieldErrors.phoneNumber && <p className="mt-1 text-sm text-red-600">{fieldErrors.phoneNumber}</p>}
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
                                    <label className="block text-sm font-medium text-gray-700 mb-2">{t('dashboard.specialization')}</label>

                                    {/* Active Categories List */}
                                    <div className="space-y-4 mb-6">
                                        {availableCategories.map((catGroup) => {
                                            const catId = catGroup.category.en;
                                            const catName = locale === 'en' ? catGroup.category.en : catGroup.category.de;

                                            // Check if any tag in this category is selected
                                            const selectedTagsInThisCat = catGroup.tags.filter(t => specialization.some(s => s._id === t._id));

                                            // Category is active if it's in our manual list
                                            const isCategoryActive = activeCategoryIds.includes(catId);

                                            if (!isCategoryActive) return null;

                                            return (
                                                <div key={catId} className="border border-blue-200 bg-blue-50 rounded-lg p-4">
                                                    <div className="flex items-center justify-between mb-3">
                                                        <h3 className="font-medium text-blue-900">{catName}</h3>
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                // Remove all tags from this category
                                                                const tagsToRemove = catGroup.tags.map(t => t._id);
                                                                const newSpecs = specialization.filter(s => !tagsToRemove.includes(s._id));
                                                                setSpecialization(newSpecs);
                                                                // Remove from active list
                                                                setActiveCategoryIds(activeCategoryIds.filter(id => id !== catId));
                                                                generateBio(newSpecs);
                                                            }}
                                                            className="text-sm text-red-600 hover:text-red-800"
                                                        >
                                                            {t('common.remove')}
                                                        </button>
                                                    </div>

                                                    {/* Tag Picker Component */}
                                                    <div className="relative">
                                                        <div className="flex flex-wrap gap-2 p-2 bg-white border border-blue-200 rounded-md min-h-[42px]">
                                                            {selectedTagsInThisCat.map(tag => (
                                                                <span key={tag._id} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                                                                    {locale === 'en' ? tag.name.en : tag.name.de}
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => {
                                                                            const newSpecs = specialization.filter(s => s._id !== tag._id);
                                                                            setSpecialization(newSpecs);
                                                                            generateBio(newSpecs);
                                                                        }}
                                                                        className="ml-1.5 inline-flex items-center justify-center h-4 w-4 rounded-full text-blue-400 hover:bg-blue-200 hover:text-blue-600 focus:outline-none"
                                                                    >
                                                                        <span className="sr-only">Remove large option</span>
                                                                        <svg className="h-2 w-2" stroke="currentColor" fill="none" viewBox="0 0 8 8">
                                                                            <path strokeLinecap="round" strokeWidth="1.5" d="M1 1l6 6m0-6L1 7" />
                                                                        </svg>
                                                                    </button>
                                                                </span>
                                                            ))}

                                                            {selectedTagsInThisCat.length < 3 && (
                                                                <div className="relative flex-grow group">
                                                                    <select
                                                                        onChange={(e) => {
                                                                            const selectedTagId = e.target.value;
                                                                            const selectedTag = catGroup.tags.find(t => t._id === selectedTagId);
                                                                            if (selectedTag) {
                                                                                const newSpecs = [...specialization, selectedTag];
                                                                                setSpecialization(newSpecs);
                                                                                generateBio(newSpecs);

                                                                                e.target.value = ''; // Reset select
                                                                            }
                                                                        }}
                                                                        className="w-full border-none focus:ring-0 text-sm py-1 pl-2 pr-8 text-gray-500 bg-transparent cursor-pointer"
                                                                        value=""
                                                                    >
                                                                        <option value="" disabled>{t('dashboard.addTag')}</option>
                                                                        {catGroup.tags
                                                                            .filter(t => !specialization.some(s => s._id === t._id))
                                                                            .map(tag => (
                                                                                <option key={tag._id} value={tag._id}>
                                                                                    {locale === 'en' ? tag.name.en : tag.name.de}
                                                                                </option>
                                                                            ))
                                                                        }
                                                                    </select>
                                                                </div>
                                                            )}
                                                        </div>
                                                        <p className="text-xs text-gray-500 mt-1">
                                                            {selectedTagsInThisCat.length}/3 {t('dashboard.subCategoriesSelected')}
                                                        </p>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>

                                    {/* Add Category Button */}
                                    {(() => {
                                        const activeCategoryCount = activeCategoryIds.length;

                                        if (activeCategoryCount < 3) {
                                            return (
                                                <div className="relative inline-block text-left w-full">
                                                    <select
                                                        onChange={(e) => {
                                                            const catId = e.target.value;
                                                            if (catId) {
                                                                setActiveCategoryIds([...activeCategoryIds, catId]);
                                                                e.target.value = '';
                                                            }
                                                        }}
                                                        className="inline-flex justify-center w-full rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                                        value=""
                                                    >
                                                        <option value="" disabled>{t('dashboard.addMainCategory')}</option>
                                                        {availableCategories
                                                            .filter(c => !activeCategoryIds.includes(c.category.en))
                                                            .map(c => (
                                                                <option key={c.category.en} value={c.category.en}>
                                                                    {locale === 'en' ? c.category.en : c.category.de}
                                                                </option>
                                                            ))
                                                        }
                                                    </select>
                                                    <p className="text-xs text-gray-500 mt-2">
                                                        {activeCategoryCount}/3 {t('dashboard.mainCategoriesSelected')}
                                                    </p>
                                                </div>
                                            );
                                        }
                                        return (
                                            <p className="text-sm text-gray-500">
                                                {t('dashboard.maxCategoriesReached')}
                                            </p>
                                        );
                                    })()}
                                    {fieldErrors.specialization && <p className="mt-1 text-sm text-red-600">{fieldErrors.specialization}</p>}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                                        {t('dashboard.bio')} ({locale === 'en' ? 'English' : 'Deutsch'})
                                        {isGeneratingBio && (
                                            <span className="text-xs text-indigo-600 flex items-center animate-pulse">
                                                <svg className="animate-spin -ml-1 mr-1 h-3 w-3 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                </svg>
                                                Generating...
                                            </span>
                                        )}
                                    </label>
                                    <textarea
                                        value={locale === 'en' ? bioEn : bioDe}
                                        onChange={(e) => {
                                            locale === 'en' ? setBioEn(e.target.value) : setBioDe(e.target.value);
                                            setIsBioManuallyEdited(true);
                                        }}
                                        rows={4}
                                        className={`w-full px-3 py-2 border rounded-md text-black focus:ring-indigo-500 focus:border-indigo-500 ${fieldErrors.bio ? 'border-red-500' : 'border-gray-300'}`}
                                        required
                                        aria-invalid={!!fieldErrors.bio}
                                    />
                                    {fieldErrors.bio && <p className="mt-1 text-sm text-red-600">{fieldErrors.bio}</p>}
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
                                    therapistSpecialization={specialization}
                                    errors={fieldErrors}
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
        </div>
    )
}
