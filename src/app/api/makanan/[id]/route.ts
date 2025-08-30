import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { prisma } from '@/lib/prisma'

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

    const { id } = await params
    const makananId = parseInt(id)
    if (isNaN(makananId)) {
      return NextResponse.json({ error: 'Invalid ID' }, { status: 400 })
    }

    const makanan = await prisma.makanan.findUnique({
      where: { id: makananId },
      include: {
        jenisPaket: true
      }
    })

    if (!makanan) {
      return NextResponse.json({ error: 'Makanan not found' }, { status: 404 })
    }

    // Parse foto string to array for frontend compatibility
    const makananWithParsedFoto = {
      ...makanan,
      foto: Array.isArray(makanan.foto) ? makanan.foto : JSON.parse(makanan.foto || '[]')
    }

    return NextResponse.json(makananWithParsedFoto)
  } catch (error) {
    console.error('GET /api/makanan/[id] error:', error)
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

    const { id } = await params
    const makananId = parseInt(id)
    if (isNaN(makananId)) {
      return NextResponse.json({ error: 'Invalid ID' }, { status: 400 })
    }

    const { namaMakanan, deskripsi, deskripsiEn, foto, harga, jenisPaketId } = await request.json()

    if (!namaMakanan || !deskripsi || !foto || !harga || !jenisPaketId) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      )
    }

    // Validate foto is an array
    if (!Array.isArray(foto) || foto.length === 0) {
      return NextResponse.json(
        { error: 'Foto must be a non-empty array' },
        { status: 400 }
      )
    }

    // Validate that all foto URLs are valid URLs
    const validUrls = foto.every(url => 
      typeof url === 'string' && 
      (url.startsWith('https://') || url.startsWith('http://'))
    )
    
    if (!validUrls) {
      return NextResponse.json(
        { error: 'Invalid foto URLs provided' },
        { status: 400 }
      )
    }

    // Check if makanan exists
    const existingMakanan = await prisma.makanan.findUnique({
      where: { id: makananId }
    })
    
    if (!existingMakanan) {
      return NextResponse.json({ error: 'Makanan not found' }, { status: 404 })
    }

    // Update makanan
    const updatedMakanan = await prisma.makanan.update({
      where: { id: makananId },
      data: {
        namaMakanan,
        deskripsi,
        deskripsiEn: deskripsiEn || null,
        foto: JSON.stringify(foto),
        harga,
        jenisPaketId
      },
      include: {
        jenisPaket: true
      }
    })

    // Return with parsed foto
    const result = {
      ...updatedMakanan,
      foto: foto
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error('PUT /api/makanan/[id] error:', error)
    if (error instanceof Error && error.message.includes('Record to update not found')) {
      return NextResponse.json({ error: 'Makanan not found' }, { status: 404 })
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

    const { id } = await params
    const makananId = parseInt(id)
    if (isNaN(makananId)) {
      return NextResponse.json({ error: 'Invalid ID' }, { status: 400 })
    }

    // Check if makanan exists
    const existingMakanan = await prisma.makanan.findUnique({
      where: { id: makananId }
    })
    
    if (!existingMakanan) {
      return NextResponse.json({ error: 'Makanan not found' }, { status: 404 })
    }

    // Delete makanan
    await prisma.makanan.delete({
      where: { id: makananId }
    })

    return NextResponse.json({ message: 'Makanan deleted successfully' })
  } catch (error) {
    console.error('DELETE /api/makanan/[id] error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 