import { createClient } from './supabase'

export interface AuthError {
  message: string
  code?: string
  status?: number
}

export async function handleAuthError(error: any): Promise<AuthError> {
  console.error('Auth error:', error)
  
  // Handle specific Supabase auth errors
  if (error?.message?.includes('Invalid Refresh Token')) {
    return {
      message: 'Session expired. Please login again.',
      code: 'INVALID_REFRESH_TOKEN'
    }
  }
  
  if (error?.message?.includes('Refresh Token Not Found')) {
    return {
      message: 'Session expired. Please login again.',
      code: 'REFRESH_TOKEN_NOT_FOUND'
    }
  }
  
  if (error?.message?.includes('Invalid login credentials')) {
    return {
      message: 'Email atau password salah. Silakan periksa kembali email dan password Anda.',
      code: 'INVALID_CREDENTIALS'
    }
  }
  
  if (error?.message?.includes('Email not confirmed')) {
    return {
      message: 'Email belum dikonfirmasi. Silakan cek email Anda dan klik link konfirmasi.',
      code: 'EMAIL_NOT_CONFIRMED'
    }
  }
  
  if (error?.message?.includes('User not found')) {
    return {
      message: 'Akun tidak ditemukan. Silakan daftar terlebih dahulu.',
      code: 'USER_NOT_FOUND'
    }
  }
  
  if (error?.message?.includes('Too many requests')) {
    return {
      message: 'Terlalu banyak percobaan login. Silakan coba lagi dalam beberapa menit.',
      code: 'TOO_MANY_REQUESTS'
    }
  }
  
  // Handle network errors
  if (error?.message?.includes('Failed to fetch') || error?.message?.includes('NetworkError')) {
    return {
      message: 'Koneksi internet bermasalah. Silakan periksa koneksi Anda dan coba lagi.',
      code: 'NETWORK_ERROR'
    }
  }

  // Handle timeout errors
  if (error?.message?.includes('timeout')) {
    return {
      message: 'Waktu tunggu habis. Silakan coba lagi.',
      code: 'TIMEOUT_ERROR'
    }
  }

  // Default error message
  return {
    message: error?.message || 'Terjadi kesalahan saat autentikasi. Silakan coba lagi.',
    code: 'UNKNOWN_ERROR'
  }
}

export async function clearAuthSession(): Promise<void> {
  try {
    const supabase = createClient()
    await supabase.auth.signOut()
    
    // Clear any local storage items related to auth
    if (typeof window !== 'undefined') {
      localStorage.removeItem('supabase.auth.token')
      localStorage.removeItem('sb-' + process.env.NEXT_PUBLIC_SUPABASE_URL?.split('//')[1]?.split('.')[0] + '-auth-token')
    }
  } catch (error) {
    console.error('Error clearing auth session:', error)
  }
}

export async function refreshAuthSession(): Promise<boolean> {
  try {
    const supabase = createClient()
    const { data, error } = await supabase.auth.refreshSession()
    
    if (error) {
      console.error('Error refreshing session:', error)
      return false
    }
    
    return !!data.session
  } catch (error) {
    console.error('Unexpected error refreshing session:', error)
    return false
  }
}

export function isAuthError(error: any): boolean {
  return error?.message?.includes('Invalid Refresh Token') ||
         error?.message?.includes('Refresh Token Not Found') ||
         error?.message?.includes('Invalid login credentials') ||
         error?.message?.includes('Email not confirmed') ||
         error?.message?.includes('User not found') ||
         error?.message?.includes('Too many requests')
}
