import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { useAuth } from '../context/AuthContext'
import { sanitizeError } from '../utils/sanitize'

const Login = () => {
  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  
  const navigate = useNavigate()
  const { login } = useAuth()

  const validateInput = () => {
    if (!identifier.trim()) {
      setError('Username or email is required')
      return false
    }
    
    if (identifier.trim().length < 3) {
      setError('Username or email must be at least 3 characters long')
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
    
    // Check for potentially dangerous characters
    const dangerousChars = /[<>"'&]/
    if (dangerousChars.test(identifier)) {
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

    const result = await login(identifier.trim(), password)
    
    if (result.success) {
      // Redirect based on user role
      const user = JSON.parse(localStorage.getItem('user') || '{}')
      if (user.role === 'ADMIN') {
        navigate('/admin')
      } else {
        navigate('/products')
      }
    } else {
      setError(result.error || 'Login failed')
    }
    
    setIsLoading(false)
  }

  return (
    <main className="min-h-screen flex justify-center anonymous-pro ">
      <div className="w-full max-w-md space-y-8">
        <div>
          <h2 className="text-center text-3xl font-bold tracking-tight text-gray-900">
            Sign In
          </h2>
        </div>
        <form className="space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md text-sm">
              {sanitizeError(error)}
            </div>
          )}
          
          <div>
            <label htmlFor="identifier" className="block text-sm font-medium text-gray-700">
              Username or Email
            </label>
            <div className="mt-1">
              <input
                id="identifier"
                name="identifier"
                type="text"
                autoComplete="username email"
                required
                value={identifier}
                onChange={(e) => {
                  // Remove potentially dangerous characters
                  const sanitized = e.target.value.replace(/[<>"'&]/g, '')
                  setIdentifier(sanitized)
                }}
                className="block w-full appearance-none rounded-md border border-gray-300 px-3 py-2 placeholder-gray-400 shadow-sm focus:border-black focus:outline-none focus:ring-black sm:text-sm"
                placeholder="Enter your username or email"
                maxLength={100}
                minLength={3}
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
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => {
                  // Remove potentially dangerous characters
                  const sanitized = e.target.value.replace(/[<>"'&]/g, '')
                  setPassword(sanitized)
                }}
                className="block w-full appearance-none rounded-md border border-gray-300 px-3 py-2 placeholder-gray-400 shadow-sm focus:border-black focus:outline-none focus:ring-black sm:text-sm"
                placeholder="Enter your password"
                maxLength={50}
              />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <input
                id="remember-me"
                name="remember-me"
                type="checkbox"
                className="h-4 w-4 rounded border-gray-300 text-black focus:ring-black"
              />
              <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-900">
                Remember me
              </label>
            </div>

            <div className="text-sm">
              <Link
                to="/reset"
                className="font-medium text-black hover:text-gray-700"
              >
                Forgot your password?
              </Link>
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="flex w-full justify-center rounded-md border border-transparent bg-black px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Signing in...' : 'Sign in'}
            </button>
          </div>

          <div className="text-center text-sm text-gray-600">
            Don't have an account?{' '}
            <Link
              to="/register"
              className="font-medium text-black hover:text-gray-700"
            >
              Sign up
            </Link>
          </div>
        </form>
      </div>
    </main>
  )
}

export default Login