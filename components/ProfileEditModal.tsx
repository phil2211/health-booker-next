'use client'

import { useState } from 'react'
import { Editor, EditorProvider } from 'react-simple-wysiwyg'
import { useTranslation } from '@/lib/i18n/useTranslation'

interface ProfileEditModalProps {
    isOpen: boolean
    onClose: () => void
    therapist: {
        _id: string
        name: string
        specialization: string
        bio: string
    }
    onUpdate: () => void
}

export default function ProfileEditModal({ isOpen, onClose, therapist, onUpdate }: ProfileEditModalProps) {
    const { t } = useTranslation()
    const [name, setName] = useState(therapist.name)
    const [specialization, setSpecialization] = useState(therapist.specialization)
    const [bio, setBio] = useState(therapist.bio)
    const [isSaving, setIsSaving] = useState(false)
    const [error, setError] = useState('')

    if (!isOpen) return null

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsSaving(true)
        setError('')

        try {
            const response = await fetch(`/api/therapist/${therapist._id}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    name,
                    specialization,
                    bio,
                }),
            })

            if (!response.ok) {
                throw new Error('Failed to update profile')
            }

            onUpdate()
            onClose()
        } catch (err) {
            console.error('Error updating profile:', err)
            setError('Failed to update profile. Please try again.')
        } finally {
            setIsSaving(false)
        }
    }

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
            <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                {/* Background overlay */}
                <div
                    className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
                    aria-hidden="true"
                    onClick={onClose}
                ></div>

                {/* Modal panel */}
                <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
                <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full">
                    <form onSubmit={handleSubmit}>
                        <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                            <div className="sm:flex sm:items-start">
                                <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                                    <h3 className="text-lg leading-6 font-medium text-gray-900" id="modal-title">
                                        {t('common.edit')} {t('dashboard.yourProfile')}
                                    </h3>

                                    {error && (
                                        <div className="mt-2 bg-red-50 border-l-4 border-red-400 p-4">
                                            <div className="flex">
                                                <div className="ml-3">
                                                    <p className="text-sm text-red-700">{error}</p>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    <div className="mt-4 space-y-4">
                                        <div>
                                            <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                                                {t('dashboard.fullName')}
                                            </label>
                                            <input
                                                type="text"
                                                name="name"
                                                id="name"
                                                value={name}
                                                onChange={(e) => setName(e.target.value)}
                                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                                required
                                            />
                                        </div>

                                        <div>
                                            <label htmlFor="specialization" className="block text-sm font-medium text-gray-700">
                                                {t('dashboard.specialization')}
                                            </label>
                                            <input
                                                type="text"
                                                name="specialization"
                                                id="specialization"
                                                value={specialization}
                                                onChange={(e) => setSpecialization(e.target.value)}
                                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                                required
                                            />
                                        </div>

                                        <div>
                                            <label htmlFor="bio" className="block text-sm font-medium text-gray-700 mb-1">
                                                {t('dashboard.bio')}
                                            </label>
                                            <div className="prose max-w-none">
                                                <EditorProvider>
                                                    <Editor
                                                        value={bio}
                                                        onChange={(e) => setBio(e.target.value)}
                                                        containerProps={{ style: { minHeight: '200px' } }}
                                                    />
                                                </EditorProvider>
                                            </div>
                                            <p className="mt-1 text-sm text-gray-500">
                                                Use the toolbar to format your text (Bold, Italic, Underline).
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                            <button
                                type="submit"
                                disabled={isSaving}
                                className={`w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:ml-3 sm:w-auto sm:text-sm ${isSaving ? 'opacity-75 cursor-not-allowed' : ''
                                    }`}
                            >
                                {isSaving ? 'Saving...' : 'Save Changes'}
                            </button>
                            <button
                                type="button"
                                className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                                onClick={onClose}
                            >
                                Cancel
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    )
}
