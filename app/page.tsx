'use client'

import { useState, useEffect } from 'react'
import LoginForm from './components/LoginForm'
import Dashboard from './components/Dashboard'

export default function Home() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [token, setToken] = useState<string | null>(null)

  // Check for existing token on mount
  useEffect(() => {
    const savedToken = localStorage.getItem('umbra_token')
    if (savedToken) {
      setToken(savedToken)
      setIsAuthenticated(true)
    }
  }, [])

  const handleLogin = (newToken: string) => {
    setToken(newToken)
    setIsAuthenticated(true)
    localStorage.setItem('umbra_token', newToken)
  }

  const handleLogout = () => {
    setToken(null)
    setIsAuthenticated(false)
    localStorage.removeItem('umbra_token')
  }

  if (!isAuthenticated) {
    return <LoginForm onLogin={handleLogin} />
  }

  return <Dashboard token={token!} onLogout={handleLogout} />
}