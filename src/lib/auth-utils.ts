import { createClient } from './supabase'

export interface AuthError {
  message: string
  code?: string
  status?: number
}

export async function handleAuthError(error: unknown): Promise<AuthError> {
  console.error('Auth error:', error)
  
  // Type guard to check if error has message property
  const errorMessage = error && typeof error === 'object' && 'message' in error 
    ? (error as { message: string }).message 
    : ''
  
  // Handle specific Supabase auth errors
  if (errorMessage.includes('Invalid Refresh Token')) {
    return {
      message: 'Session expired. Please login again.',
      code: 'INVALID_REFRESH_TOKEN'
    }
  }
  
  if (errorMessage.includes('Refresh Token Not Found')) {
    return {
      message: 'Session expired. Please login again.',
      code: 'REFRESH_TOKEN_NOT_FOUND'
    }
  }
  
  if (errorMessage.includes('Invalid login credentials')) {
    return {
      message: 'Email atau password salah. Silakan periksa kembali email dan password Anda.',
      code: 'INVALID_CREDENTIALS'
    }
  }
  
  if (errorMessage.includes('Email not confirmed')) {
    return {
      message: 'Email belum dikonfirmasi. Silakan cek email Anda dan klik link konfirmasi.',
      code: 'EMAIL_NOT_CONFIRMED'
    }
  }
  
  if (errorMessage.includes('User not found')) {
    return {
      message: 'Akun tidak ditemukan. Silakan daftar terlebih dahulu.',
      code: 'USER_NOT_FOUND'
    }
  }
  
  if (errorMessage.includes('Too many requests')) {
    return {
      message: 'Terlalu banyak percobaan login. Silakan coba lagi dalam beberapa menit.',
      code: 'TOO_MANY_REQUESTS'
    }
  }
  
  // Handle network errors
  if (errorMessage.includes('Failed to fetch') || errorMessage.includes('NetworkError')) {
    return {
      message: 'Koneksi internet bermasalah. Silakan periksa koneksi Anda dan coba lagi.',
      code: 'NETWORK_ERROR'
    }
  }

  // Handle timeout errors
  if (errorMessage.includes('timeout')) {
    return {
      message: 'Waktu tunggu habis. Silakan coba lagi.',
      code: 'TIMEOUT_ERROR'
    }
  }

  // Default error message
  return {
    message: errorMessage || 'Terjadi kesalahan saat autentikasi. Silakan coba lagi.',
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

export function isAuthError(error: unknown): boolean {
  const errorMessage = error && typeof error === 'object' && 'message' in error 
    ? (error as { message: string }).message 
    : ''
    
  return errorMessage.includes('Invalid Refresh Token') ||
         errorMessage.includes('Refresh Token Not Found') ||
         errorMessage.includes('Invalid login credentials') ||
         errorMessage.includes('Email not confirmed') ||
         errorMessage.includes('User not found') ||
         errorMessage.includes('Too many requests')
}
