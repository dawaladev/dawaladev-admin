import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { withPrisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('Checking approval for user:', user.email)

    let approvedUser = null
    try {
      approvedUser = await withPrisma(async (client) => {
        return await client.user.findUnique({
          where: { email: user.email! },
        })
      })
    } catch (dbError) {
      console.error('Database error in check-approval:', dbError)
      return NextResponse.json(
        { error: 'Database temporarily unavailable. Please try again later.' },
        { status: 500 }
      )
    }

    if (approvedUser) {
      return NextResponse.json({
        found: true,
        email: approvedUser.email,
        role: approvedUser.role,
        isApproved: approvedUser.isApproved,
      })
    } else {
      return NextResponse.json({
        found: false,
        email: user.email,
        role: null,
        isApproved: false,
      })
    }
  } catch (error) {
    console.error('Error in check-approval:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 