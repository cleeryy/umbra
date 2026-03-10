'use client'

import { useState } from 'react'
import { X, User, AlertCircle } from 'lucide-react'
import LoadingSpinner from './ui/LoadingSpinner'

interface CreateClientModalProps {
  isOpen: boolean
  onClose: () => void
  onCreate: (name: string) => void
  isCreating: boolean
}

export default function CreateClientModal({
  isOpen,
  onClose,
  onCreate,
  isCreating,
}: CreateClientModalProps) {
  const [name, setName] = useState('')
  const [error, setError] = useState('')

  if (!isOpen) return null

  const validateName = (value: string): boolean => {
    if (!value.trim()) {
      setError('Client name is required')
      return false
    }
    if (value.length < 2) {
      setError('Client name must be at least 2 characters')
      return false
    }
    if (value.length > 50) {
      setError('Client name must be less than 50 characters')
      return false
    }
    if (!/^[a-zA-Z0-9_-]+$/.test(value)) {
      setError('Client name can only contain letters, numbers, hyphens, and underscores')
      return false
    }
    setError('')
    return true
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (validateName(name)) {
      onCreate(name.trim())
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setName(value)
    if (error) validateName(value)
  }

  const handleClose = () => {
    if (!isCreating) {
      setName('')
      setError('')
      onClose()
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
      <div
        className="bg-white rounded-xl shadow-2xl w-full max-w-md animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Create New Client</h3>
            <p className="text-sm text-gray-500 mt-1">Add a new VPN client configuration</p>
          </div>
          <button
            onClick={handleClose}
            disabled={isCreating}
            className="text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label htmlFor="clientName" className="block text-sm font-medium text-gray-700 mb-2">
              Client Name
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                id="clientName"
                type="text"
                value={name}
                onChange={handleChange}
                disabled={isCreating}
                placeholder="e.g., laptop, phone, tablet"
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:bg-gray-50 transition-all"
                autoFocus
              />
            </div>
            {error && (
              <div className="flex items-center mt-2 text-red-600 text-sm">
                <AlertCircle className="h-4 w-4 mr-1.5 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}
            <p className="mt-2 text-xs text-gray-500">
              Use only letters, numbers, hyphens, and underscores. Max 50 characters.
            </p>
          </div>

          <div className="flex space-x-3 pt-2">
            <button
              type="submit"
              disabled={isCreating || !name.trim()}
              className="flex-1 bg-blue-600 text-white py-2.5 px-4 rounded-lg font-medium hover:bg-blue-700 active:bg-blue-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
            >
              {isCreating ? (
                <>
                  <LoadingSpinner size="sm" className="mr-2" />
                  <span>Creating...</span>
                </>
              ) : (
                <span>Create Client</span>
              )}
            </button>
            <button
              type="button"
              onClick={handleClose}
              disabled={isCreating}
              className="flex-1 bg-gray-100 text-gray-700 py-2.5 px-4 rounded-lg font-medium hover:bg-gray-200 disabled:opacity-50 transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
