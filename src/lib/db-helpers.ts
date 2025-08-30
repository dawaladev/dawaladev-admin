import { withPrisma } from './prisma'

// Helper function for user operations
export async function findUserByEmail(email: string) {
  return await withPrisma(async (client) => {
    return await client.user.findUnique({
      where: { email }
    })
  })
}

// Helper function for user operations
export async function findUserById(id: string) {
  return await withPrisma(async (client) => {
    return await client.user.findUnique({
      where: { id }
    })
  })
}

// Helper function for creating users
export async function createUser(userData: any) {
  return await withPrisma(async (client) => {
    return await client.user.create({
      data: userData
    })
  })
}

// Helper function for updating users
export async function updateUser(id: string, userData: any) {
  return await withPrisma(async (client) => {
    return await client.user.update({
      where: { id },
      data: userData
    })
  })
}

// Helper function for makanan operations
export async function findMakananById(id: string) {
  return await withPrisma(async (client) => {
    return await client.makanan.findUnique({
      where: { id: parseInt(id) },
      include: {
        jenisPaket: true
      }
    })
  })
}

// Helper function for getting all makanan
export async function getAllMakanan() {
  return await withPrisma(async (client) => {
    return await client.makanan.findMany({
      include: {
        jenisPaket: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    })
  })
}

// Helper function for creating makanan
export async function createMakanan(makananData: any) {
  return await withPrisma(async (client) => {
    return await client.makanan.create({
      data: makananData,
      include: {
        jenisPaket: true
      }
    })
  })
}

// Helper function for updating makanan
export async function updateMakanan(id: string, makananData: any) {
  return await withPrisma(async (client) => {
    return await client.makanan.update({
      where: { id: parseInt(id) },
      data: makananData,
      include: {
        jenisPaket: true
      }
    })
  })
}

// Helper function for deleting makanan
export async function deleteMakanan(id: string) {
  return await withPrisma(async (client) => {
    return await client.makanan.delete({
      where: { id: parseInt(id) }
    })
  })
}

// Helper function for jenis paket operations
export async function getAllJenisPaket() {
  return await withPrisma(async (client) => {
    return await client.jenisPaket.findMany({
      orderBy: {
        namaPaket: 'asc'
      }
    })
  })
}

// Helper function for creating jenis paket
export async function createJenisPaket(jenisPaketData: any) {
  return await withPrisma(async (client) => {
    return await client.jenisPaket.create({
      data: jenisPaketData
    })
  })
}

// Helper function for updating jenis paket
export async function updateJenisPaket(id: string, jenisPaketData: any) {
  return await withPrisma(async (client) => {
    return await client.jenisPaket.update({
      where: { id: parseInt(id) },
      data: jenisPaketData
    })
  })
}

// Helper function for deleting jenis paket
export async function deleteJenisPaket(id: string) {
  return await withPrisma(async (client) => {
    return await client.jenisPaket.delete({
      where: { id: parseInt(id) }
    })
  })
} 