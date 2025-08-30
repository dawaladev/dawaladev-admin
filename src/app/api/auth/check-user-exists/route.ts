import { NextRequest, NextResponse } from 'next/server'
import { withPrisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }

    console.log('Checking if user exists:', email)

    // Check if user exists in users table
    let approvedUser = null
    try {
      approvedUser = await withPrisma(async (prisma) => {
        return await prisma.user.findUnique({
          where: { email },
        })
      })
    } catch (dbError) {
      console.error('Database error checking approved user:', dbError)
      return NextResponse.json({ error: 'Database error' }, { status: 500 })
    }

    if (approvedUser) {
      console.log('User found in users table:', approvedUser.email)
      return NextResponse.json({
        exists: true,
        isPending: false,
        user: approvedUser
      })
    }

    // Check if user exists in pending_users table
    let pendingUser = null
    try {
      pendingUser = await withPrisma(async (prisma) => {
        return await prisma.pendingUser.findUnique({
          where: { email },
        })
      })
    } catch (dbError) {
      console.error('Database error checking pending user:', dbError)
      return NextResponse.json({ error: 'Database error' }, { status: 500 })
    }

    if (pendingUser) {
      console.log('User found in pending_users table:', pendingUser.email)
      return NextResponse.json({
        exists: true,
        isPending: true,
        pendingUser: pendingUser
      })
    }

    console.log('User not found in either table:', email)
    return NextResponse.json({
      exists: false,
      isPending: false
    })

  } catch (error) {
    console.error('Error checking user existence:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 