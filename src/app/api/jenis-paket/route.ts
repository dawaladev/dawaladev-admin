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

    const jenisPaket = await withPrisma(async (client) => {
      return await client.jenisPaket.findMany({
        orderBy: {
          createdAt: 'desc'
        }
      })
    })

    return NextResponse.json(jenisPaket)
  } catch (error) {
    console.error('Error fetching jenis paket:', error)
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

    const { namaPaket, namaPaketEn } = await request.json()

    if (!namaPaket) {
      return NextResponse.json(
        { error: 'Nama paket is required' },
        { status: 400 }
      )
    }

    const jenisPaket = await withPrisma(async (client) => {
      return await client.jenisPaket.create({
        data: {
          namaPaket,
          namaPaketEn: namaPaketEn || null
        }
      })
    })

    return NextResponse.json(jenisPaket, { status: 201 })
  } catch (error) {
    console.error('Error creating jenis paket:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 