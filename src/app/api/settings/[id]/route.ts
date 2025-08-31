import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createServerSupabaseClient } from '@/lib/supabase-server'

// GET - Get setting by ID (only for super admin)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
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

    const setting = await prisma.setting.findUnique({
      where: { id: parseInt(id) }
    })

    if (!setting) {
      return NextResponse.json({ error: 'Setting not found' }, { status: 404 })
    }

    return NextResponse.json(setting)
  } catch (error) {
    console.error('Error fetching setting:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PUT - Update setting by ID (only for super admin)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
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
      return NextResponse.json({ error: 'Forbidden: Only super admin can update settings' }, { status: 403 })
    }

    const { email, noTelp } = await request.json()

    if (!email || !noTelp) {
      return NextResponse.json(
        { error: 'Email and no telp are required' },
        { status: 400 }
      )
    }

    // Check if setting exists
    const existingSetting = await prisma.setting.findUnique({
      where: { id: parseInt(id) }
    })

    if (!existingSetting) {
      return NextResponse.json({ error: 'Setting not found' }, { status: 404 })
    }

    const updatedSetting = await prisma.setting.update({
      where: { id: parseInt(id) },
      data: {
        email,
        noTelp,
      },
    })

    return NextResponse.json({
      message: 'Setting updated successfully',
      setting: updatedSetting
    })
  } catch (error) {
    console.error('Error updating setting:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE - Delete setting by ID (only for super admin)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
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
      return NextResponse.json({ error: 'Forbidden: Only super admin can delete settings' }, { status: 403 })
    }

    // Check if setting exists
    const existingSetting = await prisma.setting.findUnique({
      where: { id: parseInt(id) }
    })

    if (!existingSetting) {
      return NextResponse.json({ error: 'Setting not found' }, { status: 404 })
    }

    await prisma.setting.delete({
      where: { id: parseInt(id) }
    })

    return NextResponse.json({
      message: 'Setting deleted successfully'
    })
  } catch (error) {
    console.error('Error deleting setting:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
