'use client'

import { useState, useRef, useEffect } from 'react'
import { useTranslation } from '@/lib/i18n/useTranslation'

interface TopUpModalProps {
    onClose: () => void
    onTopUp: (amount: number) => Promise<void>
}

export default function TopUpModal({
    onClose,
    onTopUp
}: TopUpModalProps) {
    const { t } = useTranslation()
    const [amount, setAmount] = useState<number>(50)
    const [loading, setLoading] = useState(false)
    const inputRef = useRef<HTMLInputElement>(null)

    useEffect(() => {
        if (inputRef.current) {
            inputRef.current.focus()
        }
    }, [])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        try {
            await onTopUp(amount)
            onClose()
        } catch (error) {
            // Error handling is done in the parent component
            console.error(error)
        } finally {
            setLoading(false)
        }
    }

    const predefinedAmounts = [20, 50, 100, 200]

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
                <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                    <h3 className="text-lg font-semibold text-gray-900">Top Up Account</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-500">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-3">
                            Select Amount
                        </label>
                        <div className="grid grid-cols-4 gap-3 mb-4">
                            {predefinedAmounts.map((preset) => (
                                <button
                                    key={preset}
                                    type="button"
                                    onClick={() => setAmount(preset)}
                                    className={`py-2 px-3 rounded-lg text-sm font-medium border transition-colors ${amount === preset
                                            ? 'bg-emerald-50 border-emerald-500 text-emerald-700'
                                            : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                                        }`}
                                >
                                    CHF {preset}
                                </button>
                            ))}
                        </div>

                        <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-2">
                            Custom Amount (CHF)
                        </label>
                        <div className="relative rounded-md shadow-sm">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <span className="text-gray-500 sm:text-sm">CHF</span>
                            </div>
                            <input
                                ref={inputRef}
                                type="number"
                                name="amount"
                                id="amount"
                                min="1"
                                step="1"
                                value={amount}
                                onChange={(e) => setAmount(Number(e.target.value))}
                                className="focus:ring-emerald-500 focus:border-emerald-500 block w-full pl-12 pr-12 sm:text-sm border-gray-300 rounded-md py-3 text-black"
                                placeholder="0.00"
                                required
                            />
                            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                                <span className="text-gray-500 sm:text-sm">CHF</span>
                            </div>
                        </div>
                    </div>

                    <div className="bg-gray-50 -mx-6 -mb-6 px-6 py-4 flex justify-end space-x-3 rounded-b-xl">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors shadow-sm"
                            disabled={loading}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="px-4 py-2 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                            disabled={loading || amount <= 0}
                        >
                            {loading ? (
                                <>
                                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Processing...
                                </>
                            ) : (
                                'Add Funds'
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
