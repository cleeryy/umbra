'use client'

import { useState, useEffect, useCallback } from 'react'
import { Wifi, LogOut } from 'lucide-react'
import { Client, Status, Alert } from '@/app/types'
import { api } from '@/app/lib/api'
import StatusCard from './StatusCard'
import ClientsList from './ClientsList'
import CreateClientModal from './CreateClientModal'
import { AlertContainer } from './ui/Alert'

interface DashboardProps {
  onLogout: () => void
}

export default function Dashboard({ onLogout }: DashboardProps) {
  const [status, setStatus] = useState<Status | null>(null)
  const [clients, setClients] = useState<Client[]>([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [alerts, setAlerts] = useState<Alert[]>([])
  
  const [loading, setLoading] = useState({
    status: true,
    clients: true,
    restarting: false,
    creating: false,
    deleting: null as string | null,
  })

  const showAlert = useCallback((type: Alert['type'], message: string) => {
    setAlerts((prev) => [...prev, { type, message }])
    setTimeout(() => {
      setAlerts((prev) => prev.slice(1))
    }, 5000)
  }, [])

  const handleAuthError = useCallback(() => {
    showAlert('error', 'Session expired. Please login again.')
    setTimeout(onLogout, 1500)
  }, [onLogout, showAlert])

  const fetchStatus = useCallback(async () => {
    const result = await api.getStatus()
    if (result.error) {
      if (result.status === 401) {
        handleAuthError()
        return
      }
      showAlert('error', result.error)
    } else if (result.data) {
      setStatus(result.data)
    }
    setLoading((prev) => ({ ...prev, status: false }))
  }, [handleAuthError, showAlert])

  const fetchClients = useCallback(async () => {
    const result = await api.getClients()
    if (result.error) {
      if (result.status === 401) {
        handleAuthError()
        return
      }
      showAlert('error', result.error)
    } else if (result.data) {
      setClients(result.data)
    }
    setLoading((prev) => ({ ...prev, clients: false }))
  }, [handleAuthError, showAlert])

  const restartService = async () => {
    setLoading((prev) => ({ ...prev, restarting: true }))
    const result = await api.restartService()
    if (result.error) {
      showAlert('error', result.error)
    } else {
      showAlert('success', result.data?.message || 'Service restarted successfully')
      fetchStatus()
    }
    setLoading((prev) => ({ ...prev, restarting: false }))
  }

  const createClient = async (name: string) => {
    setLoading((prev) => ({ ...prev, creating: true }))
    const result = await api.createClient(name)
    if (result.error) {
      showAlert('error', result.error)
    } else {
      showAlert('success', result.data?.message || 'Client created successfully')
      setIsModalOpen(false)
      fetchClients()
    }
    setLoading((prev) => ({ ...prev, creating: false }))
  }

  const deleteClient = async (name: string) => {
    if (!confirm(`Are you sure you want to delete client "${name}"?`)) return
    
    setLoading((prev) => ({ ...prev, deleting: name }))
    const result = await api.deleteClient(name)
    if (result.error) {
      showAlert('error', result.error)
    } else {
      showAlert('success', result.data?.message || 'Client deleted successfully')
      fetchClients()
      fetchStatus()
    }
    setLoading((prev) => ({ ...prev, deleting: null }))
  }

  const viewConfig = async (name: string) => {
    const result = await api.getClientConfig(name)
    if (result.error) {
      showAlert('error', result.error)
    } else if (result.data) {
      const configWindow = window.open('', '_blank')
      if (configWindow) {
        configWindow.document.write(`
          <html>
            <head><title>WireGuard Config - ${name}</title></head>
            <body style="font-family: monospace; padding: 20px; white-space: pre-wrap; background: #f5f5f5;">
              <h2>Configuration for ${name}</h2>
              <pre style="background: white; padding: 20px; border-radius: 8px; border: 1px solid #ddd;">${result.data}</pre>
            </body>
          </html>
        `)
      }
    }
  }

  const viewQR = async (name: string) => {
    const result = await api.getQRCode(name)
    if (result.error) {
      showAlert('error', result.error)
    } else if (result.data) {
      alert(`QR Code data for ${name}:\n\n${result.data.substring(0, 200)}...`)
    }
  }

  useEffect(() => {
    fetchStatus()
    fetchClients()

    const interval = setInterval(fetchStatus, 30000)
    return () => clearInterval(interval)
  }, [fetchStatus, fetchClients])

  const handleLogout = () => {
    api.logout()
    onLogout()
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <AlertContainer alerts={alerts} onClose={(index) => setAlerts(alerts.filter((_, i) => i !== index))} />
      
      <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="bg-blue-600 p-2 rounded-lg">
                <Wifi className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Umbra PiVPN</h1>
                <p className="text-xs text-gray-500">Secure VPN Management</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <LogOut className="h-4 w-4" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid gap-6 lg:grid-cols-2">
          <StatusCard
            status={status}
            loading={loading.status}
            onRestart={restartService}
            restarting={loading.restarting}
          />
          <ClientsList
            clients={clients}
            loading={loading.clients}
            onCreateClick={() => setIsModalOpen(true)}
            onView={viewConfig}
            onDelete={deleteClient}
            onQR={viewQR}
            deleting={loading.deleting}
          />
        </div>
      </main>

      <CreateClientModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onCreate={createClient}
        isCreating={loading.creating}
      />
    </div>
  )
}
