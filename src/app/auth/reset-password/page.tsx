'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Eye, EyeOff, Lock, CheckCircle, ArrowRight } from 'lucide-react'
import { createClient } from '@/lib/supabase'
import { resetPasswordSchema, type ResetPasswordFormData } from '@/lib/validations'
import AuthLayout from '@/components/auth-layout'

export default function ResetPasswordPage() {
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [success, setSuccess] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()
  
  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
  } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
  })

  useEffect(() => {
    // Check if we have the necessary parameters
    const accessToken = searchParams.get('access_token')
    const refreshToken = searchParams.get('refresh_token')
    
    if (!accessToken || !refreshToken) {
      // Redirect to login with error message instead of showing error in form
      router.push('/auth/login?message=Link reset password tidak valid atau sudah kadaluarsa')
    }
  }, [searchParams, router])

  const onSubmit = async (data: ResetPasswordFormData) => {
    setIsLoading(true)
    setError('root', { message: '' })
    
    try {
      const { error } = await supabase.auth.updateUser({
        password: data.password
      })

      if (error) {
        // Redirect to login with error message instead of showing error in form
        router.push('/auth/login?message=Terjadi kesalahan saat reset password. Silakan coba lagi.')
        return
      }

      setSuccess(true)
      setTimeout(() => {
        router.push('/auth/login')
      }, 3000)
    } catch (error) {
      // Redirect to login with error message instead of showing error in form
      router.push('/auth/login?message=Terjadi kesalahan saat reset password. Silakan coba lagi.')
    } finally {
      setIsLoading(false)
    }
  }

  if (success) {
    return (
      <AuthLayout 
        title="Password Berhasil Diubah"
        subtitle="Password Anda telah berhasil diubah. Anda akan dialihkan ke halaman login dalam beberapa detik."
      >
        <div className="text-center space-y-6">
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100">
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
          
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-sm text-green-700">
              Password Anda telah berhasil diubah. Anda akan dialihkan ke halaman login dalam beberapa detik.
            </p>
          </div>
        </div>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout 
      title="Reset Password"
      subtitle="Masukkan password baru Anda"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="password" className="text-gray-700 font-medium">Password Baru</Label>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? 'text' : 'password'}
              placeholder="Masukkan password baru (min. 6 karakter)"
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

        <div className="space-y-2">
          <Label htmlFor="confirmPassword" className="text-gray-700 font-medium">Konfirmasi Password</Label>
          <div className="relative">
            <Input
              id="confirmPassword"
              type={showConfirmPassword ? 'text' : 'password'}
              placeholder="Konfirmasi password baru"
              {...register('confirmPassword')}
              className="h-10 pr-12 rounded-lg border-gray-200 focus:border-green-500 focus:ring-green-500 bg-white/50 backdrop-blur-sm"
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
            >
              {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
          </div>
          {errors.confirmPassword && (
            <p className="text-sm text-red-600">{errors.confirmPassword.message}</p>
          )}
        </div>



        <Button
          type="submit"
          disabled={isLoading}
          className="w-full h-10 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg shadow-lg"
        >
          {isLoading ? (
            <div className="flex items-center">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
              Mengubah Password...
            </div>
          ) : (
            <div className="flex items-center justify-center">
              Ubah Password
              <ArrowRight className="ml-2 h-4 w-4" />
            </div>
          )}
        </Button>
      </form>
    </AuthLayout>
  )
} 