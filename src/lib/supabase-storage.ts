import { createServerSupabaseClient } from './supabase-server'
import { config } from './config'
import { SupabaseClient } from '@supabase/supabase-js'

export interface UploadResult {
  url: string
  path: string
  error?: string
}

export async function uploadImageToStorage(
  file: File,
  folder: string = 'makanan'
): Promise<UploadResult> {
  try {
    const supabase = await createServerSupabaseClient()
    
    console.log('Uploading to bucket:', config.supabase.bucketName)
    console.log('File details:', { name: file.name, size: file.size, type: file.type })
    
    // Generate unique filename
    const timestamp = Date.now()
    const randomString = Math.random().toString(36).substring(2, 15)
    const fileExtension = file.name.split('.').pop()
    const fileName = `${timestamp}-${randomString}.${fileExtension}`
    const filePath = `${folder}/${fileName}`

    console.log('Generated file path:', filePath)

    // Upload file to Supabase Storage
    const { data, error } = await supabase.storage
      .from(config.supabase.bucketName)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      })

    if (error) {
      console.error('Upload error:', error)
      return {
        url: '',
        path: '',
        error: error.message
      }
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from(config.supabase.bucketName)
      .getPublicUrl(filePath)

    return {
      url: urlData.publicUrl,
      path: filePath
    }
  } catch (error) {
    console.error('Storage upload error:', error)
    return {
      url: '',
      path: '',
      error: 'Failed to upload image'
    }
  }
}

export async function deleteImageFromStorage(filePath: string): Promise<boolean> {
  try {
    const supabase = await createServerSupabaseClient()
    
    const { error } = await supabase.storage
      .from(config.supabase.bucketName)
      .remove([filePath])

    if (error) {
      console.error('Delete error:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('Storage delete error:', error)
    return false
  }
}

export async function uploadMultipleImages(
  files: File[],
  folder: string = 'makanan'
): Promise<UploadResult[]> {
  const results: UploadResult[] = []
  
  for (const file of files) {
    const result = await uploadImageToStorage(file, folder)
    results.push(result)
  }
  
  return results
}

export async function uploadMultipleImagesWithServiceRole(
  files: File[],
  folder: string = 'makanan',
  serviceRoleClient: SupabaseClient
): Promise<UploadResult[]> {
  const results: UploadResult[] = []
  
  for (const file of files) {
    const result = await uploadImageToStorageWithServiceRole(file, folder, serviceRoleClient)
    results.push(result)
  }
  
  return results
}

export async function uploadImageToStorageWithServiceRole(
  file: File,
  folder: string = 'makanan',
  serviceRoleClient: SupabaseClient
): Promise<UploadResult> {
  try {
    console.log('Uploading to bucket:', config.supabase.bucketName)
    console.log('File details:', { name: file.name, size: file.size, type: file.type })
    
    // Generate unique filename
    const timestamp = Date.now()
    const randomString = Math.random().toString(36).substring(2, 15)
    const fileExtension = file.name.split('.').pop()
    const fileName = `${timestamp}-${randomString}.${fileExtension}`
    const filePath = `${folder}/${fileName}`

    console.log('Generated file path:', filePath)

    // Upload file to Supabase Storage using service role client
    const { data, error } = await serviceRoleClient.storage
      .from(config.supabase.bucketName)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      })

    if (error) {
      console.error('Upload error:', error)
      return {
        url: '',
        path: '',
        error: error.message
      }
    }

    // Get public URL
    const { data: urlData } = serviceRoleClient.storage
      .from(config.supabase.bucketName)
      .getPublicUrl(filePath)

    return {
      url: urlData.publicUrl,
      path: filePath
    }
  } catch (error) {
    console.error('Storage upload error:', error)
    return {
      url: '',
      path: '',
      error: 'Failed to upload image'
    }
  }
}
