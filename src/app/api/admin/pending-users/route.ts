import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    console.log('Fetching pending users...')
    
    const supabase = await createServerSupabaseClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError) {
      console.error('Auth error:', authError)
      return NextResponse.json({ error: 'Authentication error' }, { status: 401 })
    }

    if (!user) {
      console.log('No user found')
      return NextResponse.json({ error: 'Unauthorized - No user' }, { status: 401 })
    }

    console.log('User authenticated:', user.email)

    // Check if user is super admin
    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
    })

    if (!dbUser) {
      console.log('User not found in database:', user.email)
      return NextResponse.json({ error: 'User not found in database' }, { status: 403 })
    }

    if (dbUser.role !== 'SUPER_ADMIN') {
      console.log('User is not super admin:', user.email, 'Role:', dbUser.role)
      return NextResponse.json({ error: 'Forbidden - Not super admin' }, { status: 403 })
    }

    console.log('Super admin authenticated, fetching pending users...')

    // Get pending users
    const pendingUsers = await prisma.pendingUser.findMany({
      orderBy: { createdAt: 'desc' },
    })

    console.log('Found pending users:', pendingUsers.length)
    return NextResponse.json(pendingUsers)
  } catch (error) {
    console.error('Error fetching pending users:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 