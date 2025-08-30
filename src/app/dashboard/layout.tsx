import { createServerSupabaseClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import Sidebar from '@/components/Sidebar'
import { withPrisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/session-recovery'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Use the session recovery utility to validate authentication
  const user = await requireAuth()

  console.log('User authenticated in dashboard layout:', user.email, 'ID:', user.id)

  // Get user data with proper error handling
  let dbUser: any = null
  try {
    // Single query to find user by ID or email
    dbUser = await withPrisma(async (client) => {
      return await client.user.findFirst({
        where: {
          OR: [
            { id: user.id },
            { email: user.email! }
          ]
        },
      })
    })
    
    // If user found by email but ID doesn't match, update the ID
    if (dbUser && dbUser.id !== user.id) {
      console.log('User found by email, but ID mismatch. Supabase ID:', user.id, 'Database ID:', dbUser.id)
      try {
        dbUser = await withPrisma(async (client) => {
          return await client.user.update({
            where: { id: dbUser.id },
            data: { id: user.id },
          })
        })
        console.log('Updated user ID to match Supabase ID')
      } catch (updateError) {
        console.error('Failed to update user ID:', updateError)
        // Continue with existing user data
      }
    }
    
  } catch (error) {
    console.error('Database error in dashboard layout:', error)
    
    // If database is down, redirect to login with specific message
    redirect('/auth/login?message=Database temporarily unavailable. Please try again later.')
  }
  
  console.log('Database query result:', { 
    found: !!dbUser, 
    email: dbUser?.email, 
    role: dbUser?.role, 
    isApproved: dbUser?.isApproved 
  })
  
  if (!dbUser) {
    // User doesn't exist in database - redirect to login
    console.log('User not found in database, redirecting to login:', user.email)
    redirect('/auth/login?message=Please complete your registration first.')
  }

  // Check if admin is approved
  if (dbUser.role === 'ADMIN' && !dbUser.isApproved) {
    console.log('Unapproved admin trying to access dashboard, redirecting to login:', dbUser.email)
    redirect('/auth/login?message=Your account is still pending approval. Please wait for Super Admin to approve your registration.')
  }

  console.log('User approved, allowing access to dashboard:', dbUser.email, 'Role:', dbUser.role)

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar userRole={dbUser.role} userEmail={user.email || ''} />
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  )
} 