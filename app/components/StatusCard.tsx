'use client'

import { Wifi, RotateCcw } from 'lucide-react'
import { Status } from '@/app/types'
import LoadingSpinner from './ui/LoadingSpinner'

interface StatusCardProps {
  status: Status | null
  loading: boolean
  onRestart: () => void
  restarting: boolean
}

export default function StatusCard({ status, loading, onRestart, restarting }: StatusCardProps) {
  const isRunning = status?.vpn_status === 'running'

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-gray-900">VPN Status</h2>
        {loading ? (
          <LoadingSpinner size="sm" />
        ) : (
          <Wifi className={`h-5 w-5 ${isRunning ? 'text-green-500' : 'text-red-500'}`} />
        )}
      </div>
      
      <div className="space-y-4">
        <div className="flex items-center justify-between py-2 border-b border-gray-100">
          <span className="text-sm text-gray-600">Service Status</span>
          <span className={`px-3 py-1 text-xs font-medium rounded-full ${
            isRunning
              ? 'bg-green-100 text-green-800'
              : 'bg-red-100 text-red-800'
          }`}>
            {status?.vpn_status || 'Unknown'}
          </span>
        </div>
        
        <div className="flex items-center justify-between py-2 border-b border-gray-100">
          <span className="text-sm text-gray-600">Connected Clients</span>
          <span className="text-sm font-medium text-gray-900">
            {status?.clients_count || 0}
          </span>
        </div>

        <button
          onClick={onRestart}
          disabled={restarting || loading}
          className="w-full flex items-center justify-center px-4 py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 hover:border-gray-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {restarting ? (
            <>
              <LoadingSpinner size="sm" className="mr-2" />
              <span>Restarting...</span>
            </>
          ) : (
            <>
              <RotateCcw className="h-4 w-4 mr-2" />
              <span>Restart Service</span>
            </>
          )}
        </button>
      </div>
    </div>
  )
}
