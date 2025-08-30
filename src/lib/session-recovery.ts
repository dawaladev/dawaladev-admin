import { createServerSupabaseClient } from './supabase-server'
import { redirect } from 'next/navigation'

export async function validateSession(): Promise<{ user: any; error: string | null }> {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user }, error } = await supabase.auth.getUser()
    
    if (error) {
      console.error('Session validation error:', error)
      
      // Handle specific auth errors
      if (error.message.includes('Invalid Refresh Token') || 
          error.message.includes('Refresh Token Not Found')) {
        return { user: null, error: 'Session expired. Please login again.' }
      }
      
      return { user: null, error: 'Authentication error. Please login again.' }
    }
    
    return { user, error: null }
  } catch (error) {
    console.error('Unexpected session validation error:', error)
    return { user: null, error: 'Unexpected authentication error. Please login again.' }
  }
}

export async function requireAuth(): Promise<any> {
  const { user, error } = await validateSession()
  
  if (error || !user) {
    redirect(`/auth/login?message=${encodeURIComponent(error || 'Please login to continue.')}`)
  }
  
  return user
}
