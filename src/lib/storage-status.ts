import { createServerSupabaseClient } from './supabase-server'
import { config } from './config'

export interface StorageStatus {
  bucketExists: boolean
  bucketName: string
  isPublic: boolean
  error?: string
}

export async function checkStorageStatus(): Promise<StorageStatus> {
  try {
    const supabase = await createServerSupabaseClient()
    
    // Check if bucket exists
    const { data: buckets, error: listError } = await supabase.storage.listBuckets()
    
    if (listError) {
      return {
        bucketExists: false,
        bucketName: config.supabase.bucketName,
        isPublic: false,
        error: `Failed to list buckets: ${listError.message}`
      }
    }

    const imagesBucket = buckets?.find(bucket => bucket.name === config.supabase.bucketName)
    
    if (!imagesBucket) {
      return {
        bucketExists: false,
        bucketName: config.supabase.bucketName,
        isPublic: false,
        error: `Bucket "${config.supabase.bucketName}" not found`
      }
    }

    return {
      bucketExists: true,
      bucketName: config.supabase.bucketName,
      isPublic: imagesBucket.public || false
    }
  } catch (error) {
    return {
      bucketExists: false,
      bucketName: config.supabase.bucketName,
      isPublic: false,
      error: `Storage check failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    }
  }
}

export async function testStorageUpload(): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createServerSupabaseClient()
    
    // Create a simple test file
    const testContent = 'test'
    const testFile = new Blob([testContent], { type: 'text/plain' })
    const testFileName = `test-${Date.now()}.txt`
    
    // Try to upload test file
    const { error: uploadError } = await supabase.storage
      .from(config.supabase.bucketName)
      .upload(`test/${testFileName}`, testFile)
    
    if (uploadError) {
      return {
        success: false,
        error: `Upload test failed: ${uploadError.message}`
      }
    }
    
    // Try to delete test file
    const { error: deleteError } = await supabase.storage
      .from(config.supabase.bucketName)
      .remove([`test/${testFileName}`])
    
    if (deleteError) {
      console.warn('Test file cleanup failed:', deleteError)
      // Don't fail the test for cleanup issues
    }
    
    return { success: true }
  } catch (error) {
    return {
      success: false,
      error: `Storage test failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    }
  }
}
