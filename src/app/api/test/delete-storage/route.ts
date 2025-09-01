import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { config } from '@/lib/config'

export async function POST(request: NextRequest) {
  try {
    const { fileName } = await request.json()
    
    if (!fileName) {
      return NextResponse.json({ error: 'fileName is required' }, { status: 400 })
    }
    
    const supabase = await createServerSupabaseClient()
    
    console.log(`🧪 Testing deletion of file: ${fileName}`)
    
    // List all files first
    const { data: allFiles, error: listError } = await supabase.storage
      .from(config.supabase.bucketName)
      .list('makanan')
    
    if (listError) {
      return NextResponse.json({ 
        error: 'Error listing files', 
        details: listError 
      }, { status: 500 })
    }
    
    console.log('📁 All files before deletion:', allFiles?.map(f => f.name) || [])
    
    // Check if file exists
    const fileExists = allFiles?.some(f => f.name === fileName)
    console.log(`📁 File "${fileName}" exists:`, fileExists)
    
    if (!fileExists) {
      return NextResponse.json({ 
        message: 'File not found in storage',
        fileName: fileName,
        allFiles: allFiles?.map(f => f.name) || []
      })
    }
    
    // Try to delete
    const filePath = `makanan/${fileName}`
    const { error: deleteError } = await supabase.storage
      .from(config.supabase.bucketName)
      .remove([filePath])
    
    if (deleteError) {
      console.error('❌ Delete error:', deleteError)
      return NextResponse.json({ 
        error: 'Delete failed', 
        details: deleteError 
      }, { status: 500 })
    }
    
    // Verify deletion
    const { data: filesAfterDelete, error: verifyError } = await supabase.storage
      .from(config.supabase.bucketName)
      .list('makanan')
    
    if (verifyError) {
      return NextResponse.json({ 
        error: 'Could not verify deletion', 
        details: verifyError 
      }, { status: 500 })
    }
    
    const stillExists = filesAfterDelete?.some(f => f.name === fileName)
    console.log(`📁 File "${fileName}" still exists after deletion:`, stillExists)
    
    return NextResponse.json({
      message: stillExists ? 'File still exists after deletion' : 'File successfully deleted',
      fileName: fileName,
      deleted: !stillExists,
      filesBefore: allFiles?.map(f => f.name) || [],
      filesAfter: filesAfterDelete?.map(f => f.name) || []
    })
    
  } catch (error) {
    console.error('Test delete error:', error)
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
