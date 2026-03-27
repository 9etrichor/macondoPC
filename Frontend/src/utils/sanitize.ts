/**
 * Output sanitization utilities for context-dependent escaping
 * Prevents XSS attacks by properly escaping data based on context
 */

/**
 * Sanitize text content for HTML context
 * Escapes HTML special characters to prevent XSS
 */
export const sanitizeText = (text: string | number | undefined | null): string => {
  if (text === undefined || text === null) {
    return ''
  }
  
  const str = String(text)
  
  // Escape HTML special characters
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;')
}

/**
 * Sanitize text for HTML attribute context
 * Escapes quotes and other dangerous characters
 */
export const sanitizeAttribute = (text: string | number | undefined | null): string => {
  if (text === undefined || text === null) {
    return ''
  }
  
  const str = String(text)
  
  // Escape characters dangerous in attributes
  return str
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\//g, '&#x2F;')
    .replace(/`/g, '&#x60;')
    .replace(/=/g, '&#x3D;')
}

/**
 * Sanitize text for URL context
 * Encodes URL components safely
 */
export const sanitizeUrl = (text: string | undefined | null): string => {
  if (text === undefined || text === null) {
    return ''
  }
  
  try {
    return encodeURIComponent(text)
  } catch {
    return ''
  }
}

/**
 * Sanitize text for JavaScript context
 * Escapes characters dangerous in JS strings
 */
export const sanitizeJS = (text: string | number | undefined | null): string => {
  if (text === undefined || text === null) {
    return ''
  }
  
  const str = String(text)
  
  // Escape characters dangerous in JavaScript strings
  return str
    .replace(/\\/g, '\\\\')
    .replace(/'/g, '\\\'')
    .replace(/"/g, '\\"')
    .replace(/`/g, '\\`')
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '\\r')
    .replace(/\t/g, '\\t')
    .replace(/\f/g, '\\f')
    .replace(/\v/g, '\\v')
    .replace(/\0/g, '\\0')
    .replace(/</g, '\\x3C')
    .replace(/>/g, '\\x3E')
    .replace(/&/g, '\\x26')
    .replace(/=/g, '\\x3D')
}

/**
 * Sanitize text for CSS context
 * Escapes characters dangerous in CSS
 */
export const sanitizeCSS = (text: string | undefined | null): string => {
  if (text === undefined || text === null) {
    return ''
  }
  
  const str = String(text)
  
  // Escape characters dangerous in CSS
  return str
    .replace(/&/g, '\\26')
    .replace(/</g, '\\3C')
    .replace(/>/g, '\\3E')
    .replace(/"/g, '\\22')
    .replace(/'/g, '\\27')
    .replace(/\//g, '\\2F')
    .replace(/`/g, '\\60')
    .replace(/=/g, '\\3D')
}

/**
 * Validate and sanitize email for display
 * Ensures email format is safe for display
 */
export const sanitizeEmail = (email: string | undefined | null): string => {
  if (email === undefined || email === null) {
    return ''
  }
  
  const str = String(email).trim()
  
  // Basic email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(str)) {
    return ''
  }
  
  return sanitizeText(str)
}

/**
 * Sanitize username for display
 * Allows only safe characters for usernames
 */
export const sanitizeUsername = (username: string | undefined | null): string => {
  if (username === undefined || username === null) {
    return ''
  }
  
  const str = String(username).trim()
  
  // Allow only alphanumeric, underscores, and hyphens
  const sanitized = str.replace(/[^a-zA-Z0-9_-]/g, '')
  
  return sanitizeText(sanitized)
}

/**
 * Sanitize product name for display
 * Allows safe characters for product names
 */
export const sanitizeProductName = (name: string | undefined | null): string => {
  if (name === undefined || name === null) {
    return ''
  }
  
  const str = String(name).trim()
  
  // Allow letters, numbers, spaces, and common punctuation
  const sanitized = str.replace(/[<>"'&]/g, '')
  
  return sanitizeText(sanitized)
}

/**
 * Sanitize description for display
 * Allows safe characters with basic formatting
 */
export const sanitizeDescription = (description: string | undefined | null): string => {
  if (description === undefined || description === null) {
    return ''
  }
  
  const str = String(description).trim()
  
  // Allow letters, numbers, spaces, and safe punctuation
  const sanitized = str.replace(/[<>"'&]/g, '')
  
  return sanitizeText(sanitized)
}

/**
 * Sanitize category name for display
 */
export const sanitizeCategoryName = (name: string | undefined | null): string => {
  if (name === undefined || name === null) {
    return ''
  }
  
  const str = String(name).trim()
  
  // Allow letters, numbers, spaces, and safe punctuation
  const sanitized = str.replace(/[<>"'&]/g, '')
  
  return sanitizeText(sanitized)
}

/**
 * Sanitize error messages for display
 * Prevents XSS in error messages
 */
export const sanitizeError = (error: string | undefined | null): string => {
  if (error === undefined || error === null) {
    return ''
  }
  
  return sanitizeText(String(error))
}

/**
 * Sanitize success messages for display
 */
export const sanitizeMessage = (message: string | undefined | null): string => {
  if (message === undefined || message === null) {
    return ''
  }
  
  return sanitizeText(String(message))
}
