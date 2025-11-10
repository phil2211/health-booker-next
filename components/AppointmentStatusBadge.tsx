'use client'

import { BookingStatus } from '@/lib/types'
import { useTranslation } from '@/lib/i18n/useTranslation'

interface AppointmentStatusBadgeProps {
  status: BookingStatus
  className?: string
}

export default function AppointmentStatusBadge({ status, className = '' }: AppointmentStatusBadgeProps) {
  const { t } = useTranslation()
  
  const getStatusConfig = (status: BookingStatus) => {
    switch (status) {
      case BookingStatus.CONFIRMED:
        return {
          label: t('appointments.status.confirmed'),
          bgColor: 'bg-green-100',
          textColor: 'text-green-800',
          borderColor: 'border-green-200'
        }
      case BookingStatus.COMPLETED:
        return {
          label: t('appointments.status.completed'),
          bgColor: 'bg-blue-100',
          textColor: 'text-blue-800',
          borderColor: 'border-blue-200'
        }
      case BookingStatus.CANCELLED:
        return {
          label: t('appointments.status.cancelled'),
          bgColor: 'bg-red-100',
          textColor: 'text-red-800',
          borderColor: 'border-red-200'
        }
      case BookingStatus.NO_SHOW:
        return {
          label: t('appointments.status.noShow'),
          bgColor: 'bg-gray-100',
          textColor: 'text-gray-800',
          borderColor: 'border-gray-200'
        }
      case BookingStatus.PENDING:
        return {
          label: t('appointments.status.pending'),
          bgColor: 'bg-yellow-100',
          textColor: 'text-yellow-800',
          borderColor: 'border-yellow-200'
        }
      default:
        return {
          label: t('appointments.status.unknown'),
          bgColor: 'bg-gray-100',
          textColor: 'text-gray-800',
          borderColor: 'border-gray-200'
        }
    }
  }

  const config = getStatusConfig(status)

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${config.bgColor} ${config.textColor} ${config.borderColor} ${className}`}>
      {config.label}
    </span>
  )
}
