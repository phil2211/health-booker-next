'use client'

import { useState, useEffect, useRef } from 'react'
import { DayPicker } from 'react-day-picker'
import { format, parseISO, startOfToday, isWithinInterval, startOfDay } from 'date-fns'
import { BlockedSlot } from '@/lib/types'
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
}

export default function DatePickerPopover({
  selectedDate,
  min,
  max,
  blockedSlots = [],
  availableDates,
  onChange,
  'data-testid': testId,
}: DatePickerPopoverProps) {
  const [selected, setSelected] = useState<Date | undefined>(undefined)
  const [isOpen, setIsOpen] = useState(false)
  const popoverRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  
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

  // Initialize selected date from props
  useEffect(() => {
    if (selectedDate) {
      try {
        const date = parseISO(selectedDate)
        if (!isNaN(date.getTime())) {
          const timeoutId = setTimeout(() => {
            setSelected(date)
          }, 0)
          return () => clearTimeout(timeoutId)
        }
      } catch (error) {
        const timeoutId = setTimeout(() => {
          setSelected(undefined)
        }, 0)
        return () => clearTimeout(timeoutId)
      }
    } else {
      const timeoutId = setTimeout(() => {
        setSelected(undefined)
      }, 0)
      return () => clearTimeout(timeoutId)
    }
  }, [selectedDate])

  // Handle popover events
  useEffect(() => {
    const popover = popoverRef.current
    if (!popover) return

    const handleToggle = (e: ToggleEvent) => {
      setIsOpen(e.newState === 'open')
    }

    popover.addEventListener('toggle', handleToggle)
    return () => {
      popover.removeEventListener('toggle', handleToggle)
    }
  }, [])

  // Handle keyboard: Esc closes popover
  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        popoverRef.current?.hidePopover()
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
      return format(selected, 'MMM d, yyyy')
    }
    return 'Select date'
  }

  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      setSelected(date)
      onChange(format(date, 'yyyy-MM-dd'))
      popoverRef.current?.hidePopover()
      triggerRef.current?.focus()
    }
  }

  const handleClear = () => {
    setSelected(undefined)
    onChange('')
    popoverRef.current?.hidePopover()
    triggerRef.current?.focus()
  }

  const handleCancel = () => {
    // Reset to original value
    if (selectedDate) {
      try {
        const date = parseISO(selectedDate)
        if (!isNaN(date.getTime())) {
          setSelected(date)
        } else {
          setSelected(undefined)
        }
      } catch {
        setSelected(undefined)
      }
    } else {
      setSelected(undefined)
    }
    popoverRef.current?.hidePopover()
    triggerRef.current?.focus()
  }

  return (
    <div className="relative">
      <button
        ref={triggerRef}
        type="button"
        popoverTarget="date-picker-popover"
        data-testid={testId || 'date-picker-trigger'}
        className="w-full min-w-44 px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 bg-white text-left flex items-center justify-between hover:border-gray-400 transition-colors font-medium"
        aria-label="Select date"
      >
        <span className="flex-1 truncate">{getDisplayText()}</span>
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

      <div
        ref={popoverRef}
        id="date-picker-popover"
        popover="auto"
        className="bg-white rounded-lg shadow-lg border border-gray-200 p-4 z-50"
        style={{ width: 'max-content', maxWidth: '90vw' }}
      >
        <DayPicker
          mode="single"
          numberOfMonths={1}
          selected={selected}
          onSelect={handleDateSelect}
          disabled={disabledDays}
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
            Clear
          </button>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleCancel}
              className="px-4 py-2 text-sm text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              data-testid={`${testId || 'date-picker'}-cancel`}
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

