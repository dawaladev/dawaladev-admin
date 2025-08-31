import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createServerSupabaseClient } from '@/lib/supabase-server'

// GET - Get all settings (only for super admin)
export async function GET() {
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
      return NextResponse.json({ error: 'Forbidden: Only super admin can access settings' }, { status: 403 })
    }

    const settings = await prisma.setting.findMany({
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json(settings)
  } catch (error) {
    console.error('Error fetching settings:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST - Create new setting (only for super admin)
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
      return NextResponse.json({ error: 'Forbidden: Only super admin can create settings' }, { status: 403 })
    }

    const { email, noTelp } = await request.json()

    if (!email || !noTelp) {
      return NextResponse.json(
        { error: 'Email and no telp are required' },
        { status: 400 }
      )
    }

    const newSetting = await prisma.setting.create({
      data: {
        email,
        noTelp,
      },
    })

    return NextResponse.json({
      message: 'Setting created successfully',
      setting: newSetting
    }, { status: 201 })
  } catch (error) {
    console.error('Error creating setting:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
