import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { cleanupOrphanedImages } from '@/lib/supabase-storage'

export async function POST() {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is admin
    const { prisma } = await import('@/lib/prisma')
    const userRecord = await prisma.user.findUnique({
      where: { id: user.id }
    })

    if (!userRecord || userRecord.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 })
    }

    console.log('Starting storage cleanup...')
    const result = await cleanupOrphanedImages()

    return NextResponse.json({
      message: 'Storage cleanup completed',
      ...result
    })

  } catch (error) {
    console.error('Storage cleanup API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET() {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is admin
    const { prisma } = await import('@/lib/prisma')
    const userRecord = await prisma.user.findUnique({
      where: { id: user.id }
    })

    if (!userRecord || userRecord.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 })
    }

    // Just return info about what cleanup would do without actually doing it
    const supabaseClient = await createServerSupabaseClient()
    const { config } = await import('@/lib/config')
    
    const { data: files, error: listError } = await supabaseClient.storage
      .from(config.supabase.bucketName)
      .list('makanan')
    
    if (listError) {
      return NextResponse.json({ error: listError.message }, { status: 500 })
    }

    // Get all foto URLs from database
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
    
    // Find orphaned files
    const orphanedFiles = files?.filter(file => 
      file.name && !usedFileNames.has(file.name)
    ) || []

    return NextResponse.json({
      totalFiles: files?.length || 0,
      usedFiles: usedFileNames.size,
      orphanedFiles: orphanedFiles.length,
      orphanedFileNames: orphanedFiles.map(f => f.name)
    })

  } catch (error) {
    console.error('Storage cleanup info API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
