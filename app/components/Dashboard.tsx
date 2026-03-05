'use client'

import { useState, useEffect } from 'react'
import { Wifi, Users, Plus, Trash2, Eye, RotateCcw, LogOut } from 'lucide-react'

interface Client {
  name: string
  config_file: string
  created_at?: string
}

interface Status {
  vpn_status: string
  details: string
  clients_count: number
}

interface DashboardProps {
  token: string
  onLogout: () => void
}

export default function Dashboard({ token, onLogout }: DashboardProps) {
  const [status, setStatus] = useState<Status | null>(null)
  const [clients, setClients] = useState<Client[]>([])
  const [newClientName, setNewClientName] = useState('')
  const [isCreating, setIsCreating] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [alert, setAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  const API_BASE = process.env.NEXT_PUBLIC_API_URL || '/api'

  const apiCall = async (url: string, options: RequestInit = {}) => {
    const response = await fetch(`${API_BASE}${url}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        ...options.headers,
      },
    })
    return response
  }

  const fetchStatus = async () => {
    try {
      const response = await apiCall('/status')
      if (response.status === 401) {
        onLogout()
        return
      }
      const data = await response.json()
      setStatus(data)
    } catch (error) {
      console.error('Failed to fetch status:', error)
    }
  }

  const fetchClients = async () => {
    try {
      const response = await apiCall('/clients')
      if (response.status === 401) {
        onLogout()
        return
      }
      const data = await response.json()
      setClients(data.clients || [])
    } catch (error) {
      console.error('Failed to fetch clients:', error)
    }
  }

  const restartService = async () => {
    try {
      const response = await apiCall('/restart', { method: 'POST' })
      const data = await response.json()
      if (response.ok) {
        setAlert({ type: 'success', message: data.message })
        fetchStatus()
      } else {
        setAlert({ type: 'error', message: data.error })
      }
    } catch (error) {
      setAlert({ type: 'error', message: 'Failed to restart service' })
    }
  }

  const createClient = async () => {
    if (!newClientName.trim()) return

    setIsCreating(true)
    try {
      const response = await apiCall('/clients', {
        method: 'POST',
        body: JSON.stringify({ name: newClientName })
      })
      
      const data = await response.json()
      
      if (response.ok) {
        setAlert({ type: 'success', message: data.message })
        setNewClientName('')
        setIsModalOpen(false)
        fetchClients()
      } else {
        setAlert({ type: 'error', message: data.error })
      }
    } catch (error) {
      setAlert({ type: 'error', message: 'Failed to create client' })
    } finally {
      setIsCreating(false)
    }
  }

  const deleteClient = async (name: string) => {
    if (!confirm(`Are you sure you want to delete client "${name}"?`)) return

    try {
      const response = await apiCall(`/clients/${name}`, { method: 'DELETE' })
      const data = await response.json()
      
      if (response.ok) {
        setAlert({ type: 'success', message: data.message })
        fetchClients()
      } else {
        setAlert({ type: 'error', message: data.error })
      }
    } catch (error) {
      setAlert({ type: 'error', message: 'Failed to delete client' })
    }
  }

  const viewConfig = async (name: string) => {
    try {
      const response = await apiCall(`/clients/${name}`)
      const data = await response.json()
      
      if (response.ok) {
        window.alert(`Configuration for ${name}:\n\n${data.config}`)
      } else {
        setAlert({ type: 'error', message: data.error })
      }
    } catch (error) {
      setAlert({ type: 'error', message: 'Failed to load config' })
    }
  }

  useEffect(() => {
    fetchStatus()
    fetchClients()
    
    const interval = setInterval(() => {
      fetchStatus()
    }, 10000)

    return () => clearInterval(interval)
  }, [token])

  useEffect(() => {
    if (alert) {
      const timer = setTimeout(() => setAlert(null), 5000)
      return () => clearTimeout(timer)
    }
  }, [alert])

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-3">
              <Wifi className="h-8 w-8 text-blue-600" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Umbra PiVPN</h1>
                <p className="text-sm text-gray-600">Secure VPN Management</p>
              </div>
            </div>
            <button
              onClick={onLogout}
              className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900"
            >
              <LogOut className="h-4 w-4" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </header>

      {/* Alert */}
      {alert && (
        <div className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-4 ${
          alert.type === 'error' ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200'
        } border rounded-lg`}>
          <div className="p-4">
            <p className={`text-sm ${
              alert.type === 'error' ? 'text-red-600' : 'text-green-600'
            }`}>
              {alert.message}
            </p>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid gap-8 lg:grid-cols-2">
          {/* Status Card */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">VPN Status</h2>
              <Wifi className={`h-5 w-5 ${
                status?.vpn_status === 'running' ? 'text-green-500' : 'text-red-500'
              }`} />
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Status</span>
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                  status?.vpn_status === 'running' 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-red-100 text-red-800'
                }`}>
                  {status?.vpn_status || 'Loading...'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Clients</span>
                <span className="text-sm font-medium">{status?.clients_count || 0}</span>
              </div>
              <button
                onClick={restartService}
                className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                Restart Service
              </button>
            </div>
          </div>

          {/* Clients Card */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Clients</h2>
              <button
                onClick={() => setIsModalOpen(true)}
                className="flex items-center space-x-2 px-3 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700"
              >
                <Plus className="h-4 w-4" />
                <span>New Client</span>
              </button>
            </div>
            
            {clients.length === 0 ? (
              <div className="text-center py-8">
                <Users className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">No clients configured</p>
              </div>
            ) : (
              <div className="space-y-3">
                {clients.map((client) => (
                  <div key={client.name} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <h3 className="font-medium text-gray-900">{client.name}</h3>
                      <p className="text-sm text-gray-500">{client.config_file}</p>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => viewConfig(client.name)}
                        className="p-2 text-gray-400 hover:text-gray-600"
                        title="View Config"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => deleteClient(client.name)}
                        className="p-2 text-gray-400 hover:text-red-600"
                        title="Delete Client"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Create Client Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Create New Client</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Client Name
                </label>
                <input
                  type="text"
                  value={newClientName}
                  onChange={(e) => setNewClientName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., laptop, phone"
                />
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={createClient}
                  disabled={isCreating || !newClientName.trim()}
                  className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  {isCreating ? 'Creating...' : 'Create'}
                </button>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}