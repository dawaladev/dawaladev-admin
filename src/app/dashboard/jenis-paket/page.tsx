import { withPrisma } from '@/lib/prisma'
import JenisPaketClient from './JenisPaketClient'

export default async function JenisPaketPage() {
  const jenisPaket = await withPrisma(async (prisma) => {
    return await prisma.jenisPaket.findMany({
      include: {
        _count: {
          select: {
            makanan: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })
  })

  return <JenisPaketClient jenisPaket={jenisPaket} />
} 