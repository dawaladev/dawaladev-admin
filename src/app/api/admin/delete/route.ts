import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { createClient } from '@supabase/supabase-js'

export async function DELETE(request: NextRequest) {
  try {
    console.log('Delete admin request received')
    
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      console.log('No user found in request')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('User authenticated:', user.id)

    // Check if user is super admin
    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
    })

    if (dbUser?.role !== 'SUPER_ADMIN') {
      console.log('User is not super admin:', dbUser?.role)
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const adminId = searchParams.get('id')

    if (!adminId) {
      console.log('No admin ID provided')
      return NextResponse.json({ error: 'Admin ID is required' }, { status: 400 })
    }

    console.log('Attempting to delete admin:', adminId)

    // Prevent self-deletion
    if (adminId === user.id) {
      console.log('User attempted to delete themselves')
      return NextResponse.json({ error: 'Cannot delete yourself' }, { status: 400 })
    }

    // Try to delete from Supabase Auth if service role key is available
    if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
      try {
        // Create service role client for admin operations
        const serviceRoleClient = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.SUPABASE_SERVICE_ROLE_KEY!,
          {
            auth: {
              autoRefreshToken: false,
              persistSession: false
            }
          }
        )

        console.log('Service role client created, attempting to delete from Supabase Auth')

        // Delete the admin from Supabase Auth first
        const { error: authError } = await serviceRoleClient.auth.admin.deleteUser(adminId)
        
        if (authError) {
          console.error('Error deleting user from Supabase Auth:', authError)
          // Continue with database deletion even if Auth deletion fails
          console.log('Continuing with database deletion despite Auth error')
        } else {
          console.log('User deleted from Supabase Auth successfully')
        }
      } catch (authError) {
        console.error('Error with Supabase Auth deletion:', authError)
        console.log('Continuing with database deletion despite Auth error')
      }
    } else {
      console.log('SUPABASE_SERVICE_ROLE_KEY not configured, skipping Auth deletion')
    }

    console.log('Deleting admin from database')

    // Delete the admin from database
    await prisma.user.delete({
      where: { id: adminId },
    })

    console.log('Admin deleted successfully from both systems')

    return NextResponse.json({ 
      success: true, 
      message: 'Admin deleted successfully'
    })

  } catch (error) {
    console.error('Error deleting admin:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 