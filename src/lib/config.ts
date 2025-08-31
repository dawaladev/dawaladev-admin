export const config = {
  supabase: {
    bucketName: process.env.SUPABASE_BUCKET_NAME || 'gastronomi',
    // Add other Supabase-related config here if needed
  },
  // Add other configuration sections as needed
}

// Get site URL for redirects
export function getSiteUrl(): string {
  // In production, use the environment variable
  if (process.env.NEXT_PUBLIC_SITE_URL) {
    return process.env.NEXT_PUBLIC_SITE_URL
  }
  
  // In development, use localhost
  if (process.env.NODE_ENV === 'development') {
    return 'http://localhost:3000'
  }
  
  // Fallback to window.location.origin if available (client-side)
  if (typeof window !== 'undefined') {
    return window.location.origin
  }
  
  // Last fallback
  return 'https://dawaladev-admin.vercel.app'
}