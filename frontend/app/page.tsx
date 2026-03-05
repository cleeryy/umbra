'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Wifi, Users, Plus, Trash2, Eye, RotateCcw } from 'lucide-react'

interface Client {
  name: string
  config_file: string
}

interface Status {
  vpn_status: string
  details: string
}

export default function Home() {
  const [status, setStatus] = useState<Status | null>(null)
  const [clients, setClients] = useState<Client[]>([])
  const [newClientName, setNewClientName] = useState('')
  const [isCreating, setIsCreating] = useState(false)
  const [alert, setAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api'

  const fetchStatus = async () => {
    try {
      const response = await fetch(`${API_BASE}/status`)
      const data = await response.json()
      setStatus(data)
    } catch (error) {
      console.error('Failed to fetch status:', error)
    }
  }

  const fetchClients = async () => {
    try {
      const response = await fetch(`${API_BASE}/clients`)
      const data = await response.json()
      setClients(data.clients || [])
    } catch (error) {
      console.error('Failed to fetch clients:', error)
    }
  }

  const restartService = async () => {
    try {
      const response = await fetch(`${API_BASE}/restart`, { method: 'POST' })
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
      const response = await fetch(`${API_BASE}/clients`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newClientName })
      })
      const data = await response.json()
      
      if (response.ok) {
        setAlert({ type: 'success', message: data.message })
        setNewClientName('')
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
      const response = await fetch(`${API_BASE}/clients/${name}`, { method: 'DELETE' })
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
      const response = await fetch(`${API_BASE}/clients/${name}`)
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
  }, [])

  useEffect(() => {
    if (alert) {
      const timer = setTimeout(() => setAlert(null), 5000)
      return () => clearTimeout(timer)
    }
  }, [alert])

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">PiVPN Web Manager</h1>
          <p className="text-muted-foreground">Manage your VPN configurations through a web interface</p>
        </div>

        {/* Alert */}
        {alert && (
          <Alert variant={alert.type === 'error' ? 'destructive' : 'default'}>
            <AlertDescription>{alert.message}</AlertDescription>
          </Alert>
        )}

        {/* Status Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xl font-semibold">VPN Status</CardTitle>
            <Wifi className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <Badge variant={status?.vpn_status === 'running' ? 'default' : 'destructive'}>
                  {status?.vpn_status || 'Loading...'}
                </Badge>
                <p className="text-sm text-muted-foreground mt-1">WireGuard Service</p>
              </div>
              <Button onClick={restartService} variant="outline" size="sm">
                <RotateCcw className="h-4 w-4 mr-2" />
                Restart
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Clients Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div>
              <CardTitle className="text-xl font-semibold">Clients</CardTitle>
              <CardDescription>Manage your VPN clients</CardDescription>
            </div>
            <Dialog>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  New Client
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Client</DialogTitle>
                  <DialogDescription>
                    Enter a name for your new VPN client configuration.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Client Name</Label>
                    <Input
                      id="name"
                      placeholder="e.g., phone, laptop"
                      value={newClientName}
                      onChange={(e) => setNewClientName(e.target.value)}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button onClick={createClient} disabled={isCreating || !newClientName.trim()}>
                    {isCreating ? 'Creating...' : 'Create Client'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </CardHeader>
          <CardContent>
            {clients.length === 0 ? (
              <div className="text-center py-8">
                <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No clients configured</p>
              </div>
            ) : (
              <div className="grid gap-4">
                {clients.map((client) => (
                  <div key={client.name} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <h3 className="font-medium">{client.name}</h3>
                      <p className="text-sm text-muted-foreground">{client.config_file}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => viewConfig(client.name)}>
                        <Eye className="h-4 w-4 mr-2" />
                        View
                      </Button>
                      <Button variant="destructive" size="sm" onClick={() => deleteClient(client.name)}>
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}