import { NextRequest, NextResponse } from 'next/server'
import { withPrisma } from '@/lib/prisma'
import { createServerSupabaseClient } from '@/lib/supabase-server'

export async function GET() {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const makanan = await withPrisma(async (client) => {
      return await client.makanan.findMany({
        include: {
          jenisPaket: true
        },
        orderBy: {
          createdAt: 'desc'
        }
      })
    })

    // Parse foto URLs from JSON string
    const makananWithParsedFoto = makanan.map((item: any) => ({
      ...item,
      foto: JSON.parse(item.foto)
    }))

    return NextResponse.json(makananWithParsedFoto)
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { namaMakanan, deskripsi, deskripsiEn, foto, harga, jenisPaketId } = await request.json()

    if (!namaMakanan || !deskripsi || !foto || !harga || !jenisPaketId) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      )
    }

    // Validate jenis paket exists
    const jenisPaket = await withPrisma(async (client) => {
      return await client.jenisPaket.findUnique({
        where: { id: jenisPaketId }
      })
    })

    if (!jenisPaket) {
      return NextResponse.json(
        { error: 'Jenis paket not found' },
        { status: 400 }
      )
    }

    // Handle foto as array of URLs from Supabase Storage
    const fotoUrls = Array.isArray(foto) ? foto : [foto]
    
    // Validate that all foto URLs are from Supabase Storage
    const validUrls = fotoUrls.every(url => 
      typeof url === 'string' && 
      (url.startsWith('https://') || url.startsWith('http://'))
    )
    
    if (!validUrls) {
      return NextResponse.json(
        { error: 'Invalid foto URLs provided' },
        { status: 400 }
      )
    }
    
    const fotoJson = JSON.stringify(fotoUrls)

    const makanan = await withPrisma(async (client) => {
      return await client.makanan.create({
        data: {
          namaMakanan,
          deskripsi,
          deskripsiEn: deskripsiEn || null,
          foto: fotoJson,
          harga,
          jenisPaketId
        },
        include: {
          jenisPaket: true
        }
      })
    })

    // Return with parsed foto
    const makananWithParsedFoto = {
      ...makanan,
      foto: fotoUrls
    }

    return NextResponse.json(makananWithParsedFoto, { status: 201 })
  } catch (error) {
    console.error('Error creating makanan:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 