'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { handleAuthError, clearAuthSession } from '@/lib/auth-utils'
import type { User, Session } from '@supabase/supabase-js'

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    let mounted = true

    // Get initial session
    const getInitialSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (error) {
          console.error('Error getting session:', error)
          const authError = await handleAuthError(error)
          setError(authError.message)
          
          // If it's a refresh token error, clear the session
          if (authError.code === 'INVALID_REFRESH_TOKEN' || authError.code === 'REFRESH_TOKEN_NOT_FOUND') {
            await clearAuthSession()
          }
        } else if (mounted) {
          setSession(session)
          setUser(session?.user ?? null)
        }
      } catch (error) {
        console.error('Unexpected error getting session:', error)
        if (mounted) {
          setError('Unexpected authentication error')
        }
      } finally {
        if (mounted) {
          setLoading(false)
        }
      }
    }

    getInitialSession()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return
        
        console.log('Auth state change:', event, session?.user?.email)
        
        if (event === 'SIGNED_OUT') {
          setSession(null)
          setUser(null)
          setError(null)
          // Redirect to login if user is on protected route
          if (window.location.pathname.startsWith('/dashboard')) {
            router.push('/auth/login?message=Session expired. Please login again.')
          }
        } else if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          setSession(session)
          setUser(session?.user ?? null)
          setError(null)
        }
      }
    )

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [router, supabase.auth])

  const signOut = async () => {
    try {
      setLoading(true)
      setError(null)
      const { error } = await supabase.auth.signOut()
      if (error) {
        const authError = await handleAuthError(error)
        setError(authError.message)
      }
      setUser(null)
      setSession(null)
      router.push('/auth/login')
    } catch (error) {
      console.error('Unexpected error signing out:', error)
      setError('Unexpected error during sign out')
    } finally {
      setLoading(false)
    }
  }

  const clearError = () => setError(null)

  return {
    user,
    session,
    loading,
    error,
    signOut,
    clearError
  }
}
