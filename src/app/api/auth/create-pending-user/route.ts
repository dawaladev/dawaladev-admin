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

    const { email, name, authProvider } = await request.json()

    console.log('Creating pending user:', { email, name, authProvider })

    let existingUser = null
    try {
      existingUser = await withPrisma(async (client) => {
        return await client.user.findUnique({
          where: { email },
        })
      })
    } catch (dbError) {
      console.error('Database error checking existing user:', dbError)
      return NextResponse.json(
        { error: 'Database temporarily unavailable. Please try again later.' },
        { status: 500 }
      )
    }

    if (existingUser) {
      return NextResponse.json(
        { error: 'User already exists' },
        { status: 400 }
      )
    }

    let pendingUser = null
    try {
      pendingUser = await withPrisma(async (client) => {
        return await client.pendingUser.create({
          data: {
            email,
            name,
            authProvider,
          },
        })
      })
    } catch (dbError) {
      console.error('Database error creating pending user:', dbError)
      return NextResponse.json(
        { error: 'Database temporarily unavailable. Please try again later.' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Pending user created successfully',
      user: pendingUser,
    })
  } catch (error) {
    console.error('Error creating pending user:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 