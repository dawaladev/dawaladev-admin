import { NextRequest, NextResponse } from 'next/server'
import { withPrisma } from '@/lib/prisma'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { deleteImageFromStorage } from '@/lib/supabase-storage'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: idParam } = await params
    const id = parseInt(idParam)
    if (isNaN(id)) {
      return NextResponse.json({ error: 'Invalid ID' }, { status: 400 })
    }

    const jenisPaket = await withPrisma(async (prisma) => {
      return await prisma.jenisPaket.findUnique({
        where: { id },
        include: {
          makanan: true
        }
      })
    })

    if (!jenisPaket) {
      return NextResponse.json({ error: 'Jenis paket not found' }, { status: 404 })
    }

    return NextResponse.json(jenisPaket)
  } catch (error) {
    console.error('Error fetching jenis paket:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: idParam } = await params
    const id = parseInt(idParam)
    if (isNaN(id)) {
      return NextResponse.json({ error: 'Invalid ID' }, { status: 400 })
    }

    const { namaPaket, namaPaketEn } = await request.json()

    if (!namaPaket) {
      return NextResponse.json(
        { error: 'Nama paket is required' },
        { status: 400 }
      )
    }

    const jenisPaket = await withPrisma(async (prisma) => {
      return await prisma.jenisPaket.update({
        where: { id },
        data: { 
          namaPaket,
          namaPaketEn: namaPaketEn || null
        }
      })
    })

    return NextResponse.json(jenisPaket)
  } catch (error) {
    console.error('Error updating jenis paket:', error)
    if (error instanceof Error && error.message.includes('Record to update not found')) {
      return NextResponse.json({ error: 'Jenis paket not found' }, { status: 404 })
    }
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: idParam } = await params
    const id = parseInt(idParam)
    if (isNaN(id)) {
      return NextResponse.json({ error: 'Invalid ID' }, { status: 400 })
    }

    // Check if jenis paket has associated makanan and get their images
    const jenisPaket = await withPrisma(async (prisma) => {
      return await prisma.jenisPaket.findUnique({
        where: { id },
        include: {
          makanan: {
            select: {
              id: true,
              foto: true
            }
          },
          _count: {
            select: {
              makanan: true
            }
          }
        }
      })
    })

    if (!jenisPaket) {
      return NextResponse.json({ error: 'Jenis paket not found' }, { status: 404 })
    }

    if (jenisPaket._count.makanan > 0) {
      return NextResponse.json(
        { error: 'Cannot delete jenis paket that has associated makanan' },
        { status: 400 }
      )
    }

    // Delete images from storage for all associated makanan before deleting jenis paket
    if (jenisPaket.makanan.length > 0) {
      console.log(`Deleting images for ${jenisPaket.makanan.length} makanan in jenis paket ID: ${id}`)
      
      const allImageDeletePromises: Promise<void>[] = []
      
      jenisPaket.makanan.forEach((makanan) => {
        try {
          // Parse foto URLs from each makanan
          let fotoUrls: string[] = []
          if (makanan.foto) {
            fotoUrls = Array.isArray(makanan.foto) 
              ? makanan.foto 
              : JSON.parse(makanan.foto || '[]')
          }
          
          // Create delete promises for each image
          fotoUrls.forEach((url) => {
            const deletePromise = (async () => {
              try {
                // Extract file path from URL
                const urlParts = url.split('/')
                const fileName = urlParts[urlParts.length - 1]
                const filePath = `makanan/${fileName}`
                
                const deleted = await deleteImageFromStorage(filePath)
                if (deleted) {
                  console.log(`Successfully deleted image: ${filePath}`)
                } else {
                  console.warn(`Failed to delete image: ${filePath}`)
                }
              } catch (error) {
                console.error(`Error deleting image ${url}:`, error)
              }
            })()
            
            allImageDeletePromises.push(deletePromise)
          })
        } catch (error) {
          console.error(`Error parsing foto for makanan ID ${makanan.id}:`, error)
        }
      })
      
      // Wait for all image deletions to complete
      await Promise.all(allImageDeletePromises)
    }

    // Delete jenis paket from database (this will cascade delete all associated makanan)
    await withPrisma(async (prisma) => {
      await prisma.jenisPaket.delete({
        where: { id }
      })
    })

    return NextResponse.json({ message: 'Jenis paket deleted successfully' })
  } catch (error) {
    console.error('Error deleting jenis paket:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 