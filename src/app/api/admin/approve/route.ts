import { NextRequest, NextResponse } from 'next/server'
import { withPrisma } from '@/lib/prisma'
import { createServerSupabaseClient } from '@/lib/supabase-server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if current user is super admin
    const currentUser = await withPrisma(async (client) => {
      return await client.user.findUnique({ where: { id: user.id } })
    })

    if (!currentUser || currentUser.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Forbidden: Only Super Admin can approve users' }, { status: 403 })
    }

    const { pendingUserId } = await request.json()
    
    if (!pendingUserId) {
      return NextResponse.json({ error: 'Pending user ID is required' }, { status: 400 })
    }

    console.log('Approving pending user:', pendingUserId)

    // Get pending user
    const pendingUser = await withPrisma(async (client) => {
      return await client.pendingUser.findUnique({ where: { id: pendingUserId } })
    })

    if (!pendingUser) {
      console.log('Pending user not found:', pendingUserId)
      return NextResponse.json({ error: 'Pending user not found' }, { status: 404 })
    }

    console.log('Found pending user:', pendingUser.email, 'Provider:', pendingUser.authProvider)

    // Check if user already exists in users table
    const existingUser = await withPrisma(async (client) => {
      return await client.user.findUnique({ where: { email: pendingUser.email } })
    })

    if (existingUser) {
      console.log('User already exists in users table:', existingUser.email)
      // If user exists but is not approved, approve them
      if (!existingUser.isApproved) {
        console.log('Approving existing unapproved user:', existingUser.email)
        const updatedUser = await withPrisma(async (client) => {
          const user = await client.user.update({
            where: { id: existingUser.id },
            data: { isApproved: true },
          })
          await client.pendingUser.delete({ where: { id: pendingUserId } })
          return user
        })
        return NextResponse.json({ 
          success: true, 
          message: `Pendaftaran Admin ${pendingUser.email} berhasil disetujui`,
          user: updatedUser
        })
      }
      // If user exists and is already approved, just remove from pending
      await withPrisma(async (client) => {
        await client.pendingUser.delete({ where: { id: pendingUserId } })
      })
      return NextResponse.json({ 
        success: true, 
        message: `Pendaftaran Admin ${pendingUser.email} sudah disetujui sebelumnya`,
        user: existingUser
      })
    }

    // Create new user
    const newUser = await withPrisma(async (client) => {
      const user = await client.user.create({
        data: {
          email: pendingUser.email,
          role: 'ADMIN',
          isApproved: true,
        },
      })
      await client.pendingUser.delete({ where: { id: pendingUserId } })
      return user
    })

    return NextResponse.json({ 
      success: true, 
      message: `Pendaftaran Admin ${pendingUser.email} berhasil disetujui`,
      user: newUser
    })
  } catch (error) {
    console.error('Error approving user:', error)
    return NextResponse.json({ 
      error: 'Internal server error: ' + (error as Error).message 
    }, { status: 500 })
  }
} 