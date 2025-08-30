'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { CheckCircle, XCircle, Edit, Trash2, Loader2 } from 'lucide-react'

interface AdminActionsProps {
  adminId: string
  adminEmail: string
  type: 'pending' | 'approved'
  onSuccess: () => void
}

export default function AdminActions({ adminId, adminEmail, type, onSuccess }: AdminActionsProps) {
  const [isLoading, setIsLoading] = useState<string | null>(null)

  const handleAction = async (action: 'approve' | 'reject' | 'delete') => {
    setIsLoading(action)
    
    try {
      let response: Response
      
      if (action === 'approve') {
        response = await fetch('/api/admin/approve', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ pendingUserId: adminId }),
        })
      } else if (action === 'reject') {
        response = await fetch('/api/admin/reject', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ pendingUserId: adminId }),
        })
      } else {
        response = await fetch(`/api/admin/delete?id=${adminId}`, {
          method: 'DELETE',
        })
      }

      const data = await response.json()

      if (response.ok) {
        // Show success message
        alert(data.message)
        onSuccess() // Refresh the page data
      } else {
        alert(data.error || 'Terjadi kesalahan')
      }
    } catch (error) {
      console.error('Error:', error)
      alert('Terjadi kesalahan saat memproses permintaan')
    } finally {
      setIsLoading(null)
    }
  }

  if (type === 'pending') {
    return (
      <div className="flex space-x-2">
        <Button 
          size="sm" 
          className="bg-green-600 hover:bg-green-700"
          onClick={() => handleAction('approve')}
          disabled={isLoading === 'approve'}
        >
          {isLoading === 'approve' ? (
            <Loader2 className="h-4 w-4 mr-1 animate-spin" />
          ) : (
            <CheckCircle className="h-4 w-4 mr-1" />
          )}
          Setujui
        </Button>
        <Button 
          size="sm" 
          variant="destructive"
          onClick={() => {
            if (confirm(`Yakin ingin menolak ${adminEmail}?`)) {
              handleAction('reject')
            }
          }}
          disabled={isLoading === 'reject'}
        >
          {isLoading === 'reject' ? (
            <Loader2 className="h-4 w-4 mr-1 animate-spin" />
          ) : (
            <XCircle className="h-4 w-4 mr-1" />
          )}
          Tolak
        </Button>
      </div>
    )
  }

  return (
    <div className="flex space-x-2">
      <Button 
        size="sm" 
        variant="outline"
        onClick={() => alert('Fitur edit belum tersedia')}
      >
        <Edit className="h-4 w-4 mr-1" />
        Edit
      </Button>
      <Button 
        size="sm" 
        variant="destructive"
        onClick={() => {
          if (confirm(`Yakin ingin menghapus ${adminEmail}?`)) {
            handleAction('delete')
          }
        }}
        disabled={isLoading === 'delete'}
      >
        {isLoading === 'delete' ? (
          <Loader2 className="h-4 w-4 mr-1 animate-spin" />
        ) : (
          <Trash2 className="h-4 w-4 mr-1" />
        )}
        Hapus
      </Button>
    </div>
  )
} 