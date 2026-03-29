/**
 * Secure Fetch Wrapper with CSRF Protection
 * Automatically handles CSRF tokens for all state-changing requests
 */

import Cookies from 'js-cookie'

// API base URL
const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:4000'

/**
 * Get CSRF token from cookie
 */
const getCsrfToken = (): string | undefined => {
  return Cookies.get('XSRF-TOKEN')
}

/**
 * Refresh CSRF token from server
 */
const refreshCsrfToken = async (): Promise<string> => {
  try {
    const response = await fetch(`${API_BASE}/api/csrf-token`, {
      method: 'GET',
      credentials: 'include' // Important for cookies
    })
    
    if (!response.ok) {
      throw new Error('Failed to refresh CSRF token')
    }
    
    const data = await response.json()
    return data.csrfToken
  } catch (error) {
    console.error('CSRF token refresh failed:', error)
    throw error
  }
}

/**
 * Enhanced fetch with automatic CSRF protection
 */
export const secureFetch = async (
  url: string,
  options: RequestInit = {}
): Promise<Response> => {
  // Default options
  const defaultOptions: RequestInit = {
    credentials: 'include', // Important for cookies
    headers: {
      // Only set Content-Type if not FormData (FormData needs boundary)
      ...(options.body instanceof FormData ? {} : { 'Content-Type': 'application/json' }),
      ...options.headers
    }
  }

  // Merge with provided options
  const mergedOptions = { ...defaultOptions, ...options }

  // Add CSRF token for state-changing methods
  const method = (options.method || 'GET').toUpperCase()
  if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(method)) {
    let csrfToken = getCsrfToken()
    
    // If no CSRF token, try to get one
    if (!csrfToken) {
      try {
        csrfToken = await refreshCsrfToken()
      } catch (error) {
        console.error('Unable to get CSRF token:', error)
        throw new Error('CSRF protection failed')
      }
    }

    // Add CSRF token to headers
    mergedOptions.headers = {
      ...mergedOptions.headers,
      'X-XSRF-Token': csrfToken
    } as HeadersInit
  }

  try {
    const response = await fetch(`${API_BASE}${url}`, mergedOptions)
    
    // Handle CSRF token expiration (403 errors)
    if (response.status === 403) {
      const errorData = await response.json().catch(() => ({} as Record<string, unknown>))
      
      if (typeof errorData.error === 'string' && errorData.error.includes('CSRF')) {
        console.warn('CSRF token expired, refreshing and retrying...')
        
        // Refresh token and retry once
        try {
          const newToken = await refreshCsrfToken()
          const retryOptions: RequestInit = {
            ...mergedOptions,
            headers: {
              ...mergedOptions.headers,
              'X-XSRF-Token': newToken
            } as HeadersInit
          }
          
          return await fetch(`${API_BASE}${url}`, retryOptions)
        } catch (retryError) {
          console.error('Retry with new CSRF token failed:', retryError)
          throw new Error('CSRF protection failed after retry')
        }
      }
    }
    
    return response
  } catch (error) {
    console.error('Secure fetch error:', error)
    throw error
  }
}

/**
 * Convenience methods for common HTTP operations
 */
export const secureApi = {
  get: (url: string, options?: RequestInit) => 
    secureFetch(url, { ...options, method: 'GET' }),
    
  post: (url: string, data?: any, options?: RequestInit) => 
    secureFetch(url, {
      ...options,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(options?.headers || {})
      },
      body: data ? JSON.stringify(data) : undefined
    }),
    
  put: (url: string, data?: any, options?: RequestInit) => 
    secureFetch(url, {
      ...options,
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined
    }),
    
  delete: (url: string, options?: RequestInit) => 
    secureFetch(url, { ...options, method: 'DELETE' }),
    
  patch: (url: string, data?: any, options?: RequestInit) => 
    secureFetch(url, {
      ...options,
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined
    })
}

/**
 * Initialize CSRF token on app startup
 */
export const initializeCsrfProtection = async (): Promise<void> => {
  try {
    // Try to get existing token first
    let csrfToken = getCsrfToken()
    
    if (!csrfToken) {
      // If no token exists, get one from server
      await refreshCsrfToken()
      console.log('CSRF protection initialized')
    } else {
      console.log('CSRF token already exists')
    }
  } catch (error) {
    console.error('Failed to initialize CSRF protection:', error)
    // Don't throw here - allow app to continue, but log the error
  }
}

export default secureApi
