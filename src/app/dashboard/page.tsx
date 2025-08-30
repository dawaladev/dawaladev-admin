import { createServerSupabaseClient } from '@/lib/supabase-server'
import { findUserById, findUserByEmail, updateUser } from '@/lib/db-helpers'
import { withPrisma } from '@/lib/prisma'

export default async function DashboardPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return <div>Loading...</div>
  }

  // Get user data directly with retry
  let dbUser = null
  try {
    dbUser = await findUserById(user.id)
    
    // If not found by ID, try to find by email
    if (!dbUser && user.email) {
      dbUser = await findUserByEmail(user.email)
    }
  } catch (error) {
    console.error('Error fetching user data:', error)
    dbUser = null
  }
  
  // Check if any super admin exists
  let superAdminCount = 0
  try {
    superAdminCount = await withPrisma(async (client) => {
      return await client.user.count({
        where: { role: 'SUPER_ADMIN' }
      })
    })
  } catch (error) {
    console.error('Error counting super admins:', error)
    superAdminCount = 0
  }
  
  // If no super admin exists, promote the first user
  if (superAdminCount === 0 && dbUser) {
    try {
      await updateUser(user.id, {
        role: 'SUPER_ADMIN',
        isApproved: true,
      })
      console.log('First user promoted to Super Admin')
    } catch (error) {
      console.error('Error promoting user to Super Admin:', error)
    }
  }

  // Get dashboard stats with fallbacks
  let jenisPaketCount = 0
  let makananCount = 0
  let adminCount = 0
  let recentMakanan: Array<{ id: number; namaMakanan: string; harga: number; createdAt: Date }> = []

  try {
    jenisPaketCount = await withPrisma(async (client) => {
      return await client.jenisPaket.count()
    })
  } catch (error) {
    console.error('Error counting jenis paket:', error)
    jenisPaketCount = 0
  }

  try {
    makananCount = await withPrisma(async (client) => {
      return await client.makanan.count()
    })
  } catch (error) {
    console.error('Error counting makanan:', error)
    makananCount = 0
  }

  try {
    adminCount = await withPrisma(async (client) => {
      return await client.user.count({
        where: { role: 'ADMIN' }
      })
    })
  } catch (error) {
    console.error('Error counting admins:', error)
    adminCount = 0
  }

  try {
    recentMakanan = await withPrisma(async (client) => {
      return await client.makanan.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' }
      })
    })
  } catch (error) {
    console.error('Error fetching recent makanan:', error)
    recentMakanan = []
  }

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600">Selamat datang di panel admin Dawala</p>
      </div>



      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Jenis Paket</p>
              <p className="text-2xl font-semibold text-gray-900">{jenisPaketCount}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Makanan</p>
              <p className="text-2xl font-semibold text-gray-900">{makananCount}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Admin</p>
              <p className="text-2xl font-semibold text-gray-900">{adminCount}</p>
            </div>
          </div>
        </div>


      </div>

      {/* Recent Makanan */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Makanan Terbaru</h3>
        </div>
        <div className="p-6">
          {recentMakanan.length > 0 ? (
            <div className="space-y-4">
              {recentMakanan.map((makanan) => (
                <div key={makanan.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <h4 className="font-medium text-gray-900">{makanan.namaMakanan}</h4>
                    <p className="text-sm text-gray-600">Rp {makanan.harga}</p>
                  </div>
                  <span className="text-sm text-gray-500">
                    {new Date(makanan.createdAt).toLocaleDateString('id-ID')}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">Belum ada makanan yang ditambahkan</p>
          )}
        </div>
      </div>
    </div>
  )
} 