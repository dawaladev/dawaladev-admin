import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const type = searchParams.get('type')
  const error = searchParams.get('error')
  const errorDescription = searchParams.get('error_description')

  console.log('Email confirmation request:', { 
    code: code?.substring(0, 10) + '...', 
    type,
    error,
    errorDescription,
    fullUrl: request.url
  })

  // Handle error cases from Supabase
  if (error) {
    console.error('Email confirmation error from Supabase:', { error, errorDescription })
    return NextResponse.redirect(`${origin}/auth/login?message=Email confirmation failed: ${errorDescription || error}`)
  }

  if (!code) {
    console.log('No code provided')
    return NextResponse.redirect(`${origin}/auth/login?message=Invalid confirmation link`)
  }

  try {
    const supabase = await createServerSupabaseClient()
    
    // For email confirmation, we need to handle the confirmation differently
    // Since the code might be an OAuth code or email confirmation token
    let data, verifyError
    
    try {
      // Try to exchange code for session (for OAuth flows)
      const result = await supabase.auth.exchangeCodeForSession(code)
      data = result.data
      verifyError = result.error
    } catch (exchangeError) {
      console.log('Exchange failed, trying alternative approach...')
      // If exchange fails, try to get user from session
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        data = { user }
        verifyError = null
      } else {
        verifyError = exchangeError as any
      }
    }

    if (verifyError) {
      console.error('Email confirmation error:', verifyError)
      return NextResponse.redirect(`${origin}/auth/login?message=Email confirmation failed: ${verifyError.message}`)
    }

    if (!data || !data.user) {
      console.error('No user data returned from verification')
      return NextResponse.redirect(`${origin}/auth/login?message=Email confirmation failed: No user data`)
    }

    console.log('Email confirmed for user:', data.user.email)

    // Check if user already exists in users table
    const existingUser = await prisma.user.findUnique({
      where: { id: data.user.id },
    })

    if (existingUser) {
      console.log('User already exists in users table:', existingUser.email)
      return NextResponse.redirect(`${origin}/auth/login?message=Email confirmed! Please wait for Super Admin approval.`)
    }

    // Check if user already exists in pending_users table
    const existingPendingUser = await prisma.pendingUser.findUnique({
      where: { email: data.user.email! },
    })

    if (existingPendingUser) {
      console.log('User already exists in pending_users table:', existingPendingUser.email)
      return NextResponse.redirect(`${origin}/auth/login?message=Email confirmed! Please wait for Super Admin approval.`)
    }

    // Create new pending user
    console.log('Creating new pending user:', data.user.email)
    
    try {
      const pendingUser = await prisma.pendingUser.create({
        data: {
          email: data.user.email!,
          name: data.user.user_metadata?.name || data.user.email!.split('@')[0],
          authProvider: 'email',
        },
      })

      console.log('New pending user created successfully:', pendingUser.email)
      return NextResponse.redirect(`${origin}/auth/login?message=Email confirmed! Please wait for Super Admin approval.`)
    } catch (dbError) {
      console.error('Database error creating pending user:', dbError)
      return NextResponse.redirect(`${origin}/auth/login?message=Email confirmed but database error occurred. Please contact admin.`)
    }

  } catch (error) {
    console.error('Unexpected error in email confirmation:', error)
    return NextResponse.redirect(`${origin}/auth/login?message=Email confirmation failed. Please try again.`)
  }
} 