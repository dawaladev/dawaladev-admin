# 🚀 ADMIN-PANEL DAWALA

Panel admin untuk mengelola data makanan dan paket Dawala dengan fitur autentikasi yang lengkap.

## 🛠️ Teknologi

- **Next.js 15** dengan App Router
- **TypeScript** untuk type safety
- **TailwindCSS** untuk styling
- **Prisma ORM** untuk database operations
- **Supabase Auth** untuk autentikasi (email-password & Google OAuth)
- **PostgreSQL** sebagai database

## 👥 Role User

- **super_admin**: Akses penuh ke semua fitur (hanya bisa dibuat via seeder)
- **admin**: Akses terbatas untuk mengelola data makanan dan jenis paket

## 🗂️ Struktur Database

### Tabel User
- `id`: String (PK)
- `email`: String (unique)
- `role`: Enum (SUPER_ADMIN, ADMIN)
- `createdAt`: DateTime
- `updatedAt`: DateTime

### Tabel JenisPaket
- `id`: Integer (PK, auto-increment)
- `namaPaket`: String
- `createdAt`: DateTime
- `updatedAt`: DateTime

### Tabel Makanan
- `id`: Integer (PK, auto-increment)
- `namaMakanan`: String
- `deskripsi`: String
- `foto`: String (URL)
- `harga`: Integer
- `jenisPaketId`: Integer (FK ke JenisPaket)
- `createdAt`: DateTime
- `updatedAt`: DateTime

## 🚀 Setup & Instalasi

### 1. Clone Repository
```bash
git clone <repository-url>
cd dawaladev-admin
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Setup Environment Variables
Buat file `.env` di root project dengan konfigurasi berikut:

```env
# Database Configuration (Supabase PostgreSQL)
DATABASE_URL="postgresql://postgres.yqwiwjadglsicaxlxxkt:D@wal4Pass@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres"
DIRECT_URL="postgresql://postgres.yqwiwjadglsicaxlxxkt:D@wal4Pass@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres"

# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL="https://yqwiwjadglsicaxlxxkt.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your_supabase_anon_key"
SUPABASE_SERVICE_ROLE_KEY="your_supabase_service_role_key"

# Super Admin Configuration
SUPER_ADMIN_EMAIL="dawaladev@gmail.com"
SUPER_ADMIN_NAME="Dawala - Admin"
SUPER_ADMIN_PASSWORD="D@wal4Pass"

# Next.js Configuration
NEXTAUTH_SECRET=your_nextauth_secret
NEXTAUTH_URL=http://localhost:3000
```

### 4. Setup Database
```bash
# Push schema ke database
npm run db:push

# Jalankan seeder untuk membuat super admin dan data awal
npm run db:seed
```

### 5. Jalankan Development Server
```bash
npm run dev
```

Buka [http://localhost:3000](http://localhost:3000) di browser.

## 🔐 Login Credentials

Setelah menjalankan seeder, Anda bisa login dengan:

**Super Admin:**
- Email: `dawaladev@gmail.com`
- Password: `D@wal4Pass`

## 📁 Struktur Direktori

```
src/
├── app/
│   ├── auth/                 # Halaman autentikasi
│   │   ├── login/
│   │   ├── register/
│   │   ├── forgot-password/
│   │   └── callback/
│   ├── dashboard/            # Panel admin
│   │   ├── jenis-paket/      # Kelola jenis paket
│   │   ├── makanan/          # Kelola makanan
│   │   └── admin/            # Kelola admin (super_admin only)
│   └── api/                  # API routes
├── components/
│   ├── ui/                   # Komponen UI dasar
│   └── Sidebar.tsx           # Sidebar navigasi
└── lib/
    ├── prisma.ts             # Prisma client
    ├── supabase.ts           # Supabase client
    └── utils.ts              # Utility functions
```

## 🎨 Fitur

### Autentikasi
- ✅ Login dengan email-password
- ✅ Login dengan Google OAuth
- ✅ Register admin baru
- ✅ Reset password via email
- ✅ Proteksi route berdasarkan role

### Dashboard
- ✅ Dashboard dengan statistik
- ✅ Sidebar navigasi responsif
- ✅ Menu berbeda untuk super_admin dan admin

### CRUD Operations
- ✅ Jenis Paket: Create, Read, Update, Delete
- ✅ Makanan: Create, Read, Update, Delete
- ✅ Validasi form dengan error handling
- ✅ Konfirmasi sebelum delete

### File Upload
- ✅ Upload foto makanan (URL-based)
- ✅ Preview gambar

## 🔧 Scripts

```bash
# Development
npm run dev

# Build
npm run build

# Production
npm run start

# Database
npm run db:push      # Push schema ke database
npm run db:seed      # Jalankan seeder
npm run db:studio    # Buka Prisma Studio

# Linting
npm run lint
```

## 🚀 Deployment

### Vercel (Recommended)
1. Push code ke GitHub
2. Connect repository ke Vercel
3. Set environment variables di Vercel dashboard
4. Deploy

### Manual Deployment
1. Build project: `npm run build`
2. Start production server: `npm run start`

## 📝 Notes

- Super admin hanya bisa dibuat melalui seeder
- Admin baru bisa register sendiri atau dibuat oleh super admin
- Semua operasi database menggunakan Prisma ORM
- Autentikasi menggunakan Supabase Auth
- File upload menggunakan URL (bisa diintegrasikan dengan Supabase Storage)

## 🤝 Contributing

1. Fork repository
2. Create feature branch
3. Commit changes
4. Push ke branch
5. Create Pull Request

## 📄 License

MIT License
