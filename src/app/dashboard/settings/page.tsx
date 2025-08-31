'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Settings, Save, Mail, Phone } from 'lucide-react'
import { createClient } from '@/lib/supabase'

interface Setting {
  id: number
  email: string
  noTelp: string
  createdAt: Date
  updatedAt: Date
}

export default function SettingsPage() {
  const router = useRouter()
  const [userRole, setUserRole] = useState<string>('ADMIN')
  const [settings, setSettings] = useState<Setting[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [editingSetting, setEditingSetting] = useState<Setting | null>(null)
  const [formData, setFormData] = useState({
    email: '',
    noTelp: ''
  })

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
        
        // Fetch settings
        const settingsResponse = await fetch('/api/settings')
        if (settingsResponse.ok) {
          const settingsData = await settingsResponse.json()
          setSettings(settingsData)
        }
      } catch (error) {
        console.error('Error fetching data:', error)
      } finally {
        setIsLoading(false)
      }
    }
    checkAuthAndFetchData()
  }, [router])

  const handleEdit = (setting: Setting) => {
    setEditingSetting(setting)
    setFormData({
      email: setting.email,
      noTelp: setting.noTelp
    })
  }

  const handleCancel = () => {
    setEditingSetting(null)
    setFormData({
      email: '',
      noTelp: ''
    })
  }

  const handleSave = async () => {
    if (!editingSetting) return
    
    setIsSaving(true)
    try {
      const response = await fetch(`/api/settings/${editingSetting.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })
      
      const data = await response.json()
      
      if (response.ok) {
        alert(data.message || 'Pengaturan berhasil diperbarui')
        // Update settings list
        setSettings(settings.map(setting => 
          setting.id === editingSetting.id 
            ? { ...setting, ...formData, updatedAt: new Date() }
            : setting
        ))
        handleCancel()
      } else {
        alert(data.error || 'Gagal memperbarui pengaturan')
      }
    } catch (error) {
      console.error('Error updating settings:', error)
      alert('Gagal memperbarui pengaturan')
    } finally {
      setIsSaving(false)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

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
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Pengaturan</h1>
        <p className="text-gray-600">Kelola pengaturan sistem seperti email dan nomor telepon.</p>
      </div>

      <div className="max-w-4xl">
        {settings.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
            <Settings className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Belum ada pengaturan</h3>
            <p className="text-gray-500">Pengaturan akan muncul di sini setelah dibuat.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {settings.map((setting) => (
              <div key={setting.id} className="bg-white rounded-xl shadow-sm border border-gray-200">
                <div className="px-6 py-4 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <Settings className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">Pengaturan Sistem</h3>
                        <p className="text-sm text-gray-600">
                          Terakhir diubah: {new Date(setting.updatedAt).toLocaleDateString('id-ID')}
                        </p>
                      </div>
                    </div>
                    <Button
                      onClick={() => handleEdit(setting)}
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      Edit
                    </Button>
                  </div>
                </div>
                
                <div className="px-6 py-4">
                  {editingSetting?.id === setting.id ? (
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                          Email
                        </Label>
                        <div className="mt-1 relative">
                          <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                          <Input
                            id="email"
                            type="email"
                            value={formData.email}
                            onChange={(e) => handleInputChange('email', e.target.value)}
                            className="pl-10"
                            placeholder="Masukkan email"
                          />
                        </div>
                      </div>
                      
                      <div>
                        <Label htmlFor="noTelp" className="text-sm font-medium text-gray-700">
                          Nomor Telepon / WhatsApp
                        </Label>
                        <div className="mt-1 relative">
                          <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                          <Input
                            id="noTelp"
                            type="tel"
                            value={formData.noTelp}
                            onChange={(e) => handleInputChange('noTelp', e.target.value)}
                            className="pl-10"
                            placeholder="Masukkan nomor telepon / WhatsApp"
                          />
                        </div>
                      </div>
                      
                      <div className="flex space-x-3 pt-4">
                        <Button
                          onClick={handleSave}
                          disabled={isSaving}
                          className="bg-green-600 hover:bg-green-700 text-white"
                        >
                          {isSaving ? (
                            <div className="flex items-center gap-2">
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                              Menyimpan...
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              <Save className="h-4 w-4" />
                              Simpan
                            </div>
                          )}
                        </Button>
                        <Button
                          onClick={handleCancel}
                          variant="outline"
                          className="border-gray-300 text-gray-700 hover:bg-gray-50"
                        >
                          Batal
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                        <Mail className="h-5 w-5 text-gray-400" />
                        <div>
                          <p className="text-sm font-medium text-gray-700">Email</p>
                          <p className="text-gray-900">{setting.email}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                        <Phone className="h-5 w-5 text-gray-400" />
                        <div>
                          <p className="text-sm font-medium text-gray-700">Nomor Telepon / WhatsApp</p>
                          <p className="text-gray-900">{setting.noTelp}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}