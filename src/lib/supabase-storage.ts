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
    const { error } = await supabase.storage
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
    const { error } = await serviceRoleClient.storage
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

export async function cleanupOrphanedImages(): Promise<{
  deletedFiles: string[]
  errors: string[]
  totalDeleted: number
}> {
  try {
    const supabase = await createServerSupabaseClient()
    
    // Get all files in the makanan folder
    const { data: files, error: listError } = await supabase.storage
      .from(config.supabase.bucketName)
      .list('makanan')
    
    if (listError) {
      console.error('Error listing files:', listError)
      return { deletedFiles: [], errors: [listError.message], totalDeleted: 0 }
    }
    
    if (!files || files.length === 0) {
      return { deletedFiles: [], errors: [], totalDeleted: 0 }
    }
    
    // Get all foto URLs from database
    const { prisma } = await import('@/lib/prisma')
    const allMakanan = await prisma.makanan.findMany({
      select: { foto: true }
    })
    
    // Extract all file names from database
    const usedFileNames = new Set<string>()
    allMakanan.forEach(makanan => {
      try {
        const fotoUrls = Array.isArray(makanan.foto) 
          ? makanan.foto 
          : JSON.parse(makanan.foto || '[]')
        
        fotoUrls.forEach((url: string) => {
          if (url && typeof url === 'string') {
            const urlParts = url.split('/')
            const fileName = urlParts[urlParts.length - 1]
            if (fileName) {
              usedFileNames.add(fileName)
            }
          }
        })
      } catch (error) {
        console.error('Error parsing foto:', error)
      }
    })
    
    // Find orphaned files (files in storage but not in database)
    const orphanedFiles = files.filter(file => 
      file.name && !usedFileNames.has(file.name)
    )
    
    if (orphanedFiles.length === 0) {
      return { deletedFiles: [], errors: [], totalDeleted: 0 }
    }
    
    // Delete orphaned files
    const filePaths = orphanedFiles.map(file => `makanan/${file.name}`)
    const { error: deleteError } = await supabase.storage
      .from(config.supabase.bucketName)
      .remove(filePaths)
    
    if (deleteError) {
      console.error('Error deleting orphaned files:', deleteError)
      return { 
        deletedFiles: [], 
        errors: [deleteError.message], 
        totalDeleted: 0 
      }
    }
    
    const deletedFileNames = orphanedFiles.map(file => file.name).filter(Boolean)
    console.log(`Successfully deleted ${deletedFileNames.length} orphaned files:`, deletedFileNames)
    
    return {
      deletedFiles: deletedFileNames,
      errors: [],
      totalDeleted: deletedFileNames.length
    }
    
  } catch (error) {
    console.error('Storage cleanup error:', error)
    return {
      deletedFiles: [],
      errors: [error instanceof Error ? error.message : 'Unknown error'],
      totalDeleted: 0
    }
  }
}