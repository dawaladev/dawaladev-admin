'use client'

import { useEffect, useState } from 'react'
import { X, Clock, CheckCircle } from 'lucide-react'
import { Button } from './button'

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  children?: React.ReactNode
  message?: string
  type?: 'info' | 'success' | 'warning'
  showCloseButton?: boolean
}

export default function Modal({ 
  isOpen, 
  onClose, 
  title, 
  children,
  message, 
  type = 'info',
  showCloseButton = true 
}: ModalProps) {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true)
    } else {
      setTimeout(() => setIsVisible(false), 300)
    }
  }, [isOpen])

  if (!isVisible) return null

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircle className="h-8 w-8 text-green-500" />
      case 'warning':
        return <Clock className="h-8 w-8 text-orange-500" />
      default:
        return <Clock className="h-8 w-8 text-blue-500" />
    }
  }

  const getBgColor = () => {
    switch (type) {
      case 'success':
        return 'bg-green-50 border-green-200'
      case 'warning':
        return 'bg-orange-50 border-orange-200'
      default:
        return 'bg-blue-50 border-blue-200'
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={showCloseButton ? onClose : undefined}
      />
      
      {/* Modal */}
      <div className={`
        relative w-full max-w-lg mx-4 bg-white rounded-2xl shadow-xl border
        transform transition-all duration-300 ease-out
        ${isOpen ? 'scale-100 opacity-100' : 'scale-95 opacity-0'}
      `}>
        {/* Header */}
        <div className={`px-6 py-4 border-b rounded-t-2xl ${children ? 'bg-gray-50' : getBgColor()}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {!children && getIcon()}
              <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
            </div>
            {showCloseButton && (
              <button
                onClick={onClose}
                className="p-1 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
              >
                <X className="h-5 w-5 text-gray-500" />
              </button>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="px-8 py-8">
          {children ? (
            children
          ) : (
            <p className="text-gray-700 leading-relaxed">{message}</p>
          )}
        </div>

        {/* Footer - only show if no children (for notification modals) */}
        {!children && (
          <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 rounded-b-2xl">
            <div className="flex justify-end space-x-3">
              {showCloseButton && (
                <Button
                  variant="outline"
                  onClick={onClose}
                  className="px-4 py-2"
                >
                  Tutup
                </Button>
              )}
              <Button
                onClick={() => window.location.href = '/auth/login'}
                className="px-4 py-2 bg-green-600 hover:bg-green-700"
              >
                Kembali ke Login
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
} 