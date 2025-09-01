import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { config } from '@/lib/config'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    
    // Get all files in the makanan folder
    const { data: files, error: listError } = await supabase.storage
      .from(config.supabase.bucketName)
      .list('makanan')
    
    if (listError) {
      return NextResponse.json({ 
        error: 'Error listing files', 
        details: listError 
      }, { status: 500 })
    }
    
    // Get all foto URLs from database
    const { prisma } = await import('@/lib/prisma')
    const allMakanan = await prisma.makanan.findMany({
      select: { 
        id: true,
        namaMakanan: true,
        foto: true 
      }
    })
    
    // Extract all file names from database
    const usedFileNames = new Set<string>()
    const makananWithPhotos = allMakanan.map(makanan => {
      let fotoUrls: string[] = []
      try {
        if (makanan.foto) {
          fotoUrls = Array.isArray(makanan.foto) 
            ? makanan.foto 
            : JSON.parse(makanan.foto || '[]')
        }
      } catch (error) {
        console.error('Error parsing foto for makanan ID', makanan.id, ':', error)
      }
      
      // Extract file names
      fotoUrls.forEach((url: string) => {
        if (url && typeof url === 'string') {
          const urlParts = url.split('/')
          const fileName = urlParts[urlParts.length - 1]
          if (fileName) {
            usedFileNames.add(fileName)
          }
        }
      })
      
      return {
        id: makanan.id,
        namaMakanan: makanan.namaMakanan,
        fotoUrls: fotoUrls,
        fileNames: fotoUrls.map(url => {
          const urlParts = url.split('/')
          return urlParts[urlParts.length - 1]
        }).filter(Boolean)
      }
    })
    
    // Find orphaned files
    const orphanedFiles = files?.filter(file => 
      file.name && !usedFileNames.has(file.name)
    ) || []
    
    return NextResponse.json({
      bucketName: config.supabase.bucketName,
      totalFilesInStorage: files?.length || 0,
      totalMakananInDatabase: allMakanan.length,
      usedFileNames: Array.from(usedFileNames),
      orphanedFiles: orphanedFiles.map(f => f.name),
      makananDetails: makananWithPhotos,
      storageFiles: files?.map(f => f.name) || []
    })
    
  } catch (error) {
    console.error('Debug storage error:', error)
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
