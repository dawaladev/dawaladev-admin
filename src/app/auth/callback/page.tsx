'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { handleAuthError, clearAuthSession } from '@/lib/auth-utils'

export default function CallbackPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const code = searchParams.get('code')
        const next = searchParams.get('next') ?? '/dashboard'

        console.log('Client callback:', { 
          code: code?.substring(0, 10) + '...', 
          next 
        })

        if (!code) {
          setError('No authorization code provided')
          return
        }

        const supabase = createClient()
        
        // For OAuth flows, we need to get the user from the session
        // The code parameter is used by Supabase internally for OAuth
        const { data: { user }, error: userError } = await supabase.auth.getUser()
        
        if (userError) {
          console.error('Error getting user:', userError)
          const authError = await handleAuthError(userError)
          setError(authError.message)
          
          // If it's a refresh token error, clear the session
          if (authError.code === 'INVALID_REFRESH_TOKEN' || authError.code === 'REFRESH_TOKEN_NOT_FOUND') {
            await clearAuthSession()
          }
          return
        }

        if (!user) {
          setError('No user found in session')
          return
        }

        console.log('User authenticated:', user.email)

        // Check if user is already approved
        try {
          const checkResponse = await fetch('/api/auth/check-approval', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
          })

          if (checkResponse.ok) {
            const { isApproved, role } = await checkResponse.json()
            
            if (isApproved) {
              // User is approved, redirect to dashboard
              console.log('User is approved, redirecting to dashboard')
              router.push('/dashboard')
              return
            } else {
              // User is not approved, check if they exist in pending
              const pendingResponse = await fetch('/api/auth/check-user-exists', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email: user.email }),
              })

              if (pendingResponse.ok) {
                const { exists, isPending } = await pendingResponse.json()
                
                if (exists && isPending) {
                  // User exists in pending, redirect to login with message
                  console.log('User exists in pending, redirecting to login')
                  router.push(`/auth/login?message=Akun Anda masih menunggu persetujuan Super Admin.`)
                  return
                }
              }
            }
          }
        } catch (checkError) {
          console.error('Error checking approval status:', checkError)
        }

        // Create pending user via API (only if not already approved)
        try {
          const response = await fetch('/api/auth/create-pending-user', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              email: user.email,
              name: user.user_metadata?.name || user.email!.split('@')[0],
              authProvider: user.app_metadata?.provider || 'email',
            }),
          })

          if (response.ok) {
            console.log('Pending user created successfully')
            router.push(`/auth/login?message=Registration successful! Please wait for Super Admin approval.`)
          } else {
            console.error('Failed to create pending user')
            router.push(`/auth/login?message=Registration successful! Please wait for Super Admin approval.`)
          }
        } catch (apiError) {
          console.error('API error:', apiError)
          router.push(`/auth/login?message=Registration successful! Please wait for Super Admin approval.`)
        }

      } catch (error) {
        console.error('Callback error:', error)
        setError('An unexpected error occurred')
      } finally {
        setIsLoading(false)
      }
    }

    handleCallback()
  }, [searchParams, router])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Processing authentication...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="text-red-600 text-6xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Authentication Error</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => router.push('/auth/login')}
            className="bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-lg transition-colors cursor-pointer"
          >
            Back to Login
          </button>
        </div>
      </div>
    )
  }

  return null
} 