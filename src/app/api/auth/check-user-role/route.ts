import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    console.log('Checking user role...')
    
    const supabase = await createServerSupabaseClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError) {
      console.error('Auth error in check-user-role:', authError)
      return NextResponse.json({ error: 'Authentication error' }, { status: 401 })
    }

    if (!user) {
      console.log('No user found in check-user-role')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('User found in check-user-role:', user.email)

    // Check if user exists in database
    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
    })

    if (!dbUser) {
      console.log('User not found in database:', user.email)
      return NextResponse.json({ role: 'ADMIN', message: 'User not found in database' })
    }

    console.log('User role found:', dbUser.role)
    return NextResponse.json({ role: dbUser.role, email: user.email })
  } catch (error) {
    console.error('Error checking user role:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 