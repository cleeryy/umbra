'use client'

import { X, CheckCircle, AlertCircle, AlertTriangle, Info } from 'lucide-react'
import { Alert as AlertType } from '@/app/types'

interface AlertProps {
  alert: AlertType
  onClose?: () => void
}

const alertStyles = {
  success: {
    bg: 'bg-green-50',
    border: 'border-green-200',
    text: 'text-green-600',
    icon: CheckCircle,
  },
  error: {
    bg: 'bg-red-50',
    border: 'border-red-200',
    text: 'text-red-600',
    icon: AlertCircle,
  },
  warning: {
    bg: 'bg-yellow-50',
    border: 'border-yellow-200',
    text: 'text-yellow-600',
    icon: AlertTriangle,
  },
  info: {
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    text: 'text-blue-600',
    icon: Info,
  },
}

export default function Alert({ alert, onClose }: AlertProps) {
  const style = alertStyles[alert.type]
  const Icon = style.icon

  return (
    <div className={`${style.bg} ${style.border} border rounded-lg`}>
      <div className="p-4 flex items-start justify-between">
        <div className="flex items-start space-x-3">
          <Icon className={`h-5 w-5 ${style.text} flex-shrink-0 mt-0.5`} />
          <p className={`text-sm ${style.text}`}>{alert.message}</p>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="ml-4 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  )
}

interface AlertContainerProps {
  alerts: AlertType[]
  onClose: (index: number) => void
}

export function AlertContainer({ alerts, onClose }: AlertContainerProps) {
  if (alerts.length === 0) return null

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 max-w-md w-full">
      {alerts.map((alert, index) => (
        <Alert
          key={index}
          alert={alert}
          onClose={() => onClose(index)}
        />
      ))}
    </div>
  )
}
