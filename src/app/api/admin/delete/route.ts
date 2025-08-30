import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createServerSupabaseClient } from '@/lib/supabase-server'

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is super admin
    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
    })

    if (dbUser?.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const adminId = searchParams.get('id')

    if (!adminId) {
      return NextResponse.json({ error: 'Admin ID is required' }, { status: 400 })
    }

    // Prevent self-deletion
    if (adminId === user.id) {
      return NextResponse.json({ error: 'Cannot delete yourself' }, { status: 400 })
    }

    // Delete the admin
    await prisma.user.delete({
      where: { id: adminId },
    })

    return NextResponse.json({ 
      success: true, 
      message: 'Admin deleted successfully'
    })

  } catch (error) {
    console.error('Error deleting admin:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 