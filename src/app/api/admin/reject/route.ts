import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createServerSupabaseClient } from '@/lib/supabase-server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if current user is super admin
    const currentUser = await prisma.user.findUnique({
      where: { id: user.id },
    })

    if (!currentUser || currentUser.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Forbidden: Only Super Admin can reject users' }, { status: 403 })
    }

    const { pendingUserId } = await request.json()
    
    if (!pendingUserId) {
      return NextResponse.json({ error: 'Pending user ID is required' }, { status: 400 })
    }

    // Get pending user
    const pendingUser = await prisma.pendingUser.findUnique({
      where: { id: pendingUserId },
    })

    if (!pendingUser) {
      return NextResponse.json({ error: 'Pending user not found' }, { status: 404 })
    }

    // Delete from pending_users table
    await prisma.pendingUser.delete({
      where: { id: pendingUserId },
    })

    return NextResponse.json({ 
      success: true, 
      message: `Pendaftaran Admin ${pendingUser.email} berhasil ditolak`,
    })
  } catch (error) {
    console.error('Error rejecting user:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 