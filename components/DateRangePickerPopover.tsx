'use client'

import { useState, useEffect, useRef } from 'react'
import { DayPicker, DateRange, Matcher } from 'react-day-picker'
import { format, parseISO, startOfToday, isWithinInterval, startOfDay } from 'date-fns'
import { de, enUS } from 'date-fns/locale'
import { BlockedSlot } from '@/lib/types'
import { useTranslation } from '@/lib/i18n/useTranslation'
// Import react-day-picker styles
import 'react-day-picker/src/style.css'

interface DateRangePickerPopoverProps {
  fromDate?: string // YYYY-MM-DD format
  toDate?: string // YYYY-MM-DD format
  startTime?: string // HH:mm format
  endTime?: string // HH:mm format
  min?: Date
  blockedSlots?: BlockedSlot[] // Array of blocked date ranges
  onChange: (data: { from: string; to: string; startTime: string; endTime: string }) => void
  onApply?: (data: { from: string; to: string; startTime: string; endTime: string }) => void // Optional callback when Apply is clicked
  'data-testid'?: string
}

export default function DateRangePickerPopover({
  fromDate,
  toDate,
  startTime = '09:00',
  endTime = '17:00',
  min,
  blockedSlots = [],
  onChange,
  onApply,
  'data-testid': testId,
}: DateRangePickerPopoverProps) {
  const { t, locale } = useTranslation()
  const dateFnsLocale = locale === 'de' ? de : enUS
  
  const [selected, setSelected] = useState<DateRange | undefined>(undefined)
  const [selectedStartTime, setSelectedStartTime] = useState<string>(startTime)
  const [selectedEndTime, setSelectedEndTime] = useState<string>(endTime)
  const [isOpen, setIsOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const popoverRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const startTimeInputRef = useRef<HTMLInputElement>(null)
  const endTimeInputRef = useRef<HTMLInputElement>(null)
  
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

  // Create disabled matcher: before today OR in blocked ranges
  const disabledDays: Matcher = (date: Date) => {
    return date < today || isBlockedDate(date)
  }

  // Initialize selected range and times from props
  useEffect(() => {
    if (fromDate && toDate) {
      try {
        const from = parseISO(fromDate)
        const to = parseISO(toDate)
        if (!isNaN(from.getTime()) && !isNaN(to.getTime())) {
          // Use setTimeout to defer state update and avoid cascading renders
          const timeoutId = setTimeout(() => {
            setSelected({ from, to })
          }, 0)
          return () => clearTimeout(timeoutId)
        }
      } catch (error) {
        // Invalid dates, clear selection
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
  }, [fromDate, toDate])

  // Initialize times from props
  useEffect(() => {
    // Use setTimeout to defer state update and avoid cascading renders
    const timeoutId = setTimeout(() => {
      if (startTime) setSelectedStartTime(startTime)
      if (endTime) setSelectedEndTime(endTime)
    }, 0)
    return () => clearTimeout(timeoutId)
  }, [startTime, endTime])

  // Handle popover events
  useEffect(() => {
    const popover = popoverRef.current
    if (!popover) return

    const handleToggle = (e: ToggleEvent) => {
      setIsOpen(e.newState === 'open')
      // Center the popover when it's opened
      if (e.newState === 'open') {
        // Use setTimeout to ensure the popover is rendered before repositioning
        setTimeout(() => {
          if (popover) {
            popover.style.position = 'fixed'
            popover.style.top = '50%'
            popover.style.left = '50%'
            popover.style.transform = 'translate(-50%, -50%)'
            popover.style.zIndex = '50'
          }
        }, 0)
      }
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

  // Detect mobile screen size
  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }

    checkIsMobile()
    window.addEventListener('resize', checkIsMobile)

    return () => {
      window.removeEventListener('resize', checkIsMobile)
    }
  }, [])

  // Format display text
  const getDisplayText = () => {
    if (selected?.from && selected?.to && selectedStartTime && selectedEndTime) {
      return `${format(selected.from, 'MMM d, yyyy', { locale: dateFnsLocale })} ${selectedStartTime} – ${format(selected.to, 'MMM d, yyyy', { locale: dateFnsLocale })} ${selectedEndTime}`
    }
    if (selected?.from && selectedStartTime) {
      return `${format(selected.from, 'MMM d, yyyy', { locale: dateFnsLocale })} ${selectedStartTime} – ...`
    }
    return t('blockedSlots.dateRangeTimes')
  }

  const handleApply = () => {
    if (selected?.from && selected?.to && selectedStartTime && selectedEndTime) {
      const data = {
        from: format(selected.from, 'yyyy-MM-dd'),
        to: format(selected.to, 'yyyy-MM-dd'),
        startTime: selectedStartTime,
        endTime: selectedEndTime,
      }
      
      // Call onApply if provided, otherwise call onChange
      if (onApply) {
        onApply(data)
        // Reset selection after applying
        setSelected(undefined)
        setSelectedStartTime('09:00')
        setSelectedEndTime('17:00')
      } else {
        onChange(data)
      }
      
      popoverRef.current?.hidePopover()
      triggerRef.current?.focus()
    }
  }

  const handleClear = () => {
    setSelected(undefined)
    setSelectedStartTime('09:00')
    setSelectedEndTime('17:00')
    onChange({ from: '', to: '', startTime: '09:00', endTime: '17:00' })
    popoverRef.current?.hidePopover()
    triggerRef.current?.focus()
  }

  const handleCancel = () => {
    // Reset to original values
    if (fromDate && toDate) {
      try {
        const from = parseISO(fromDate)
        const to = parseISO(toDate)
        if (!isNaN(from.getTime()) && !isNaN(to.getTime())) {
          setSelected({ from, to })
        } else {
          setSelected(undefined)
        }
      } catch {
        setSelected(undefined)
      }
    } else {
      setSelected(undefined)
    }
    if (startTime) setSelectedStartTime(startTime)
    if (endTime) setSelectedEndTime(endTime)
    popoverRef.current?.hidePopover()
    triggerRef.current?.focus()
  }

  return (
    <div className="relative">
      <button
        ref={triggerRef}
        type="button"
        popoverTarget="date-range-popover"
        data-testid={testId || 'blocked-range-trigger'}
        className="w-full min-w-44 px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 bg-white text-left flex items-center justify-between hover:border-gray-400 transition-colors"
        aria-label={t('blockedSlots.dateRangeTimes')}
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
        id="date-range-popover"
        popover="auto"
        className="bg-white rounded-lg shadow-lg border border-gray-200 p-4"
        style={{ width: 'max-content', maxWidth: '90vw' }}
      >
        <DayPicker
          mode="range"
          numberOfMonths={isMobile ? 1 : 2}
          selected={selected}
          onSelect={setSelected}
          disabled={disabledDays}
          className="rdp"
          showOutsideDays
          fixedWeeks
          locale={dateFnsLocale}
          modifiers={{
            blocked: (date) => isBlockedDate(date),
          }}
          modifiersClassNames={{
            blocked: 'rdp-day_blocked',
          }}
        />
        
        {/* Time inputs */}
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="grid grid-cols-2 gap-4 mb-4 min-w-0">
            <div className="min-w-0">
              <label className="block text-xs font-medium text-gray-700 mb-1">
                {t('availabilityEditor.startTime')}
              </label>
              <div className="relative w-full min-w-0 overflow-hidden">
                <input
                  ref={startTimeInputRef}
                  type="time"
                  value={selectedStartTime}
                  onChange={(e) => setSelectedStartTime(e.target.value)}
                  className="w-full min-w-0 px-3 py-2 pr-14 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-black"
                />
                <button
                  type="button"
                  onClick={() => startTimeInputRef.current?.showPicker?.() || startTimeInputRef.current?.focus()}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none focus:text-gray-600 pointer-events-auto"
                  aria-label="Open time picker"
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
                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </button>
              </div>
            </div>
            <div className="min-w-0">
              <label className="block text-xs font-medium text-gray-700 mb-1">
                {t('availabilityEditor.endTime')}
              </label>
              <div className="relative w-full min-w-0 overflow-hidden">
                <input
                  ref={endTimeInputRef}
                  type="time"
                  value={selectedEndTime}
                  onChange={(e) => setSelectedEndTime(e.target.value)}
                  className="w-full min-w-0 px-3 py-2 pr-14 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-black"
                />
                <button
                  type="button"
                  onClick={() => endTimeInputRef.current?.showPicker?.() || endTimeInputRef.current?.focus()}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none focus:text-gray-600 pointer-events-auto"
                  aria-label="Open time picker"
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
                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
        
        <div className="flex items-center justify-between gap-3 mt-4 pt-4 border-t border-gray-200">
          <button
            type="button"
            onClick={handleClear}
            className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
            data-testid={`${testId || 'blocked-range'}-clear`}
          >
            {t('common.clear')}
          </button>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleCancel}
              className="px-4 py-2 text-sm text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              data-testid={`${testId || 'blocked-range'}-cancel`}
            >
              {t('common.cancel')}
            </button>
            <button
              type="button"
              onClick={handleApply}
              disabled={!selected?.from || !selected?.to || !selectedStartTime || !selectedEndTime}
              className="px-4 py-2 text-sm text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
              data-testid={`${testId || 'blocked-range'}-apply`}
            >
              {t('common.apply')}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

