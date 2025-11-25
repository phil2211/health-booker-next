'use client'

import { useState } from 'react'
import { TherapyOffering } from '@/lib/types'
import { useTranslation } from '@/lib/i18n/useTranslation'
import { useLocale } from '@/lib/i18n/LocaleProvider'

interface TherapyOfferingsEditorProps {
    therapyOfferings: TherapyOffering[]
    onChange: (offerings: TherapyOffering[]) => void
}

export default function TherapyOfferingsEditor({
    therapyOfferings,
    onChange,
}: TherapyOfferingsEditorProps) {
    const { t } = useTranslation()
    const locale = useLocale()
    const [editingId, setEditingId] = useState<string | null>(null)
    const [deletingId, setDeletingId] = useState<string | null>(null)

    const handleAdd = () => {
        const newOffering: TherapyOffering = {
            _id: `temp-${Date.now()}`,
            name: locale === 'en' ? { en: '', de: '' } : { en: '', de: '' },
            description: locale === 'en' ? { en: '', de: '' } : { en: '', de: '' },
            duration: 60,
            breakDuration: 30,
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
                <button
                    onClick={handleAdd}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors flex items-center gap-2"
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
                    <p className="text-sm text-gray-500 mt-2">
                        {t('therapyOfferings.clickAddToStart')}
                    </p>
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
                                    />
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
                                        />
                                        <span className="text-sm text-gray-600 whitespace-nowrap">
                                            {t('therapyOfferings.minutes')}
                                        </span>
                                    </div>
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
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        {t('therapyOfferings.descriptionLabel')}
                                    </label>
                                    <textarea
                                        value={getLocalizedValue(offering.description)}
                                        onChange={(e) =>
                                            updateLocalizedField(offering, 'description', e.target.value)
                                        }
                                        placeholder={t('therapyOfferings.descriptionPlaceholder')}
                                        rows={3}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-black"
                                    />
                                </div>
                            </div>
                        </div>
                    ))}
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
