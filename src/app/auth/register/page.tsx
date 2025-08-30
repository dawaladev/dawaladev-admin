'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { registerSchema, type RegisterFormData } from '@/lib/validations'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Eye, EyeOff, ArrowRight, Mail, CheckCircle, Clock } from 'lucide-react'
import AuthLayout from '@/components/auth-layout'

export default function RegisterPage() {
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [showEmailModal, setShowEmailModal] = useState(false)
  const [userEmail, setUserEmail] = useState('')
  const router = useRouter()
  const supabase = createClient()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  })

  const onSubmit = async (data: RegisterFormData) => {
    setIsLoading(true)
    setError('')

    try {
      const { data: signUpData, error } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            name: data.name,
          },
          emailRedirectTo: `${window.location.origin}/api/auth/confirm-email`,
        },
      })

      if (error) {
        setError(error.message)
      } else if (signUpData.user) {
        // Check if email confirmation is required
        if (signUpData.user.email_confirmed_at) {
          // Email already confirmed, create pending user directly
          try {
            const response = await fetch('/api/auth/create-pending-user', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                email: data.email,
                name: data.name,
                authProvider: 'email',
              }),
            })

            if (response.ok) {
              router.push('/auth/login?message=Registration successful! Please wait for Super Admin approval.')
            } else {
              setUserEmail(data.email)
              setShowEmailModal(true)
            }
          } catch (dbError) {
            console.error('Error creating user in database:', dbError)
            setUserEmail(data.email)
            setShowEmailModal(true)
          }
        } else {
          // Show email confirmation modal
          setUserEmail(data.email)
          setShowEmailModal(true)
        }
      }
    } catch (error) {
      setError('Terjadi kesalahan saat mendaftar')
    } finally {
      setIsLoading(false)
    }
  }

  const handleEmailConfirmed = () => {
    setShowEmailModal(false)
    router.push('/auth/login?message=Registration successful! Please wait for Super Admin approval.')
  }

  return (
    <AuthLayout 
      title="Daftar Akun Admin"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="name" className="text-gray-700 font-medium">Nama Lengkap</Label>
          <Input
            id="name"
            type="text"
            placeholder="Masukkan nama lengkap"
            {...register('name')}
            className="h-10 rounded-lg border-gray-200 focus:border-green-500 focus:ring-green-500 bg-white/50 backdrop-blur-sm"
          />
          {errors.name && (
            <p className="text-sm text-red-600">{errors.name.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="email" className="text-gray-700 font-medium">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="Masukkan email"
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
              placeholder="Masukkan password"
              {...register('password')}
              className="h-10 rounded-lg border-gray-200 focus:border-green-500 focus:ring-green-500 bg-white/50 backdrop-blur-sm pr-10"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 pr-3 flex items-center cursor-pointer"
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4 text-gray-400" />
              ) : (
                <Eye className="h-4 w-4 text-gray-400" />
              )}
            </button>
          </div>
          {errors.password && (
            <p className="text-sm text-red-600">{errors.password.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="confirmPassword" className="text-gray-700 font-medium">Konfirmasi Password</Label>
          <div className="relative">
            <Input
              id="confirmPassword"
              type={showConfirmPassword ? 'text' : 'password'}
              placeholder="Konfirmasi password"
              {...register('confirmPassword')}
              className="h-10 rounded-lg border-gray-200 focus:border-green-500 focus:ring-green-500 bg-white/50 backdrop-blur-sm pr-10"
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute inset-y-0 right-0 pr-3 flex items-center cursor-pointer"
            >
              {showConfirmPassword ? (
                <EyeOff className="h-4 w-4 text-gray-400" />
              ) : (
                <Eye className="h-4 w-4 text-gray-400" />
              )}
            </button>
          </div>
          {errors.confirmPassword && (
            <p className="text-sm text-red-600">{errors.confirmPassword.message}</p>
          )}
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        <Button
          type="submit"
          disabled={isLoading}
          className="w-full h-10 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors"
        >
          {isLoading ? (
            <div className="flex items-center">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Mendaftar...
            </div>
          ) : (
            <div className="flex items-center">
              Daftar
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
          onClick={async () => {
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
          }}
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
            Sudah punya akun?{' '}
            <Link
              href="/auth/login"
              className="text-green-600 hover:text-green-700 font-medium"
            >
              Login
            </Link>
          </p>
        </div>
      </form>

      {/* Email Confirmation Modal */}
      {showEmailModal && (
        <div className="fixed inset-0 backdrop-blur-sm rounded-2xl bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 transform transition-all">
            <div className="text-center">
              {/* Icon */}
              <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full mb-4 bg-blue-100">
                <Mail className="h-8 w-8 text-blue-600" />
              </div>
              
              {/* Title */}
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                📧 Konfirmasi Email Anda
              </h3>
              
              {/* Message */}
              <p className="text-gray-600 mb-6 leading-relaxed">
                Kami telah mengirim email konfirmasi ke <strong>{userEmail}</strong>. 
                Silakan cek inbox Anda dan klik link konfirmasi untuk melanjutkan.
              </p>
              
              {/* Info Box */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <div className="flex items-start space-x-3">
                  <CheckCircle className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
                  <div className="text-left">
                    <p className="text-sm font-medium text-blue-800 mb-1">
                      Langkah Selanjutnya
                    </p>
                    <p className="text-sm text-blue-700">
                      1. Cek email di <strong>{userEmail}</strong><br/>
                      2. Klik link konfirmasi dalam email<br/>
                      3. Tunggu approval dari Super Admin
                    </p>
                  </div>
                </div>
              </div>

              {/* Warning Box */}
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-6">
                <div className="flex items-start space-x-3">
                  <Clock className="h-5 w-5 text-orange-500 mt-0.5 flex-shrink-0" />
                  <div className="text-left">
                    <p className="text-sm font-medium text-orange-800 mb-1">
                      ⚠️ Penting!
                    </p>
                    <p className="text-sm text-orange-700">
                      Setelah konfirmasi email, akun Anda masih perlu disetujui oleh Super Admin sebelum dapat mengakses dashboard.
                    </p>
                  </div>
                </div>
              </div>
              
              {/* Action Buttons */}
              <div className="space-y-3">
                <Button
                  onClick={handleEmailConfirmed}
                  className="w-full font-medium py-3 px-4 rounded-lg transition-colors bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <CheckCircle className="h-5 w-5 mr-2" />
                  Saya Sudah Konfirmasi Email
                </Button>
                
                <div className="text-sm text-gray-500">
                  <p>Tidak menerima email? Cek folder spam atau hubungi Super Admin.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </AuthLayout>
  )
} 