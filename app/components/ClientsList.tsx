'use client'

import { Users, Plus, Trash2, Eye, QrCode, Download } from 'lucide-react'
import { Client } from '@/app/types'
import LoadingSpinner from './ui/LoadingSpinner'

interface ClientsListProps {
  clients: Client[]
  loading: boolean
  onCreateClick: () => void
  onView: (name: string) => void
  onDelete: (name: string) => void
  onQR: (name: string) => void
  deleting: string | null
}

export default function ClientsList({
  clients,
  loading,
  onCreateClick,
  onView,
  onDelete,
  onQR,
  deleting,
}: ClientsListProps) {
  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-center py-12">
          <LoadingSpinner size="lg" />
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-2">
          <h2 className="text-lg font-semibold text-gray-900">Clients</h2>
          <span className="bg-gray-100 text-gray-600 text-xs font-medium px-2 py-1 rounded-full">
            {clients.length}
          </span>
        </div>
        <button
          onClick={onCreateClick}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 active:bg-blue-800 transition-colors"
        >
          <Plus className="h-4 w-4" />
          <span>New Client</span>
        </button>
      </div>

      {clients.length === 0 ? (
        <div className="text-center py-12">
          <div className="bg-gray-50 rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
            <Users className="h-8 w-8 text-gray-400" />
          </div>
          <p className="text-gray-500 font-medium">No clients configured</p>
          <p className="text-gray-400 text-sm mt-1">Create your first VPN client</p>
        </div>
      ) : (
        <div className="space-y-3">
          {clients.map((client) => (
            <div
              key={client.name}
              className="flex items-center justify-between p-4 border border-gray-100 rounded-lg hover:border-gray-200 hover:shadow-sm transition-all group"
            >
              <div className="flex-1 min-w-0">
                <h3 className="font-medium text-gray-900 truncate">{client.name}</h3>
                <p className="text-xs text-gray-500 mt-0.5 truncate">{client.config_file}</p>
                {client.created_at && (
                  <p className="text-xs text-gray-400 mt-0.5">
                    Created {new Date(client.created_at).toLocaleDateString()}
                  </p>
                )}
              </div>
              <div className="flex items-center space-x-1 ml-4">
                <button
                  onClick={() => onQR(client.name)}
                  className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  title="View QR Code"
                >
                  <QrCode className="h-4 w-4" />
                </button>
                <button
                  onClick={() => onView(client.name)}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                  title="View Config"
                >
                  <Eye className="h-4 w-4" />
                </button>
                <button
                  onClick={() => onDelete(client.name)}
                  disabled={deleting === client.name}
                  className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                  title="Delete Client"
                >
                  {deleting === client.name ? (
                    <LoadingSpinner size="sm" />
                  ) : (
                    <Trash2 className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
