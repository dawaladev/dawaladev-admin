'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Clock, UserCheck, Shield, Trash2, AlertTriangle, Search } from 'lucide-react'
import { createClient } from '@/lib/supabase'

interface PendingUser {
  id: string
  email: string
  name?: string
  authProvider: string
  createdAt: Date
}

interface ApprovedAdmin {
  id: string
  email: string
  name?: string
  role: string
  isApproved: boolean
  createdAt: Date
  updatedAt: Date
}

export default function AdminPage() {
  const router = useRouter()
  const [userRole, setUserRole] = useState<string>('ADMIN')
  const [pendingUsers, setPendingUsers] = useState<PendingUser[]>([])
  const [approvedAdmins, setApprovedAdmins] = useState<ApprovedAdmin[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleteAdmin, setDeleteAdmin] = useState<{ id: string; email: string } | null>(null)
  const [searchPending, setSearchPending] = useState('')
  const [searchApproved, setSearchApproved] = useState('')

  useEffect(() => {
    const checkAuthAndFetchData = async () => {
      try {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          router.push('/auth/login')
          return
        }
        // Check user role
        const userResponse = await fetch('/api/auth/check-user-role', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: user.id })
        })
        if (userResponse.ok) {
          const { role } = await userResponse.json()
          setUserRole(role)
          if (role !== 'SUPER_ADMIN') {
            router.push('/dashboard')
            return
          }
        }
        // Fetch pending users
        const pendingResponse = await fetch('/api/admin/pending-users')
        if (pendingResponse.ok) {
          const pendingData = await pendingResponse.json()
          setPendingUsers(pendingData)
        }
        // Fetch approved admins
        const approvedResponse = await fetch('/api/admin/approved-admins')
        if (approvedResponse.ok) {
          const approvedData = await approvedResponse.json()
          setApprovedAdmins(approvedData)
        }
      } catch (error) {
        console.error('Error fetching data:', error)
      } finally {
        setIsLoading(false)
      }
    }
    checkAuthAndFetchData()
  }, [router])

  const handleApprove = async (id: string) => {
    setActionLoading(id + '-approve')
    try {
      const response = await fetch('/api/admin/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pendingUserId: id })
      })
      
      const data = await response.json()
      
      if (response.ok) {
        alert(data.message || 'Admin berhasil disetujui')
        window.location.reload()
      } else {
        alert(data.error || 'Gagal approve admin')
      }
    } catch (e) {
      console.error('Error approving admin:', e)
      alert('Gagal approve admin')
    } finally {
      setActionLoading(null)
    }
  }

  const handleReject = async (id: string) => {
    setActionLoading(id + '-reject')
    try {
      const response = await fetch('/api/admin/reject', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pendingUserId: id })
      })
      
      const data = await response.json()
      
      if (response.ok) {
        alert(data.message || 'Admin berhasil ditolak')
        window.location.reload()
      } else {
        alert(data.error || 'Gagal reject admin')
      }
    } catch (e) {
      console.error('Error rejecting admin:', e)
      alert('Gagal reject admin')
    } finally {
      setActionLoading(null)
    }
  }

  const handleDelete = (id: string, email: string) => {
    setDeleteAdmin({ id, email })
    setShowDeleteModal(true)
  }

  const confirmDelete = async () => {
    if (!deleteAdmin) return

    setActionLoading(deleteAdmin.id + '-delete')
    try {
      await fetch('/api/admin/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: deleteAdmin.id })
      })
      window.location.reload()
    } catch (e) {
      alert('Gagal hapus admin')
    } finally {
      setActionLoading(null)
      setShowDeleteModal(false)
      setDeleteAdmin(null)
    }
  }

  // Filter data berdasarkan pencarian
  const filteredPendingUsers = pendingUsers.filter(user =>
    user.email.toLowerCase().includes(searchPending.toLowerCase()) ||
    (user.name && user.name.toLowerCase().includes(searchPending.toLowerCase()))
  )

  const filteredApprovedAdmins = approvedAdmins.filter(admin =>
    admin.email.toLowerCase().includes(searchApproved.toLowerCase()) ||
    (admin.name && admin.name.toLowerCase().includes(searchApproved.toLowerCase()))
  )

  if (isLoading) {
    return (
      <div className="p-6 lg:p-8 flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
      </div>
    )
  }

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Kelola Admin</h1>
        <p className="text-gray-600">Kelola pendaftaran admin baru dan admin yang sudah disetujui.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Pending Admins - Kiri */}
        <div className="lg:col-span-6">
          <div className="bg-white rounded-xl shadow-sm border border-orange-200 mb-4">
            <div className="flex items-center justify-between px-6 py-4 border-b border-orange-100 bg-orange-50 rounded-t-xl">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <Clock className="h-5 w-5 text-orange-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-orange-900">Menunggu Approval</h3>
                  <p className="text-sm text-orange-600">Admin yang perlu disetujui</p>
                </div>
              </div>
              <span className="bg-orange-200 text-orange-800 text-xs font-medium px-3 py-1 rounded-full">
                {pendingUsers.length} pending
              </span>
            </div>
            <div className="px-6 py-4 border-b border-orange-100">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Cari admin pending..."
                  value={searchPending}
                  onChange={(e) => setSearchPending(e.target.value)}
                  className="pl-10 text-sm"
                />
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-orange-50">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium text-orange-700">Email</th>
                    <th className="px-4 py-3 text-left font-medium text-orange-700">Tanggal Daftar</th>
                    <th className="px-4 py-3 text-left font-medium text-orange-700">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPendingUsers.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="text-center py-8 text-gray-500">
                        <Clock className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                        <p>{searchPending ? 'Tidak ada admin yang cocok' : 'Tidak ada admin yang menunggu approval'}</p>
                      </td>
                    </tr>
                  ) : (
                    filteredPendingUsers.map((user) => (
                      <tr key={user.id} className="border-t border-orange-100 hover:bg-orange-50 transition-colors">
                        <td className="px-4 py-3">
                          <div className="font-medium text-gray-900">{user.email}</div>
                          {user.name && <div className="text-xs text-gray-500">{user.name}</div>}
                        </td>
                        <td className="px-4 py-3 text-gray-600">
                          {new Date(user.createdAt).toLocaleDateString('id-ID')}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex space-x-2">
                            <Button 
                              size="sm" 
                              className="bg-green-600 hover:bg-green-700 text-white"
                              onClick={() => handleApprove(user.id)} 
                              disabled={actionLoading === user.id + '-approve'}
                            >
                              {actionLoading === user.id + '-approve' ? '...' : 'Approve'}
                            </Button>
                            <Button 
                              size="sm" 
                              variant="destructive" 
                              onClick={() => handleReject(user.id)} 
                              disabled={actionLoading === user.id + '-reject'}
                            >
                              {actionLoading === user.id + '-reject' ? '...' : 'Reject'}
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
        {/* Approved Admins - Kanan */}
        <div className="lg:col-span-6">
          <div className="bg-white rounded-xl shadow-sm border border-green-200 mb-4">
            <div className="flex items-center justify-between px-6 py-4 border-b border-green-100 bg-green-50 rounded-t-xl">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <UserCheck className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-green-900">Admin Aktif</h3>
                  <p className="text-sm text-green-600">Admin yang sudah disetujui</p>
                </div>
              </div>
              <span className="bg-green-200 text-green-800 text-xs font-medium px-3 py-1 rounded-full">
                {approvedAdmins.length} aktif
              </span>
            </div>
            <div className="px-6 py-4 border-b border-green-100">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Cari admin aktif..."
                  value={searchApproved}
                  onChange={(e) => setSearchApproved(e.target.value)}
                  className="pl-10 text-sm"
                />
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-green-50">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium text-green-700">Email</th>
                    <th className="px-4 py-3 text-left font-medium text-green-700">Tanggal Daftar</th>
                    <th className="px-4 py-3 text-left font-medium text-green-700">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredApprovedAdmins.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="text-center py-8 text-gray-500">
                        <UserCheck className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                        <p>{searchApproved ? 'Tidak ada admin yang cocok' : 'Belum ada admin aktif'}</p>
                      </td>
                    </tr>
                  ) : (
                    filteredApprovedAdmins.map((admin) => (
                      <tr key={admin.id} className="border-t border-green-100 hover:bg-green-50 transition-colors">
                        <td className="px-4 py-3">
                          <div className="font-medium text-gray-900">{admin.email}</div>
                          {admin.name && <div className="text-xs text-gray-500">{admin.name}</div>}
                        </td>
                        <td className="px-4 py-3 text-gray-600">
                          {new Date(admin.createdAt).toLocaleDateString('id-ID')}
                        </td>
                        <td className="px-4 py-3">
                          <Button 
                            size="sm" 
                            variant="destructive" 
                            onClick={() => handleDelete(admin.id, admin.email)} 
                            disabled={actionLoading === admin.id + '-delete'}
                            className="h-8 w-8 p-0"
                            title="Hapus"
                          >
                            {actionLoading === admin.id + '-delete' ? (
                              <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                            ) : (
                              <Trash2 className="h-3 w-3" />
                            )}
                          </Button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && deleteAdmin && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center mb-4">
              <AlertTriangle className="h-5 w-5 text-red-500 mr-3" />
              <h3 className="text-lg font-medium text-gray-900">Konfirmasi Hapus Admin</h3>
            </div>
            <p className="text-gray-600 mb-6">
              Apakah Anda yakin ingin menghapus admin <strong>{deleteAdmin.email}</strong>? 
              Tindakan ini tidak dapat dibatalkan.
            </p>
            <div className="flex space-x-3">
              <Button
                variant="destructive"
                onClick={confirmDelete}
                disabled={actionLoading === deleteAdmin.id + '-delete'}
                className="flex-1"
              >
                {actionLoading === deleteAdmin.id + '-delete' ? 'Menghapus...' : 'Hapus'}
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setShowDeleteModal(false)
                  setDeleteAdmin(null)
                }}
                className="flex-1"
              >
                Batal
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
} 