'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { Clock, RefreshCw, LogOut } from 'lucide-react'
import { Button } from '@/components/ui/button'
import AuthLayout from '@/components/auth-layout'

export default function PendingApprovalPage() {
  const [userEmail, setUserEmail] = useState('')
  const [isChecking, setIsChecking] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user?.email) {
        setUserEmail(user.email)
      }
    }
    getUser()
  }, [supabase.auth])

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut()
      router.push('/auth/login')
    } catch (error) {
      console.error('Error logging out:', error)
      router.push('/auth/login')
    }
  }

  const checkApprovalStatus = async () => {
    setIsChecking(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const response = await fetch('/api/auth/check-approval', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: user.id }),
        })
        
        if (response.ok) {
          const { isApproved } = await response.json()
          if (isApproved) {
            router.push('/dashboard')
          }
        }
      }
    } catch (error) {
      console.error('Error checking approval status:', error)
    } finally {
      setIsChecking(false)
    }
  }

  return (
    <AuthLayout title="Menunggu Persetujuan">
      <div className="text-center space-y-6">
        {/* Icon */}
        <div className="flex justify-center">
          <div className="w-24 h-24 bg-gradient-to-br from-orange-400 to-orange-600 rounded-full flex items-center justify-center shadow-lg">
            <Clock className="h-12 w-12 text-white" />
          </div>
        </div>

        {/* Title */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-3">
            Akun Anda Sedang Menunggu Persetujuan ⏳
          </h1>
          <p className="text-gray-600 text-lg leading-relaxed">
            Super Admin akan meninjau pendaftaran Anda dalam waktu 24-48 jam.
          </p>
        </div>

        {/* User Info */}
        {userEmail && (
          <div className="bg-gradient-to-r from-orange-50 to-orange-100 border border-orange-200 rounded-xl p-6 shadow-sm">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-orange-200 rounded-full flex items-center justify-center">
                <span className="text-orange-700 font-bold text-sm">
                  {userEmail.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="text-left">
                <p className="text-sm text-orange-700 font-medium">Email terdaftar:</p>
                <p className="font-bold text-gray-900">{userEmail}</p>
              </div>
            </div>
          </div>
        )}

        {/* Status Info */}
        <div className="bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200 rounded-xl p-6 shadow-sm">
          <div className="flex items-center space-x-3 mb-3">
            <div className="w-10 h-10 bg-blue-200 rounded-full flex items-center justify-center">
              <Clock className="h-5 w-5 text-blue-700" />
            </div>
            <div>
              <p className="font-bold text-blue-900">Status: Menunggu Approval</p>
              <p className="text-sm text-blue-700">
                Anda akan dapat mengakses dashboard setelah akun disetujui oleh Super Admin.
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-4">
          <Button
            onClick={checkApprovalStatus}
            disabled={isChecking}
            className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-bold py-4 px-6 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
          >
            {isChecking ? (
              <div className="flex items-center justify-center">
                <RefreshCw className="h-5 w-5 mr-3 animate-spin" />
                <span className="text-lg">Mengecek Status...</span>
              </div>
            ) : (
              <div className="flex items-center justify-center">
                <RefreshCw className="h-5 w-5 mr-3" />
                <span className="text-lg">Cek Status Approval</span>
              </div>
            )}
          </Button>

          <Button
            onClick={handleLogout}
            variant="outline"
            className="w-full border-2 border-gray-300 hover:bg-gray-50 text-gray-700 font-bold py-4 px-6 rounded-xl transition-all duration-200 shadow-md hover:shadow-lg"
          >
            <div className="flex items-center justify-center">
              <LogOut className="h-5 w-5 mr-3" />
              <span className="text-lg">Logout</span>
            </div>
          </Button>
        </div>

        {/* Info */}
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
          <p className="text-sm text-gray-600 text-center">
            <span className="font-medium">💡 Tips:</span> Jika sudah lebih dari 48 jam, silakan hubungi Super Admin.
          </p>
        </div>
      </div>
    </AuthLayout>
  )
} 