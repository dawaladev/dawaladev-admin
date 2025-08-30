'use client'

import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ArrowLeft, User, Mail, Shield } from 'lucide-react'
import Link from 'next/link'

interface Admin {
  id: string
  email: string
  role: string
}

interface PageProps {
  params: {
    id: string
  }
}

export default function EditAdminPage({ params }: PageProps) {
  const resolvedParams = use(params)
  const [admin, setAdmin] = useState<Admin | null>(null)
  const [email, setEmail] = useState('')
  const [role, setRole] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  useEffect(() => {
    const fetchAdmin = async () => {
      try {
        const response = await fetch(`/api/admin/${resolvedParams.id}`)
        if (response.ok) {
          const data = await response.json()
          setAdmin(data)
          setEmail(data.email)
          setRole(data.role)
        } else {
          setError('Admin tidak ditemukan')
        }
      } catch (error) {
        console.error('Error fetching admin:', error)
        setError('Terjadi kesalahan saat memuat data')
      }
    }

    fetchAdmin()
  }, [resolvedParams.id])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    if (!email || !role) {
      setError('Semua field harus diisi')
      setLoading(false)
      return
    }

    try {
      const response = await fetch(`/api/admin/${resolvedParams.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          role,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Terjadi kesalahan')
      }

      router.push('/dashboard/admin')
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Terjadi kesalahan')
    } finally {
      setLoading(false)
    }
  }

  if (!admin && !error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Memuat data...</p>
        </div>
      </div>
    )
  }

  if (error && !admin) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <Link href="/dashboard/admin">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Kembali
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Error</h1>
            <p className="text-gray-600">Terjadi kesalahan</p>
          </div>
        </div>

        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <p className="text-red-700">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <Link href="/dashboard/admin">
          <Button variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Kembali
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Edit Admin</h1>
          <p className="text-gray-600">Ubah data admin</p>
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <div className="flex items-start">
          <Shield className="h-5 w-5 text-blue-400 mt-0.5 mr-3" />
          <div>
            <h3 className="text-sm font-medium text-blue-800">Super Admin Access</h3>
            <p className="text-sm text-blue-700 mt-1">
              Hanya Super Admin yang dapat mengedit data admin. Perubahan akan mempengaruhi akses admin ke sistem.
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6 max-w-md">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="email">Email</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Masukkan email"
                className="pl-10"
                required
              />
            </div>
          </div>

          <div>
            <Label htmlFor="role">Role</Label>
            <Select value={role} onValueChange={setRole}>
              <SelectTrigger>
                <SelectValue placeholder="Pilih role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ADMIN">Admin</SelectItem>
                <SelectItem value="SUPER_ADMIN">Super Admin</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {error && (
            <div className="text-red-600 text-sm">{error}</div>
          )}

          <div className="flex space-x-4">
            <Button
              type="submit"
              disabled={loading}
              className="flex-1"
            >
              {loading ? 'Menyimpan...' : 'Simpan Perubahan'}
            </Button>
            <Link href="/dashboard/admin" className="flex-1">
              <Button type="button" variant="outline" className="w-full">
                Batal
              </Button>
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
} 