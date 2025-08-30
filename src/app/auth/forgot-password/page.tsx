'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { createClient } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Mail, ArrowLeft, ArrowRight, CheckCircle } from 'lucide-react'
import { forgotPasswordSchema, type ForgotPasswordFormData } from '@/lib/validations'
import AuthLayout from '@/components/auth-layout'

export default function ForgotPasswordPage() {
  const [success, setSuccess] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const supabase = createClient()
  
  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
  })

  const onSubmit = async (data: ForgotPasswordFormData) => {
    setIsLoading(true)
    setError('root', { message: '' })
    
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(data.email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      })

      if (error) {
        setError('root', { message: error.message })
        return
      }

      setSuccess('Link reset password telah dikirim ke email Anda. Silakan cek inbox atau spam folder.')
    } catch (error) {
      setError('root', { message: 'Terjadi kesalahan saat mengirim reset password' })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <AuthLayout 
      title="Lupa Password"
      subtitle="Masukkan email Anda untuk reset password"
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

        {errors.root && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-600">{errors.root.message}</p>
          </div>
        )}

        {success && (
          <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center">
              <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
              <p className="text-sm text-green-600">{success}</p>
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
              Mengirim...
            </div>
          ) : (
            <div className="flex items-center justify-center">
              Kirim Reset Password
              <ArrowRight className="ml-2 h-4 w-4" />
            </div>
          )}
        </Button>

        <div className="text-center">
          <Link
            href="/auth/login"
            className="inline-flex items-center text-sm text-green-600 hover:text-green-700 font-medium"
          >
            <ArrowLeft className="mr-1 h-4 w-4" />
            Kembali ke Login
          </Link>
        </div>
      </form>
    </AuthLayout>
  )
} 