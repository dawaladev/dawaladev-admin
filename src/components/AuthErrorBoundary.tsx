'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { handleAuthError, clearAuthSession } from '@/lib/auth-utils'

interface AuthErrorBoundaryProps {
  children: React.ReactNode
}

export function AuthErrorBoundary({ children }: AuthErrorBoundaryProps) {
  const [hasError, setHasError] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const router = useRouter()

  useEffect(() => {
    const supabase = createClient()

    // Listen for auth errors
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_OUT' && !session) {
          // User was signed out, redirect to login if on protected route
          if (window.location.pathname.startsWith('/dashboard')) {
            router.push('/auth/login?message=Session expired. Please login again.')
          }
        }
      }
    )

    // Global error handler for unhandled auth errors
    const handleGlobalError = (event: ErrorEvent) => {
      if (event.error?.message?.includes('Invalid Refresh Token') ||
          event.error?.message?.includes('Refresh Token Not Found')) {
        setHasError(true)
        setErrorMessage('Session expired. Please login again.')
        
        // Clear the session and redirect
        clearAuthSession().then(() => {
          router.push('/auth/login?message=Session expired. Please login again.')
        })
      }
    }

    window.addEventListener('error', handleGlobalError)

    return () => {
      subscription.unsubscribe()
      window.removeEventListener('error', handleGlobalError)
    }
  }, [router])

  if (hasError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="text-red-600 text-6xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Authentication Error</h1>
          <p className="text-gray-600 mb-6">{errorMessage}</p>
          <button
            onClick={() => {
              setHasError(false)
              setErrorMessage('')
              router.push('/auth/login')
            }}
            className="bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-lg transition-colors cursor-pointer"
          >
            Back to Login
          </button>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
