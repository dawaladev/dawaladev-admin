import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
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

    if (!dbUser || dbUser.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Get approved admins
    const approvedAdmins = await prisma.user.findMany({
      where: { 
        role: 'ADMIN',
        isApproved: true 
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(approvedAdmins)
  } catch (error) {
    console.error('Error fetching approved admins:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 