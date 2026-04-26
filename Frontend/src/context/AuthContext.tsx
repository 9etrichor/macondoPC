import React, { createContext, useContext, useState, useEffect } from 'react'
import type { ReactNode } from 'react'
import { secureApi, initializeCsrfProtection } from '../utils/secureFetch'

interface User {
  uid: number
  username: string
  email: string
  role: string
}

interface AuthContextType {
  user: User | null
  token: string | null
  login: (identifier: string, password: string) => Promise<{ success: boolean; error?: string }>
  register: (username: string, email: string, password: string) => Promise<{ success: boolean; error?: string }>
  logout: () => void
  resetPassword: (currentPassword: string, newPassword: string) => Promise<{ success: boolean; error?: string; message?: string }>
  isLoading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

interface AuthProviderProps {
  children: ReactNode
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const initializeAuth = async () => {
      // Initialize CSRF protection first
      await initializeCsrfProtection()
      
      const storedToken = localStorage.getItem('token')
      const storedUser = localStorage.getItem('user')
      
      if (storedToken && storedUser) {
        setToken(storedToken)
        setUser(JSON.parse(storedUser))
      }
      setIsLoading(false)
    }
    
    initializeAuth()
  }, [])

  const login = async (identifier: string, password: string) => {
    try {
      const response = await secureApi.post('/api/auth/login', { identifier, password })
      const data = await response.json() as { user: any; token: string; error?: string }

      if (response.ok) {
        setUser(data.user)
        setToken(data.token)
        localStorage.setItem('token', data.token)
        localStorage.setItem('user', JSON.stringify(data.user))
        return { success: true }
      } else {
        return { success: false, error: data.error || 'Login failed' }
      }
    } catch (error) {
      return { success: false, error: 'Network error' }
    }
  }

  const register = async (username: string, email: string, password: string) => {
    try {
      const response = await secureApi.post('/api/auth/register', { username, email, password })
      const data = await response.json() as { user: any; token: string; error?: string }

      if (response.ok) {
        setUser(data.user)
        setToken(data.token)
        localStorage.setItem('token', data.token)
        localStorage.setItem('user', JSON.stringify(data.user))
        return { success: true }
      } else {
        return { success: false, error: data.error || 'Registration failed' }
      }
    } catch (error) {
      return { success: false, error: 'Network error' }
    }
  }

  const logout = () => {
    setUser(null)
    setToken(null)
    localStorage.removeItem('token')
    localStorage.removeItem('user')
  }

  const resetPassword = async (currentPassword: string, newPassword: string) => {
    try {
      const response = await secureApi.post('/api/auth/reset-password', { currentPassword, newPassword }, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      const data = await response.json() as { message?: string; error?: string }

      if (response.ok) {
        // Logout user after password change
        logout()
        return { success: true, message: data.message }
      } else {
        return { success: false, error: data.error || 'Password reset failed' }
      }
    } catch (error) {
      return { success: false, error: 'Network error' }
    }
  }

  return (
    <AuthContext.Provider value={{ user, token, login, register, logout, resetPassword, isLoading }}>
      {children}
    </AuthContext.Provider>
  )
}
