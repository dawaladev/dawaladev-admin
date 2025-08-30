import { prisma } from '@/lib/prisma'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Settings, Database, Users, Package, Utensils } from 'lucide-react'

export default async function SettingsPage() {
  const supabase = await createServerSupabaseClient()
  
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  try {
    // Get user role
    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
    })

    const userRole = dbUser?.role || 'ADMIN'

    // Get system statistics sequentially to avoid prepared statement issues
    const jenisPaketCount = await prisma.jenisPaket.count()
    const makananCount = await prisma.makanan.count()
    const adminCount = await prisma.user.count({ where: { role: 'ADMIN' } })
    const totalHargaResult = await prisma.makanan.aggregate({
      _sum: {
        harga: true
      }
    })

    const stats = [
      {
        title: 'Total Jenis Paket',
        value: jenisPaketCount,
        icon: Package,
        color: 'bg-blue-500'
      },
      {
        title: 'Total Makanan',
        value: makananCount,
        icon: Utensils,
        color: 'bg-green-500'
      },
      {
        title: 'Total Admin',
        value: adminCount,
        icon: Users,
        color: 'bg-purple-500'
      },
      {
        title: 'Total Nilai Makanan',
        value: `Rp ${totalHargaResult._sum.harga?.toLocaleString() || 0}`,
        icon: Database,
        color: 'bg-yellow-500'
      }
    ]

    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Pengaturan Sistem</h1>
          <p className="text-gray-600">Kelola konfigurasi dan lihat statistik sistem</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, index) => {
            const Icon = stat.icon
            return (
              <div key={index} className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className={`p-3 rounded-full ${stat.color}`}>
                    <Icon className="h-6 w-6 text-white" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                    <p className="text-2xl font-semibold text-gray-900">{stat.value}</p>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center mb-4">
              <Settings className="h-5 w-5 text-gray-400 mr-2" />
              <h2 className="text-lg font-medium text-gray-900">Informasi Sistem</h2>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Versi Aplikasi:</span>
                <span className="text-sm font-medium">1.0.0</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Framework:</span>
                <span className="text-sm font-medium">Next.js 15</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Database:</span>
                <span className="text-sm font-medium">PostgreSQL</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Authentication:</span>
                <span className="text-sm font-medium">Supabase Auth</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center mb-4">
              <Users className="h-5 w-5 text-gray-400 mr-2" />
              <h2 className="text-lg font-medium text-gray-900">Informasi User</h2>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Email:</span>
                <span className="text-sm font-medium">{user.email}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Role:</span>
                <span className="text-sm font-medium">{userRole}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">User ID:</span>
                <span className="text-sm font-medium font-mono">{user.id}</span>
              </div>
            </div>
          </div>
        </div>

        {userRole === 'SUPER_ADMIN' && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <div className="flex items-start">
              <Settings className="h-5 w-5 text-blue-400 mt-0.5 mr-3" />
              <div>
                <h3 className="text-lg font-medium text-blue-800">Super Admin Access</h3>
                <p className="text-sm text-blue-700 mt-1">
                  Anda memiliki akses penuh sebagai Super Admin. Anda dapat mengelola semua data, 
                  admin, dan konfigurasi sistem.
                </p>
                <div className="mt-4 space-y-2">
                  <Button variant="outline" size="sm" className="mr-2">
                    Backup Database
                  </Button>
                  <Button variant="outline" size="sm" className="mr-2">
                    Export Data
                  </Button>
                  <Button variant="outline" size="sm">
                    System Logs
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
          <div className="flex items-start">
            <Database className="h-5 w-5 text-gray-400 mt-0.5 mr-3" />
            <div>
              <h3 className="text-lg font-medium text-gray-800">Database Status</h3>
              <p className="text-sm text-gray-600 mt-1">
                Sistem database berjalan dengan normal. Semua operasi CRUD berfungsi dengan baik.
              </p>
              <div className="mt-4">
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                  <span className="text-sm text-gray-600">Database Connected</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  } catch (error) {
    console.error('Settings error:', error)
    
    // Return a fallback UI if database queries fail
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Pengaturan Sistem</h1>
          <p className="text-gray-600">Kelola konfigurasi dan lihat statistik sistem</p>
        </div>

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800">
                Terjadi kesalahan saat memuat data
              </h3>
              <div className="mt-2 text-sm text-yellow-700">
                <p>
                  Tidak dapat memuat statistik sistem. Silakan coba refresh halaman atau hubungi administrator.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center mb-4">
              <Settings className="h-5 w-5 text-gray-400 mr-2" />
              <h2 className="text-lg font-medium text-gray-900">Informasi Sistem</h2>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Versi Aplikasi:</span>
                <span className="text-sm font-medium">1.0.0</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Framework:</span>
                <span className="text-sm font-medium">Next.js 15</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Database:</span>
                <span className="text-sm font-medium">PostgreSQL</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Authentication:</span>
                <span className="text-sm font-medium">Supabase Auth</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center mb-4">
              <Users className="h-5 w-5 text-gray-400 mr-2" />
              <h2 className="text-lg font-medium text-gray-900">Informasi User</h2>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Email:</span>
                <span className="text-sm font-medium">{user.email}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">User ID:</span>
                <span className="text-sm font-medium font-mono">{user.id}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }
} 