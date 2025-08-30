import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Home, ArrowLeft } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 text-center">
        <div>
          <h1 className="text-9xl font-bold text-gray-300">404</h1>
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            Halaman Tidak Ditemukan
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Maaf, halaman yang Anda cari tidak dapat ditemukan.
          </p>
        </div>
        
        <div className="space-y-4">
          <Link href="/dashboard">
            <Button className="w-full">
              <Home className="mr-2 h-4 w-4" />
              Kembali ke Dashboard
            </Button>
          </Link>
          
          <Link href="/auth/login">
            <Button variant="outline" className="w-full">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Kembali ke Login
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
} 