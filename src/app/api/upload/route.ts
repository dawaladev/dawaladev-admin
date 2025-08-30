import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { uploadMultipleImages, uploadMultipleImagesWithServiceRole } from '@/lib/supabase-storage'
import { checkStorageStatus } from '@/lib/storage-status'
import { config } from '@/lib/config'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: NextRequest) {
  try {
    console.log('Upload API called')
    
    const supabase = await createServerSupabaseClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError) {
      console.error('Auth error:', authError)
      return NextResponse.json({ error: 'Authentication error' }, { status: 401 })
    }

    if (!user) {
      console.error('No user found')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('User authenticated:', user.email)

    // Auto-create bucket if it doesn't exist
    const storageStatus = await checkStorageStatus()
    if (!storageStatus.bucketExists) {
      console.log('Bucket not found, creating automatically...')
      try {
        // Check if service role key is available
        if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
          console.error('SUPABASE_SERVICE_ROLE_KEY not found')
          return NextResponse.json(
            { error: 'Service role key not configured. Please add SUPABASE_SERVICE_ROLE_KEY to environment variables.' },
            { status: 500 }
          )
        }

        // Use service role client to create bucket (bypasses RLS)
        const serviceRoleClient = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.SUPABASE_SERVICE_ROLE_KEY!,
          {
            auth: {
              autoRefreshToken: false,
              persistSession: false
            }
          }
        )
        
        const { data: bucket, error: createError } = await serviceRoleClient.storage.createBucket(config.supabase.bucketName, {
          public: true
        })
        
        if (createError && !createError.message?.includes('already exists')) {
          console.error('Error creating bucket:', createError)
          return NextResponse.json(
            { error: 'Failed to create storage bucket automatically' },
            { status: 500 }
          )
        }
        
        console.log('Bucket created successfully or already exists')
      } catch (error) {
        console.error('Error in auto bucket creation:', error)
        return NextResponse.json(
          { error: 'Failed to setup storage automatically' },
          { status: 500 }
        )
      }
    }

    const formData = await request.formData()
    const files = formData.getAll('files') as File[]
    
    console.log('Files received:', files.length)
    
    if (!files || files.length === 0) {
      console.error('No files provided')
      return NextResponse.json(
        { error: 'No files provided' },
        { status: 400 }
      )
    }

    // Validate files
    for (const file of files) {
      console.log('Processing file:', file.name, 'Size:', file.size, 'Type:', file.type)
      
      // Validate file type
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
      if (!validTypes.includes(file.type)) {
        console.error('Invalid file type:', file.type)
        return NextResponse.json(
          { error: `Invalid file type: ${file.type}. Allowed types: ${validTypes.join(', ')}` },
          { status: 400 }
        )
      }

      // Validate file size (5MB limit)
      if (file.size > 5 * 1024 * 1024) {
        console.error('File too large:', file.size)
        return NextResponse.json(
          { error: `File ${file.name} is too large. Maximum size is 5MB` },
          { status: 400 }
        )
      }
    }

    // Upload files to Supabase Storage using service role client
    const serviceRoleClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )
    
    const uploadResults = await uploadMultipleImagesWithServiceRole(files, 'makanan', serviceRoleClient)
    
    // Check for upload errors
    const errors = uploadResults.filter((result: any) => result.error)
    if (errors.length > 0) {
      console.error('Upload errors:', errors)
      return NextResponse.json(
        { error: 'Some files failed to upload', details: errors },
        { status: 500 }
      )
    }

    // Extract URLs and paths
    const uploadedFiles = uploadResults.map((result: any) => ({
      url: result.url,
      path: result.path
    }))
    
    console.log('All files uploaded successfully:', uploadedFiles.length)

    return NextResponse.json({ 
      files: uploadedFiles,
      message: 'Files uploaded successfully' 
    })

  } catch (error) {
    console.error('Upload API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
