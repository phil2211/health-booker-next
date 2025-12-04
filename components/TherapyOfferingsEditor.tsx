'use client'

import { useState, Dispatch, SetStateAction } from 'react'
import { TherapyOffering, TherapyTag } from '@/lib/types'
import { useTranslation } from '@/lib/i18n/useTranslation'
import { useLocale } from '@/lib/i18n/LocaleProvider'

interface TherapyOfferingsEditorProps {
    therapyOfferings: TherapyOffering[]
    onChange: Dispatch<SetStateAction<TherapyOffering[]>>
    therapistBio?: string | { en: string; de: string }
    therapistSpecialization?: TherapyTag[] | string | { en: string; de: string }
    errors?: Record<string, string>
}

export default function TherapyOfferingsEditor({
    therapyOfferings,
    onChange,
    therapistBio,
    therapistSpecialization,
    errors = {},
}: TherapyOfferingsEditorProps) {
    const { t } = useTranslation()
    const locale = useLocale()
    const [editingId, setEditingId] = useState<string | null>(null)
    const [deletingId, setDeletingId] = useState<string | null>(null)
    const [generatingId, setGeneratingId] = useState<string | null>(null)

    const handleAdd = () => {
        const newOffering: TherapyOffering = {
            _id: `temp-${Date.now()}`,
            name: locale === 'en' ? { en: '', de: '' } : { en: '', de: '' },
            description: locale === 'en' ? { en: '', de: '' } : { en: '', de: '' },
            duration: 60,
            breakDuration: 30,
            price: 100,
            isActive: true,
        }
        onChange([...therapyOfferings, newOffering])
        setEditingId(newOffering._id!)
    }

    const handleRemove = (id: string) => {
        setDeletingId(id)
    }

    const confirmDelete = () => {
        if (deletingId) {
            onChange(therapyOfferings.filter((o) => o._id !== deletingId))
            setDeletingId(null)
        }
    }

    const cancelDelete = () => {
        setDeletingId(null)
    }

    const handleUpdate = (id: string, field: keyof TherapyOffering, value: any) => {
        onChange(
            therapyOfferings.map((o) =>
                o._id === id ? { ...o, [field]: value } : o
            )
        )
    }

    const handleToggleActive = (id: string) => {
        onChange(
            therapyOfferings.map((o) =>
                o._id === id ? { ...o, isActive: !o.isActive } : o
            )
        )
    }

    const getLocalizedValue = (value: string | { en: string; de: string }): string => {
        if (typeof value === 'string') return value
        return value[locale] || value.en || ''
    }

    const updateLocalizedField = (
        offering: TherapyOffering,
        field: 'name' | 'description',
        newValue: string
    ) => {
        const currentValue = offering[field]
        if (typeof currentValue === 'string') {
            // Convert to localized object
            handleUpdate(offering._id!, field, { en: newValue, de: newValue })
        } else {
            // Update the current locale
            handleUpdate(offering._id!, field, {
                ...currentValue,
                [locale]: newValue,
            })
        }
    }

    const [error, setError] = useState<string | null>(null)

    const generateDescriptionStream = async (offering: TherapyOffering, specId?: string) => {
        setError(null)
        setGeneratingId(offering._id!)

        // Use provided specId or fallback to offering's current specializationId
        const specializationId = specId || offering.specializationId

        const hasBio = typeof therapistBio === 'string' ? !!therapistBio : (!!therapistBio?.en || !!therapistBio?.de)
        const hasSpec = Array.isArray(therapistSpecialization)
            ? therapistSpecialization.length > 0
            : typeof therapistSpecialization === 'string'
                ? !!therapistSpecialization
                : (!!therapistSpecialization?.en || !!therapistSpecialization?.de)

        if (!hasBio || !hasSpec) {
            setError(t('therapyOfferings.missingProfileInfo') || 'Please complete your profile bio and specialization first.')
            setGeneratingId(null)
            return
        }

        try {
            // Find the selected tag if we have an ID
            const selectedTag = Array.isArray(therapistSpecialization)
                ? therapistSpecialization.find(t => t._id === specializationId)
                : undefined

            // Determine the name to send: if we just selected a tag, use its name, otherwise use offering name
            const nameToSend = selectedTag ? selectedTag.name : offering.name

            const response = await fetch('/api/generate-description', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    offeringName: nameToSend,
                    therapistBio,
                    therapistSpecialization,
                    subcategory: selectedTag?.subcategory,
                    specializationDescription: selectedTag?.description,
                    locale
                })
            })

            if (!response.ok) {
                const data = await response.json()
                throw new Error(data.details?.message || data.error || 'Generation failed')
            }

            const reader = response.body?.getReader()
            if (!reader) return

            const decoder = new TextDecoder()

            // Clear existing description for current locale using functional update to avoid stale state
            onChange(prev => prev.map(o => {
                if (o._id === offering._id) {
                    const currentDesc = o.description
                    let newDesc: string | { en: string; de: string }
                    if (typeof currentDesc === 'string') {
                        newDesc = { en: '', de: '' }
                    } else {
                        newDesc = { ...currentDesc, [locale]: '' }
                    }
                    return { ...o, description: newDesc }
                }
                return o
            }))

            let accumulatedDescription = ''

            while (true) {
                const { done, value } = await reader.read()
                if (done) break

                const chunk = decoder.decode(value, { stream: true })
                accumulatedDescription += chunk

                // Update the state with the new chunk appended
                // We need to be careful here because updateLocalizedField triggers a state update
                // We should probably update the local variable and then call updateLocalizedField
                // However, updateLocalizedField relies on 'offering' which might be stale in the loop
                // So we need to use the functional update form of onChange, but updateLocalizedField doesn't support that directly.
                // A better approach is to update the state directly here.

                onChange(prevOfferings => prevOfferings.map(o => {
                    if (o._id === offering._id) {
                        const currentDesc = o.description
                        let newDesc: string | { en: string; de: string }

                        if (typeof currentDesc === 'string') {
                            newDesc = { en: accumulatedDescription, de: accumulatedDescription }
                        } else {
                            newDesc = { ...currentDesc, [locale]: accumulatedDescription }
                        }
                        return { ...o, description: newDesc }
                    }
                    return o
                }))
            }

        } catch (error) {
            console.error('Generation error:', error)
            setError(error instanceof Error ? error.message : 'Failed to generate description')
        } finally {
            setGeneratingId(null)
        }
    }

    const handleGenerateDescription = (offering: TherapyOffering) => {
        generateDescriptionStream(offering)
    }

    const handleSpecializationSelect = (offering: TherapyOffering, tagId: string) => {
        if (!Array.isArray(therapistSpecialization)) return

        const tag = therapistSpecialization.find(t => t._id === tagId)
        if (tag) {
            // Update name with localized tag name
            const newName = {
                en: tag.name.en,
                de: tag.name.de
            }

            // Update state first
            const updatedOfferings = therapyOfferings.map((o) =>
                o._id === offering._id
                    ? { ...o, name: newName, specializationId: tag._id }
                    : o
            )
            onChange(updatedOfferings)

            // Then trigger generation with the new tag
            // We need to pass the updated offering or at least the tagId
            // Since state update is async, we can't rely on 'therapyOfferings' being updated immediately in the next line if we were to find it there.
            // But we can pass the tagId to generateDescriptionStream

            // We need to find the updated offering object to pass to generateDescriptionStream
            const updatedOffering = updatedOfferings.find(o => o._id === offering._id)
            if (updatedOffering) {
                generateDescriptionStream(updatedOffering, tagId)
            }
        }
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between mb-4">
                <div>
                    <h3 className="text-xl font-semibold text-gray-900">
                        {t('therapyOfferings.title')}
                    </h3>
                    <p className="text-sm text-gray-600 mt-1">
                        {t('therapyOfferings.description')}
                    </p>

                </div>
            </div>

            {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4 text-sm text-red-800 flex items-center">
                    <svg className="w-4 h-4 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {error}
                </div>
            )}

            {therapyOfferings.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                    <svg
                        className="w-12 h-12 text-gray-400 mx-auto mb-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                        />
                    </svg>
                    <p className="text-gray-600">{t('therapyOfferings.noOfferings')}</p>
                    <button
                        onClick={handleAdd}
                        className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 mx-auto"
                    >
                        <svg
                            className="-ml-1 mr-2 h-5 w-5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 4v16m8-8H4"
                            />
                        </svg>
                        {t('therapyOfferings.addNew')}
                    </button>
                </div>
            ) : (
                <div className="space-y-4">
                    {therapyOfferings.map((offering) => (
                        <div
                            key={offering._id}
                            className={`border rounded-lg p-4 transition-all ${offering.isActive
                                ? 'bg-white border-gray-200'
                                : 'bg-gray-50 border-gray-300 opacity-60'
                                }`}
                        >
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <button
                                        onClick={() => handleToggleActive(offering._id!)}
                                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${offering.isActive ? 'bg-indigo-600' : 'bg-gray-300'
                                            }`}
                                    >
                                        <span
                                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${offering.isActive ? 'translate-x-6' : 'translate-x-1'
                                                }`}
                                        />
                                    </button>
                                    <span className="text-sm font-medium text-gray-700">
                                        {offering.isActive
                                            ? t('therapyOfferings.active')
                                            : t('therapyOfferings.inactive')}
                                    </span>
                                </div>
                                <button
                                    onClick={() => handleRemove(offering._id!)}
                                    className="text-red-600 hover:text-red-700 p-1"
                                    title={t('common.delete')}
                                >
                                    <svg
                                        className="w-5 h-5"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                        />
                                    </svg>
                                </button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* Specialization Selection */}
                                {Array.isArray(therapistSpecialization) && therapistSpecialization.length > 0 && (
                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            {t('therapyOfferings.selectSpecialization') || 'Select from Profile'}
                                        </label>
                                        <select
                                            onChange={(e) => handleSpecializationSelect(offering, e.target.value)}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-black"
                                            value={offering.specializationId || ""}
                                        >
                                            <option value="" disabled>
                                                {t('therapyOfferings.selectSpecializationPlaceholder') || 'Choose a specialization...'}
                                            </option>
                                            {therapistSpecialization.map((tag) => (
                                                <option key={tag._id} value={tag._id}>
                                                    {getLocalizedValue(tag.name)}
                                                </option>
                                            ))}
                                        </select>
                                        {errors[`${offering._id}-specialization`] && (
                                            <p className="mt-1 text-sm text-red-600">{errors[`${offering._id}-specialization`]}</p>
                                        )}
                                    </div>
                                )}

                                {/* Name */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        {t('therapyOfferings.name')}
                                    </label>
                                    <input
                                        type="text"
                                        value={getLocalizedValue(offering.name)}
                                        onChange={(e) =>
                                            updateLocalizedField(offering, 'name', e.target.value)
                                        }
                                        placeholder={t('therapyOfferings.namePlaceholder')}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-black"
                                        aria-invalid={!!errors[`${offering._id}-name`]}
                                    />
                                    {errors[`${offering._id}-name`] && (
                                        <p className="mt-1 text-sm text-red-600">{errors[`${offering._id}-name`]}</p>
                                    )}
                                </div>

                                {/* Duration */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        {t('therapyOfferings.duration')}
                                    </label>
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="number"
                                            min="15"
                                            max="240"
                                            step="15"
                                            value={offering.duration}
                                            onChange={(e) =>
                                                handleUpdate(
                                                    offering._id!,
                                                    'duration',
                                                    parseInt(e.target.value) || 60
                                                )
                                            }
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-black"
                                            aria-invalid={!!errors[`${offering._id}-duration`]}
                                        />
                                        <span className="text-sm text-gray-600 whitespace-nowrap">
                                            {t('therapyOfferings.minutes')}
                                        </span>
                                    </div>
                                    {errors[`${offering._id}-duration`] && (
                                        <p className="mt-1 text-sm text-red-600">{errors[`${offering._id}-duration`]}</p>
                                    )}
                                </div>

                                {/* Break Duration */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        {t('therapyOfferings.breakDuration')}
                                    </label>
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="number"
                                            min="0"
                                            max="60"
                                            step="5"
                                            value={offering.breakDuration}
                                            onChange={(e) =>
                                                handleUpdate(
                                                    offering._id!,
                                                    'breakDuration',
                                                    parseInt(e.target.value) || 0
                                                )
                                            }
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-black"
                                        />
                                        <span className="text-sm text-gray-600 whitespace-nowrap">
                                            {t('therapyOfferings.minutes')}
                                        </span>
                                    </div>
                                </div>

                                {/* Price */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        {t('therapyOfferings.price')}
                                    </label>
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="number"
                                            min="0"
                                            step="5"
                                            value={offering.price || 0}
                                            onChange={(e) =>
                                                handleUpdate(
                                                    offering._id!,
                                                    'price',
                                                    parseFloat(e.target.value) || 0
                                                )
                                            }
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-black"
                                            aria-invalid={!!errors[`${offering._id}-price`]}
                                        />
                                        <span className="text-sm text-gray-600 whitespace-nowrap">
                                            CHF
                                        </span>
                                    </div>
                                    {errors[`${offering._id}-price`] && (
                                        <p className="mt-1 text-sm text-red-600">{errors[`${offering._id}-price`]}</p>
                                    )}
                                </div>

                                {/* Total Time (calculated) */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        {t('therapyOfferings.totalTime')}
                                    </label>
                                    <div className="px-3 py-2 bg-gray-100 border border-gray-300 rounded-lg text-gray-700">
                                        {offering.duration + offering.breakDuration}{' '}
                                        {t('therapyOfferings.minutes')}
                                    </div>
                                </div>

                                {/* Description */}
                                <div className="md:col-span-2">
                                    <div className="flex items-center justify-between mb-1">
                                        <label className="block text-sm font-medium text-gray-700">
                                            {t('therapyOfferings.descriptionLabel')}
                                        </label>
                                        <button
                                            onClick={() => handleGenerateDescription(offering)}
                                            disabled={generatingId === offering._id}
                                            className="text-indigo-600 hover:text-indigo-800 p-1 rounded-full hover:bg-indigo-50 transition-colors"
                                            title="Generate description with AI"
                                            type="button"
                                        >
                                            {generatingId === offering._id ? (
                                                <svg className="animate-spin w-5 h-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                </svg>
                                            ) : (
                                                <svg className="w-5 h-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                                                </svg>
                                            )}
                                        </button>
                                    </div>
                                    <textarea
                                        value={getLocalizedValue(offering.description)}
                                        onChange={(e) =>
                                            updateLocalizedField(offering, 'description', e.target.value)
                                        }
                                        placeholder={t('therapyOfferings.descriptionPlaceholder')}
                                        rows={3}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-black"
                                        aria-invalid={!!errors[`${offering._id}-description`]}
                                    />
                                    {errors[`${offering._id}-description`] && (
                                        <p className="mt-1 text-sm text-red-600">{errors[`${offering._id}-description`]}</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                    {/* Add New Button at Bottom */}
                    <button
                        onClick={handleAdd}
                        className="w-full py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-indigo-500 hover:text-indigo-600 hover:bg-indigo-50 transition-all flex items-center justify-center gap-2 font-medium"
                    >
                        <svg
                            className="w-5 h-5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 4v16m8-8H4"
                            />
                        </svg>
                        {t('therapyOfferings.addNew')}
                    </button>
                </div>
            )}

            {/* Delete Confirmation Dialog */}
            {deletingId && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-xl">
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">
                            {t('therapyOfferings.confirmDelete')}
                        </h3>
                        <p className="text-gray-600 mb-6">
                            {t('therapyOfferings.deleteWarning')}
                        </p>
                        <div className="flex justify-end gap-3">
                            <button
                                onClick={cancelDelete}
                                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                            >
                                {t('common.cancel')}
                            </button>
                            <button
                                onClick={confirmDelete}
                                className="px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors"
                            >
                                {t('common.delete')}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
