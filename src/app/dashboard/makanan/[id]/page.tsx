import { createServerSupabaseClient } from '@/lib/supabase-server'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Edit, Trash2 } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import { MultiLangText, MultiLangDescription } from '@/components/MultiLangText'

export default async function MakananDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const supabase = await createServerSupabaseClient()
  
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  const { id } = await params
  const makananId = parseInt(id)

  const makanan = await prisma.makanan.findUnique({
    where: { id: makananId },
    include: {
      jenisPaket: true,
    },
  })

  if (!makanan) {
    redirect('/dashboard/makanan')
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link href="/dashboard/makanan">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Kembali
            </Button>
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Detail Makanan</h1>
        </div>
        <div className="flex space-x-2">
          <Link href={`/dashboard/makanan/${makananId}/edit`}>
            <Button>
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Button>
          </Link>
          <Link href={`/dashboard/makanan/${makananId}/delete`}>
            <Button variant="destructive">
              <Trash2 className="h-4 w-4 mr-2" />
              Hapus
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div>
          <Image
            src={makanan.foto || '/placeholder-food.jpg'}
            alt={makanan.namaMakanan}
            width={400}
            height={300}
            className="rounded-lg object-cover w-full"
          />
        </div>
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{makanan.namaMakanan}</h2>
            <MultiLangText
              textEn={makanan.jenisPaket.namaPaketEn}
              defaultText={makanan.jenisPaket.namaPaket}
              className="text-lg text-gray-600"
              showLanguageToggle={true}
            />
          </div>
          
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Deskripsi</h3>
            <MultiLangDescription
              textEn={makanan.deskripsiEn}
              defaultText={makanan.deskripsi}
              className="text-gray-600"
              showLanguageToggle={true}
            />
          </div>

          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Harga</h3>
            <p className="text-2xl font-bold text-green-600">
              Rp {makanan.harga.toLocaleString()}
            </p>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Informasi</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">ID:</span>
                <span className="font-medium">{makanan.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Dibuat:</span>
                <span className="font-medium">
                  {new Date(makanan.createdAt).toLocaleDateString('id-ID')}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Terakhir Diupdate:</span>
                <span className="font-medium">
                  {new Date(makanan.updatedAt).toLocaleDateString('id-ID')}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 