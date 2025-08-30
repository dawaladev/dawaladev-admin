'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { loginSchema, type LoginFormData } from '@/lib/validations'
import { createClient } from '@/lib/supabase'
import { useRouter, useSearchParams } from 'next/navigation'
import { handleAuthError, clearAuthSession } from '@/lib/auth-utils'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Eye, EyeOff, ArrowRight, CheckCircle, Clock, AlertCircle } from 'lucide-react'
import AuthLayout from '@/components/auth-layout'

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()

  // Check for success message from URL params
  useEffect(() => {
    const message = searchParams.get('message')
    if (message) {
      setSuccessMessage(message)
      setShowSuccessModal(true)
      // Clear the message from URL
      const newUrl = new URL(window.location.href)
      newUrl.searchParams.delete('message')
      window.history.replaceState({}, '', newUrl.toString())
    }
  }, [searchParams])

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  })

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true)
    setError('')

    try {
      // Clear any existing auth session first
      await clearAuthSession()

      // First, check if user exists in our database
      try {
        const checkResponse = await fetch('/api/auth/check-user-exists', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email: data.email }),
        })

        if (checkResponse.ok) {
          const { exists, isPending } = await checkResponse.json()
          
          if (!exists && !isPending) {
            setError('Akun tidak ditemukan. Silakan daftar terlebih dahulu atau periksa email Anda.')
            setIsLoading(false)
            return
          }
          
          if (isPending) {
            setError('Akun Anda masih dalam proses pendaftaran. Silakan tunggu persetujuan Super Admin.')
            setIsLoading(false)
            return
          }
        }
      } catch (checkError) {
        console.error('Error checking user existence:', checkError)
        // Continue with login attempt if check fails
      }

      const { error } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      })

      if (error) {
        console.error('Login error:', error)
        const authError = await handleAuthError(error)
        setError(authError.message)
        setIsLoading(false)
        return
      } else {
        // Check approval status after successful login
        try {
          const response = await fetch('/api/auth/check-approval', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
          })

          if (response.ok) {
            const { isApproved, role } = await response.json()
            
            if (isApproved) {
              // User is approved, redirect to dashboard
              router.push('/dashboard')
            } else {
              // User is not approved, show message
              setError('Akun Anda masih menunggu persetujuan Super Admin. Silakan coba lagi nanti.')
            }
          } else {
            // If check fails, redirect to dashboard and let layout handle it
            router.push('/dashboard')
          }
        } catch (checkError) {
          console.error('Error checking approval:', checkError)
          // If check fails, redirect to dashboard and let layout handle it
          router.push('/dashboard')
        }
      }
    } catch (error) {
      console.error('Unexpected login error:', error)
      const authError = await handleAuthError(error)
      setError(authError.message)
      setIsLoading(false)
    }
  }

  const handleGoogleLogin = async () => {
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      })
      
      if (error) {
        console.error('Google OAuth error:', error)
        setError(`Error: ${error.message}`)
      }
    } catch (err) {
      console.error('Google OAuth exception:', err)
      setError('Terjadi kesalahan saat login dengan Google')
    }
  }

    return (
    <AuthLayout 
      title="Masuk Admin"
    >

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-gray-700 font-medium">Email</Label>
                             <Input
                 id="email"
                 type="email"
                 placeholder="Masukkan email Anda"
                 {...register('email')}
                 className="h-10 rounded-lg border-gray-200 focus:border-green-500 focus:ring-green-500 bg-white/50 backdrop-blur-sm"
               />
              {errors.email && (
                <p className="text-sm text-red-600">{errors.email.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-gray-700 font-medium">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  {...register('password')}
                                     className="h-10 pr-12 rounded-lg border-gray-200 focus:border-green-500 focus:ring-green-500 bg-white/50 backdrop-blur-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
              {errors.password && (
                <p className="text-sm text-red-600">{errors.password.message}</p>
              )}
            </div>

            <div className="flex justify-end">
              <Link
                href="/auth/forgot-password"
                className="text-sm text-green-600 hover:text-green-700 font-medium"
              >
                Lupa password?
              </Link>
            </div>

                    {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700 font-medium">Login Gagal</p>
                <p className="text-sm text-red-600 mt-1">{error}</p>
              </div>
            </div>
          </div>
        )}

            <Button
              type="submit"
              disabled={isLoading}
                             className="w-full h-10 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg shadow-lg"
            >
              {isLoading ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Memproses...
                </div>
              ) : (
                <div className="flex items-center justify-center">
                  Masuk
                  <ArrowRight className="ml-2 h-4 w-4" />
                </div>
              )}
            </Button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                  <span className="px-4 py-1 bg-white/80 backdrop-blur-md text-gray-700 font-medium rounded-lg border border-white/30 shadow-sm">ATAU</span>
              </div>
            </div>
            
            <Button
              type="button"
              variant="outline"
                             className="w-full h-10 border-gray-300 hover:bg-gray-50 rounded-lg bg-white/50 backdrop-blur-sm"
              onClick={handleGoogleLogin}
            >
              <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Lanjutkan dengan Google
            </Button>

            <div className="text-center">
              <p className="text-sm text-gray-600">
                Belum punya akun?{' '}
                <Link
                  href="/auth/register"
                  className="text-green-600 hover:text-green-700 font-medium"
                >
                  Daftar
                </Link>
              </p>
            </div>
          </form>

          {/* Success Modal */}
          {showSuccessModal && (
            <div className="fixed inset-0 backdrop-blur-sm rounded-2xl bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 transform transition-all">
                <div className="text-center">
                  {/* Icon */}
                  <div className={`mx-auto flex items-center justify-center h-16 w-16 rounded-full mb-4 ${
                    successMessage.includes('pending approval') ? 'bg-orange-100' : 'bg-green-100'
                  }`}>
                    {successMessage.includes('pending approval') ? (
                      <Clock className="h-8 w-8 text-orange-600" />
                    ) : (
                      <CheckCircle className="h-8 w-8 text-green-600" />
                    )}
                  </div>
                  
                  {/* Title */}
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {successMessage.includes('pending approval') ? '⏳ Menunggu Persetujuan' : 'Pendaftaran Berhasil! 🎉'}
                  </h3>
                  
                  {/* Message */}
                  <p className="text-gray-600 mb-6 leading-relaxed">
                    {successMessage}
                  </p>
                  
                  {/* Info Box */}
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                    <div className="flex items-start space-x-3">
                      <Clock className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
                      <div className="text-left">
                        <p className="text-sm font-medium text-blue-800 mb-1">
                          {successMessage.includes('pending approval') ? 'Status Akun Anda' : 'Proses Approval'}
                        </p>
                        <p className="text-sm text-blue-700">
                          {successMessage.includes('pending approval') 
                            ? 'Akun Anda sedang menunggu persetujuan Super Admin. Anda akan dapat mengakses dashboard setelah akun disetujui.'
                            : 'Super Admin akan meninjau pendaftaran Anda dalam waktu 24-48 jam. Anda akan dapat login setelah akun disetujui.'
                          }
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  {/* Action Buttons */}
                  <div className="space-y-3">
                    <Button
                      onClick={() => setShowSuccessModal(false)}
                      className={`w-full font-medium py-3 px-4 rounded-lg transition-colors ${
                        successMessage.includes('pending approval') 
                          ? 'bg-orange-600 hover:bg-orange-700 text-white' 
                          : 'bg-green-600 hover:bg-green-700 text-white'
                      }`}
                    >
                      {successMessage.includes('pending approval') ? (
                        <>
                          <Clock className="h-5 w-5 mr-2" />
                          Baik, Saya Mengerti
                        </>
                      ) : (
                        <>
                          <CheckCircle className="h-5 w-5 mr-2" />
                          Baik, Saya Mengerti
                        </>
                      )}
                    </Button>
                    
                    <div className="text-sm text-gray-500">
                      <p>Jika sudah lebih dari 48 jam, silakan hubungi Super Admin.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
    </AuthLayout>
  )
} 