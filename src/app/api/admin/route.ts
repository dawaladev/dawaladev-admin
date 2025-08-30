import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: NextRequest) {
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
      return NextResponse.json({ error: 'Forbidden: Only super admin can create admin users' }, { status: 403 })
    }

    const { name, email, password } = await request.json()

    if (!name || !email || !password) {
      return NextResponse.json(
        { error: 'Name, email, and password are required' },
        { status: 400 }
      )
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters' },
        { status: 400 }
      )
    }

    // Create Supabase client with service role key
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Create user in Supabase Auth
    const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        name: name,
        role: 'ADMIN'
      }
    })

    if (authError) {
      return NextResponse.json(
        { error: authError.message },
        { status: 400 }
      )
    }

    // Create user in database
    if (authUser.user) {
      const newAdmin = await prisma.user.create({
        data: {
          id: authUser.user.id,
          email: email,
          role: 'ADMIN',
        },
      })

      return NextResponse.json({
        message: 'Admin created successfully',
        user: {
          id: newAdmin.id,
          email: newAdmin.email,
          role: newAdmin.role
        }
      }, { status: 201 })
    }

    return NextResponse.json(
      { error: 'Failed to create admin user' },
      { status: 500 }
    )
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 