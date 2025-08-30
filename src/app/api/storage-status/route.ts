import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { checkStorageStatus, testStorageUpload } from '@/lib/storage-status'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check storage status
    const status = await checkStorageStatus()
    
    // If bucket exists, test upload functionality
    let uploadTest = null
    if (status.bucketExists) {
      uploadTest = await testStorageUpload()
    }

    return NextResponse.json({
      status,
      uploadTest,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Storage status check error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
