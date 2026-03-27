import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { useAuth } from '../context/AuthContext'
import { sanitizeError } from '../utils/sanitize'

const Register = () => {
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  
  const navigate = useNavigate()
  const { register } = useAuth()

  const validateInput = () => {
    if (!username.trim()) {
      setError('Username is required')
      return false
    }
    
    if (username.trim().length < 3) {
      setError('Username must be at least 3 characters long')
      return false
    }
    
    if (username.trim().length > 30) {
      setError('Username must be less than 30 characters long')
      return false
    }
    
    if (!/^[a-zA-Z0-9_]+$/.test(username.trim())) {
      setError('Username can only contain letters, numbers, and underscores')
      return false
    }
    
    if (!email.trim()) {
      setError('Email is required')
      return false
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email.trim())) {
      setError('Please enter a valid email address')
      return false
    }
    
    if (!password) {
      setError('Password is required')
      return false
    }
    
    if (password.length < 6) {
      setError('Password must be at least 6 characters long')
      return false
    }
    
    if (password.length > 50) {
      setError('Password must be less than 50 characters long')
      return false
    }
    
    if (!confirmPassword) {
      setError('Please confirm your password')
      return false
    }
    
    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return false
    }
    
    // Check for potentially dangerous characters
    const dangerousChars = /[<>"'&]/
    if (dangerousChars.test(username) || dangerousChars.test(email)) {
      setError('Username or email contains invalid characters')
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

    const result = await register(username.trim(), email.trim(), password)
    
    if (result.success) {
      // Redirect based on user role
      const user = JSON.parse(localStorage.getItem('user') || '{}')
      if (user.role === 'ADMIN') {
        navigate('/admin')
      } else {
        navigate('/products')
      }
    } else {
      setError(result.error || 'Registration failed')
    }
    
    setIsLoading(false)
  }

  return (
    <main className="min-h-screen flex justify-center ">
      <div className="w-full max-w-md space-y-8">
        <div>
          <h2 className="text-center text-3xl font-bold tracking-tight text-gray-900">
            Sign Up
          </h2>
        </div>
        <form className="space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md text-sm">
              {sanitizeError(error)}
            </div>
          )}
          
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-gray-700">
              Username
            </label>
            <div className="mt-1">
              <input
                id="username"
                name="username"
                type="text"
                autoComplete="username"
                required
                value={username}
                onChange={(e) => {
                  // Only allow alphanumeric and underscore
                  const sanitized = e.target.value.replace(/[^a-zA-Z0-9_]/g, '')
                  setUsername(sanitized)
                }}
                className="block w-full appearance-none rounded-md border border-gray-300 px-3 py-2 placeholder-gray-400 shadow-sm focus:border-black focus:outline-none focus:ring-black sm:text-sm"
                placeholder="Choose a username"
                maxLength={30}
                minLength={3}
              />
            </div>
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              Email address
            </label>
            <div className="mt-1">
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => {
                  // Remove potentially dangerous characters
                  const sanitized = e.target.value.replace(/[<>"'&]/g, '')
                  setEmail(sanitized)
                }}
                className="block w-full appearance-none rounded-md border border-gray-300 px-3 py-2 placeholder-gray-400 shadow-sm focus:border-black focus:outline-none focus:ring-black sm:text-sm"
                placeholder="Enter your email"
                maxLength={100}
              />
            </div>
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
              Password
            </label>
            <div className="mt-1">
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                required
                value={password}
                onChange={(e) => {
                  // Remove potentially dangerous characters
                  const sanitized = e.target.value.replace(/[<>"'&]/g, '')
                  setPassword(sanitized)
                }}
                className="block w-full appearance-none rounded-md border border-gray-300 px-3 py-2 placeholder-gray-400 shadow-sm focus:border-black focus:outline-none focus:ring-black sm:text-sm"
                placeholder="Create a password"
                maxLength={50}
                minLength={6}
              />
            </div>
          </div>

          <div>
            <label htmlFor="confirm-password" className="block text-sm font-medium text-gray-700">
              Confirm Password
            </label>
            <div className="mt-1">
              <input
                id="confirm-password"
                name="confirm-password"
                type="password"
                autoComplete="new-password"
                required
                value={confirmPassword}
                onChange={(e) => {
                  // Remove potentially dangerous characters
                  const sanitized = e.target.value.replace(/[<>"'&]/g, '')
                  setConfirmPassword(sanitized)
                }}
                className="block w-full appearance-none rounded-md border border-gray-300 px-3 py-2 placeholder-gray-400 shadow-sm focus:border-black focus:outline-none focus:ring-black sm:text-sm"
                placeholder="Confirm your password"
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
              {isLoading ? 'Creating account...' : 'Sign up'}
            </button>
          </div>

          <div className="text-center text-sm text-gray-600">
            Already have an account?{' '}
            <Link
              to="/login"
              className="font-medium text-black hover:text-gray-700"
            >
              Sign in
            </Link>
          </div>
        </form>
      </div>
    </main>
  )
}

export default Register