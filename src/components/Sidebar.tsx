'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { 
  Users, 
  Utensils, 
  LogOut,
  Menu,
  X,
  LayoutDashboard
} from 'lucide-react'
import Image from 'next/image'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'

interface SidebarProps {
  userRole: string
  pendingAdminCount?: number
  userEmail?: string
}

export default function Sidebar({ userRole, pendingAdminCount: initialPendingCount = 0, userEmail }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [pendingAdminCount, setPendingAdminCount] = useState(initialPendingCount)

  // Fetch pending admin count in real-time
  useEffect(() => {
    const fetchPendingCount = async () => {
      if (userRole === 'SUPER_ADMIN') {
        try {
          console.log('Fetching pending admin count...')
          const response = await fetch('/api/admin/pending-users')
          
          if (response.ok) {
            const pendingUsers = await response.json()
            console.log('Pending users fetched:', pendingUsers.length)
            setPendingAdminCount(pendingUsers.length)
          } else {
            const errorData = await response.json()
            console.error('Error fetching pending users:', errorData.error)
            setPendingAdminCount(0)
          }
        } catch (error) {
          console.error('Error fetching pending admin count:', error)
          setPendingAdminCount(0)
        }
      }
    }

    fetchPendingCount()
    
    // Refresh count every 30 seconds
    const interval = setInterval(fetchPendingCount, 30000)
    
    return () => clearInterval(interval)
  }, [userRole])

  const navigation = [
    {
      name: 'Dashboard',
      href: '/dashboard',
      icon: LayoutDashboard,
      current: pathname === '/dashboard'
    },
    // Only show "Kelola Admin" for SUPER_ADMIN
    ...(userRole === 'SUPER_ADMIN' ? [{
      name: 'Kelola Admin',
      href: '/dashboard/admin',
      icon: Users,
      current: pathname.startsWith('/dashboard/admin'),
      badge: pendingAdminCount
    }] : []),
    {
      name: 'Kelola Gastronomi',
      href: '/dashboard/makanan',
      icon: Utensils,
      current: pathname.startsWith('/dashboard/makanan')
    }
  ]

  const handleLogout = async () => {
    try {
      const supabase = createClient()
      await supabase.auth.signOut()
      router.push('/auth/login')
    } catch (error) {
      console.error('Error logging out:', error)
      router.push('/auth/login')
    }
  }

  return (
    <>
      {/* Mobile menu button */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="p-2 rounded-lg bg-white shadow-lg border border-gray-200 cursor-pointer"
        >
          {isMobileMenuOpen ? (
            <X className="h-6 w-6 text-gray-600" />
          ) : (
            <Menu className="h-6 w-6 text-gray-600" />
          )}
        </button>
      </div>

      {/* Sidebar */}
      <div className={cn(
        "fixed inset-y-0 left-0 z-40 w-64 transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0",
        isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="flex h-full flex-col bg-white border-r border-gray-200">
          {/* Logo Section */}
            <div className="flex justify-center items-center border-b border-gray-200 py-4">
              <Image
                src="/Dawala.png"
                alt="Dawala Logo"
                width={150}
                height={150}
                className="rounded-lg"
              />
            </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-2">
            {navigation.map((item) => {
              const Icon = item.icon
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={cn(
                    'flex items-center justify-between px-3 py-2 text-sm font-medium rounded-lg transition-colors cursor-pointer',
                    item.current
                      ? 'bg-green-100 text-green-700'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  )}
                >
                  <div className="flex items-center">
                    <Icon className={cn(
                      'mr-3 h-5 w-5',
                      item.current ? 'text-green-600' : 'text-gray-400'
                    )} />
                    {item.name}
                  </div>
                  {item.badge && item.badge > 0 && (
                    <span className="bg-orange-500 text-white text-xs font-medium px-2 py-1 rounded-full min-w-[20px] text-center">
                      {item.badge}
                    </span>
                  )}
                </Link>
              )
            })}
          </nav>

          {/* User Info & Logout Section */}
          <div className="border-t border-gray-200 p-4">
            <div className="mb-4 p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3 mb-2">
                <div className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center",
                  userRole === 'SUPER_ADMIN' ? 'bg-purple-500' : 'bg-green-500'
                )}>
                  <span className="text-white font-medium text-sm">
                    {userRole === 'SUPER_ADMIN' ? 'S' : 'A'}
                  </span>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {userRole === 'SUPER_ADMIN' ? 'Super Admin' : 'Admin'}
                  </p>
                  <p className="text-xs text-gray-500">
                    {userEmail || 'Dawala System'}
                  </p>
                </div>
              </div>
              {userRole === 'SUPER_ADMIN' && pendingAdminCount > 0 && (
                <div className="mt-2 p-2 bg-orange-100 rounded-lg">
                  <p className="text-xs text-orange-800 font-medium">
                    ⚠️ {pendingAdminCount} admin menunggu approval
                  </p>
                </div>
              )}
            </div>
            
            <button
              onClick={handleLogout}
              className="flex w-full items-center px-3 py-2 text-sm font-medium text-gray-600 rounded-lg hover:bg-gray-50 hover:text-gray-900 transition-colors cursor-pointer"
            >
              <LogOut className="mr-3 h-5 w-5 text-gray-400" />
              Log Out
            </button>
          </div>
        </div>
      </div>

      {/* Mobile overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}
    </>
  )
} 