import { PrismaClient } from '@prisma/client'

// Function to create a fresh Prisma client for each request
export function createPrismaClient() {
  const databaseUrl = process.env.DATABASE_URL
  
  if (!databaseUrl) {
    throw new Error('DATABASE_URL environment variable is not set')
  }
  
  // Add parameters to avoid prepared statement conflicts
  let connectionUrl = databaseUrl
  if (databaseUrl && databaseUrl.includes('supabase.co')) {
    const separator = databaseUrl.includes('?') ? '&' : '?'
    connectionUrl = `${databaseUrl}${separator}pgbouncer=true&connection_limit=1&pool_timeout=0`
  }
  
  return new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error'] : ['error'],
    datasources: {
      db: {
        url: connectionUrl,
      },
    },
  })
}

// Create a fresh client for each database operation
export async function withPrisma<T>(operation: (client: PrismaClient) => Promise<T>): Promise<T> {
  const client = createPrismaClient()
  
  try {
    const result = await operation(client)
    return result
  } finally {
    try {
      await client.$disconnect()
    } catch (disconnectError) {
      console.error('Error disconnecting from database:', disconnectError)
    }
  }
}

// Legacy export for backward compatibility
export const prisma = createPrismaClient() 