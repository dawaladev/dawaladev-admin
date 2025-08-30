import { PrismaClient } from '@prisma/client'
import { createClient } from '@supabase/supabase-js'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting seeding...')

  try {
    // Create Supabase client
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Create super admin user in Supabase Auth
    const superAdminEmail = process.env.SUPER_ADMIN_EMAIL || 'dawaladev@gmail.com'
    const superAdminPassword = process.env.SUPER_ADMIN_PASSWORD || 'D@wal4Pass'
    const superAdminName = process.env.SUPER_ADMIN_NAME || 'Dawala - Admin'
    
    try {
      const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
        email: superAdminEmail,
        password: superAdminPassword,
        email_confirm: true,
        user_metadata: {
          name: superAdminName,
          role: 'SUPER_ADMIN'
        }
      })

      if (authError) {
        console.log('ℹ️ Auth user already exists or error:', authError.message)
      } else {
        console.log('✅ Super admin auth user created:', authUser.user?.email)
      }

      // Create super admin in database
      if (authUser?.user) {
        try {
          const superAdmin = await prisma.user.create({
            data: {
              id: authUser.user.id,
              email: superAdminEmail,
              role: 'SUPER_ADMIN',
            },
          })
          console.log('✅ Super admin database user created:', superAdmin.email)
        } catch (dbError) {
          console.log('ℹ️ Super admin database user already exists')
        }
      }
    } catch (error) {
      console.log('ℹ️ Auth user creation skipped (may already exist)')
    }

    // Check if data already exists
    const existingPaket = await prisma.jenisPaket.count()
    const existingMakanan = await prisma.makanan.count()

    if (existingPaket > 0 && existingMakanan > 0) {
      console.log('ℹ️ Sample data already exists, skipping creation')
      console.log(`📊 Current data: ${existingPaket} jenis paket, ${existingMakanan} makanan`)
      return
    }

    // Create sample jenis paket
    console.log('📦 Creating sample jenis paket...')
    const paket1 = await prisma.jenisPaket.create({
      data: {
        namaPaket: 'Paket Sarapan',
        namaPaketEn: 'Breakfast Package',
      },
    })

    const paket2 = await prisma.jenisPaket.create({
      data: {
        namaPaket: 'Paket Makan Siang',
        namaPaketEn: 'Lunch Package',
      },
    })

    const paket3 = await prisma.jenisPaket.create({
      data: {
        namaPaket: 'Paket Makan Malam',
        namaPaketEn: 'Dinner Package',
      },
    })

    console.log('✅ Sample jenis paket created')

    // Create sample makanan
    console.log('🍽️ Creating sample makanan...')
    const makanan1 = await prisma.makanan.create({
      data: {
        namaMakanan: 'Nasi Goreng Spesial',
        deskripsi: 'Nasi goreng dengan telur, ayam, dan sayuran segar',
        deskripsiEn: 'Fried rice with egg, chicken, and fresh vegetables',
        foto: JSON.stringify(['https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=400']),
        harga: 25000,
        jenisPaketId: paket1.id,
      },
    })

    const makanan2 = await prisma.makanan.create({
      data: {
        namaMakanan: 'Ayam Goreng Crispy',
        deskripsi: 'Ayam goreng crispy dengan bumbu special',
        deskripsiEn: 'Crispy fried chicken with special seasoning',
        foto: JSON.stringify(['https://images.unsplash.com/photo-1626645738196-c2a7c87a8f58?w=400']),
        harga: 35000,
        jenisPaketId: paket2.id,
      },
    })

    const makanan3 = await prisma.makanan.create({
      data: {
        namaMakanan: 'Soto Ayam',
        deskripsi: 'Soto ayam dengan kuah kaldu yang gurih',
        deskripsiEn: 'Chicken soup with savory broth',
        foto: JSON.stringify(['https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=400']),
        harga: 20000,
        jenisPaketId: paket1.id,
      },
    })

    const makanan4 = await prisma.makanan.create({
      data: {
        namaMakanan: 'Gado-gado',
        deskripsi: 'Sayuran segar dengan bumbu kacang yang lezat',
        deskripsiEn: 'Fresh vegetables with delicious peanut sauce',
        foto: JSON.stringify(['https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400']),
        harga: 18000,
        jenisPaketId: paket2.id,
      },
    })

    const makanan5 = await prisma.makanan.create({
      data: {
        namaMakanan: 'Rendang Daging',
        deskripsi: 'Daging sapi yang dimasak dengan bumbu rendang tradisional',
        deskripsiEn: 'Beef cooked with traditional rendang spices',
        foto: JSON.stringify(['https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=400']),
        harga: 45000,
        jenisPaketId: paket3.id,
      },
    })

    console.log('✅ Sample makanan created')

    console.log('🎉 Seeding completed successfully!')
    console.log('📊 Created:')
    console.log(`   - ${3} jenis paket`)
    console.log(`   - ${5} makanan`)
    console.log(`   - 1 super admin user (${superAdminEmail})`)

  } catch (error) {
    console.error('❌ Seeding failed:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  }) 