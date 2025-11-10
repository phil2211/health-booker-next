'use client'

import { useState, useEffect, useRef, useMemo } from 'react'
import { DayPicker } from 'react-day-picker'
import { format, parseISO, startOfToday, isWithinInterval, startOfDay } from 'date-fns'
import { enUS, de } from 'date-fns/locale'
import { BlockedSlot } from '@/lib/types'
import { useLocale } from 'next-intl'
import { useTranslations } from 'next-intl'
// Import react-day-picker styles
import 'react-day-picker/src/style.css'

interface DatePickerPopoverProps {
  selectedDate?: string // YYYY-MM-DD format
  min?: Date
  max?: Date // Maximum selectable date
  blockedSlots?: BlockedSlot[] // Array of blocked date ranges
  availableDates?: Set<string> // Set of dates (YYYY-MM-DD) that have available slots
  onChange: (date: string) => void // Callback with YYYY-MM-DD format
  'data-testid'?: string
  popoverId?: string // Unique ID for the popover
}

export default function DatePickerPopover({
  selectedDate,
  min,
  max,
  blockedSlots = [],
  availableDates,
  onChange,
  'data-testid': testId,
  popoverId,
}: DatePickerPopoverProps) {
  const locale = useLocale()
  const t = useTranslations('calendar')
  
  // Get date-fns locale based on next-intl locale
  const dateFnsLocale = locale === 'de' ? de : enUS
  
  // Initialize displayText based on selectedDate prop
  const getInitialDisplayText = () => {
    if (selectedDate) {
      try {
        const date = parseISO(selectedDate)
        if (!isNaN(date.getTime())) {
          return format(date, 'MMM d, yyyy', { locale: dateFnsLocale })
        }
      } catch (error) {
        // Ignore parsing errors
      }
    }
    return t('selectDate')
  }

  const [isOpen, setIsOpen] = useState(false)
  const popoverRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // Derive selected date from prop
  const selected = useMemo(() => {
    if (selectedDate) {
      try {
        const date = parseISO(selectedDate)
        return !isNaN(date.getTime()) ? date : undefined
      } catch (error) {
        return undefined
      }
    }
    return undefined
  }, [selectedDate])

  const displayText = useMemo(() => {
    if (selectedDate) {
      try {
        const date = parseISO(selectedDate)
        if (!isNaN(date.getTime())) {
          return format(date, 'MMM d, yyyy', { locale: dateFnsLocale })
        }
      } catch (e) {
        return t('selectDate')
      }
    }
    return t('selectDate')
  }, [selectedDate, dateFnsLocale, t])

  const today = min || startOfToday()

  // Create a matcher function to check if a date is in any blocked range
  const isBlockedDate = (date: Date): boolean => {
    if (!blockedSlots || blockedSlots.length === 0) return false

    const dateStart = startOfDay(date)

    return blockedSlots.some((slot) => {
      try {
        const slotFromDate = slot.fromDate || slot.date || ''
        const slotToDate = slot.toDate || slot.date || ''

        if (!slotFromDate || !slotToDate) return false

        const from = parseISO(slotFromDate)
        const to = parseISO(slotToDate)

        if (isNaN(from.getTime()) || isNaN(to.getTime())) return false

        const fromStart = startOfDay(from)
        const toEnd = startOfDay(to)

        // Check if date is within the blocked range (inclusive)
        return isWithinInterval(dateStart, {
          start: fromStart,
          end: toEnd,
        })
      } catch {
        return false
      }
    })
  }

  // Check if a date has available slots
  const hasAvailableSlots = (date: Date): boolean => {
    if (!availableDates || availableDates.size === 0) {
      // If no available dates provided, allow all dates (backward compatibility)
      return true
    }
    const dateStr = format(date, 'yyyy-MM-dd')
    return availableDates.has(dateStr)
  }

  // Check if a date has no available slots (but is not blocked)
  const isUnavailableDate = (date: Date): boolean => {
    // Only mark as unavailable if it's not already blocked and has no available slots
    if (isBlockedDate(date)) return false
    if (date < today) return false
    if (max && date > max) return false
    return !hasAvailableSlots(date)
  }

  // Create disabled matcher: before today OR in blocked ranges OR after max date OR no available slots
  const disabledDays = (date: Date): boolean => {
    if (date < today) return true
    if (max && date > max) return true
    if (isBlockedDate(date)) return true
    // Disable dates that don't have available slots
    if (!hasAvailableSlots(date)) return true
    return false
  }


  // Handle click outside to close calendar
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node) &&
        isOpen
      ) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  // Handle keyboard: Esc closes calendar
  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false)
        triggerRef.current?.focus()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen])

  // Format display text
  const getDisplayText = () => {
    if (selected) {
      return format(selected, 'MMM d, yyyy', { locale: dateFnsLocale })
    }
    return t('selectDate')
  }

  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      const dateString = format(date, 'yyyy-MM-dd')
      onChange(dateString)
      setIsOpen(false)
      triggerRef.current?.focus()
    }
  }

  const handleClear = () => {
    onChange('')
    setIsOpen(false)
    triggerRef.current?.focus()
  }

  const handleCancel = () => {
    // Close without making changes - selected will remain as derived from props
    setIsOpen(false)
    triggerRef.current?.focus()
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        data-testid={testId || 'date-picker-trigger'}
        className="w-full min-w-44 px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 bg-white text-left flex items-center justify-between hover:border-gray-400 transition-colors font-medium"
        aria-label={t('selectDate')}
        aria-expanded={isOpen}
        aria-haspopup="dialog"
      >
        <span className="flex-1 truncate">{displayText}</span>
        <svg
          className="w-5 h-5 text-gray-400 shrink-0 ml-2"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
      </button>

      {isOpen && (
        <div
          ref={popoverRef}
          className="absolute top-full left-0 mt-1 bg-white rounded-lg shadow-lg border border-gray-200 p-4 z-50"
          style={{ width: 'max-content', maxWidth: '90vw' }}
        >
          <DayPicker
            mode="single"
            numberOfMonths={1}
            selected={selected}
            onSelect={handleDateSelect}
            disabled={disabledDays}
            locale={dateFnsLocale}
            className="rdp"
            showOutsideDays
            fixedWeeks
            modifiers={{
              blocked: (date) => isBlockedDate(date) || isUnavailableDate(date),
            }}
            modifiersClassNames={{
              blocked: 'rdp-day_blocked',
            }}
          />

          <div className="flex items-center justify-between gap-3 mt-4 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={handleClear}
              className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
              data-testid={`${testId || 'date-picker'}-clear`}
            >
              {t('clear')}
            </button>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleCancel}
                className="px-4 py-2 text-sm text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                data-testid={`${testId || 'date-picker'}-cancel`}
              >
                {t('cancel')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

