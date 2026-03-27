import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { useAuth } from '../context/AuthContext'
import { sanitizeError } from '../utils/sanitize'

const Reset = () => {
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmNewPassword, setConfirmNewPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  
  const navigate = useNavigate()
  const { resetPassword } = useAuth()

  const validateInput = () => {
    if (!currentPassword) {
      setError('Current password is required')
      return false
    }
    
    if (currentPassword.length < 6) {
      setError('Current password must be at least 6 characters long')
      return false
    }
    
    if (!newPassword) {
      setError('New password is required')
      return false
    }
    
    if (newPassword.length < 6) {
      setError('New password must be at least 6 characters long')
      return false
    }
    
    if (newPassword.length > 50) {
      setError('New password must be less than 50 characters long')
      return false
    }
    
    if (!confirmNewPassword) {
      setError('Please confirm your new password')
      return false
    }
    
    if (newPassword !== confirmNewPassword) {
      setError('New passwords do not match')
      return false
    }
    
    if (currentPassword === newPassword) {
      setError('New password must be different from current password')
      return false
    }
    
    // Check for potentially dangerous characters
    const dangerousChars = /[<>"'&]/
    if (dangerousChars.test(currentPassword) || dangerousChars.test(newPassword)) {
      setError('Password contains invalid characters')
      return false
    }
    
    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!validateInput()) {
      return
    }

    setIsLoading(true)

    const result = await resetPassword(currentPassword, newPassword)
    
    if (result.success) {
      // User will be logged out automatically, redirect to login
      navigate('/login')
    } else {
      setError(result.error || 'Password reset failed')
    }
    
    setIsLoading(false)
  }

  return (
    <main className="min-h-screen flex justify-center">
      <div className="w-full max-w-md space-y-8">
        <div>
          <h2 className="text-center text-3xl font-bold tracking-tight text-gray-900">
            Reset Password
          </h2>
        </div>
        <form className="space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md text-sm">
              {sanitizeError(error)}
            </div>
          )}
          
          <div>
            <label htmlFor="current-password" className="block text-sm font-medium text-gray-700">
              Current Password
            </label>
            <div className="mt-1">
              <input
                id="current-password"
                name="current-password"
                type="password"
                autoComplete="current-password"
                required
                value={currentPassword}
                onChange={(e) => {
                  // Remove potentially dangerous characters
                  const sanitized = e.target.value.replace(/[<>"'&]/g, '')
                  setCurrentPassword(sanitized)
                }}
                className="block w-full appearance-none rounded-md border border-gray-300 px-3 py-2 placeholder-gray-400 shadow-sm focus:border-black focus:outline-none focus:ring-black sm:text-sm"
                placeholder="Enter your current password"
                maxLength={50}
              />
            </div>
          </div>

          <div>
            <label htmlFor="new-password" className="block text-sm font-medium text-gray-700">
              New Password
            </label>
            <div className="mt-1">
              <input
                id="new-password"
                name="new-password"
                type="password"
                autoComplete="new-password"
                required
                value={newPassword}
                onChange={(e) => {
                  // Remove potentially dangerous characters
                  const sanitized = e.target.value.replace(/[<>"'&]/g, '')
                  setNewPassword(sanitized)
                }}
                className="block w-full appearance-none rounded-md border border-gray-300 px-3 py-2 placeholder-gray-400 shadow-sm focus:border-black focus:outline-none focus:ring-black sm:text-sm"
                placeholder="Enter your new password"
                maxLength={50}
                minLength={6}
              />
            </div>
          </div>

          <div>
            <label htmlFor="confirm-new-password" className="block text-sm font-medium text-gray-700">
              Confirm New Password
            </label>
            <div className="mt-1">
              <input
                id="confirm-new-password"
                name="confirm-new-password"
                type="password"
                autoComplete="new-password"
                required
                value={confirmNewPassword}
                onChange={(e) => {
                  // Remove potentially dangerous characters
                  const sanitized = e.target.value.replace(/[<>"'&]/g, '')
                  setConfirmNewPassword(sanitized)
                }}
                className="block w-full appearance-none rounded-md border border-gray-300 px-3 py-2 placeholder-gray-400 shadow-sm focus:border-black focus:outline-none focus:ring-black sm:text-sm"
                placeholder="Confirm your new password"
                maxLength={50}
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="flex w-full justify-center rounded-md border border-transparent bg-black px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Resetting...' : 'Reset Password'}
            </button>
          </div>

          <div className="text-center text-sm text-gray-600">
            <Link
              to="/login"
              className="font-medium text-black hover:text-gray-700"
            >
              Back to Sign in
            </Link>
          </div>
        </form>
      </div>
    </main>
  )
}

export default Reset