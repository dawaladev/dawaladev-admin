# Setup Supabase Storage untuk Upload Gambar

## Overview
Sistem ini telah diubah dari penyimpanan base64 ke Supabase Storage untuk performa yang lebih baik dan pengelolaan file yang lebih efisien. **Sistem sekarang otomatis membuat bucket storage saat pertama kali upload foto, tidak perlu setup manual.**

## Prerequisites
1. Supabase project sudah dibuat
2. Environment variables sudah dikonfigurasi:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY` (diperlukan untuk auto-create bucket)
   - `SUPABASE_BUCKET_NAME` (opsional, default: `gastronomi`)

## Environment Configuration

Konfigurasi environment variables:

1. Copy `env.example` ke `.env.local`
2. Set environment variables yang diperlukan:
   ```bash
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
   SUPABASE_BUCKET_NAME=gastronomi  # opsional, default: gastronomi
   ```

### Service Role Key
Service role key diperlukan untuk auto-create bucket. Dapatkan dari:
1. Supabase Dashboard → Settings → API
2. Copy "service_role" key (bukan anon key)
3. Pastikan key ini aman dan tidak di-expose ke client

## Setup Storage Bucket

### Automatic Setup (Recommended)
Sistem akan otomatis membuat bucket storage saat pertama kali upload foto. Tidak perlu setup manual.

### Manual Setup via Supabase Dashboard (Optional)
Jika ingin setup manual:
1. Buka Supabase Dashboard
2. Pilih project Anda
3. Buka menu "Storage"
4. Klik "Create a new bucket"
5. Masukkan nama bucket sesuai konfigurasi (default: `gastronomi`)
6. Centang "Public bucket" untuk akses publik
7. Klik "Create bucket"

## Konfigurasi Bucket

### Bucket Settings
- **Nama**: Sesuai konfigurasi environment variable (default: `gastronomi`)
- **Public**: Yes (untuk akses langsung ke gambar)
- **File size limit**: 5MB
- **Allowed MIME types**: 
  - `image/jpeg`
  - `image/jpg`
  - `image/png`
  - `image/gif`
  - `image/webp`

### Storage Policies
Pastikan bucket memiliki policy yang memungkinkan upload dan read:

```sql
-- Policy untuk upload (insert)
CREATE POLICY "Allow authenticated uploads" ON storage.objects
FOR INSERT WITH CHECK (auth.role() = 'authenticated' AND bucket_id = 'gastronomi');

-- Policy untuk read (select)
CREATE POLICY "Allow public reads" ON storage.objects
FOR SELECT USING (bucket_id = 'gastronomi');
```

**Note**: Ganti `gastronomi` dengan nama bucket yang Anda gunakan.

## Struktur File
Gambar akan disimpan dengan struktur:
```
gastronomi/
├── makanan/
│   ├── 1703123456789-abc123.jpg
│   ├── 1703123456790-def456.png
│   └── ...
└── other-folder/
    └── ...
```

**Note**: `gastronomi` adalah nama bucket default, sesuaikan dengan konfigurasi Anda.

## API Changes

### Upload API (`/api/upload`)
**Response format baru:**
```json
{
  "files": [
    {
      "url": "https://your-project.supabase.co/storage/v1/object/public/gastronomi/makanan/1703123456789-abc123.jpg",
      "path": "makanan/1703123456789-abc123.jpg"
    }
  ],
  "message": "Files uploaded successfully"
}
```

**Note**: URL akan menggunakan nama bucket yang dikonfigurasi.

### Makanan API
- **GET**: Mengembalikan array URL gambar (bukan base64)
- **POST**: Menerima array URL gambar dari Supabase Storage
- **PUT**: Update dengan array URL gambar baru

## Frontend Changes

### Upload Component
Komponen upload telah diupdate untuk:
1. Menggunakan response format baru dari API
2. Menampilkan URL gambar langsung dari Supabase Storage
3. Menangani error storage bucket

### Image Display
Gambar ditampilkan langsung dari URL Supabase Storage tanpa perlu decode base64.

## Troubleshooting

### Error: "Storage bucket not configured"
1. Sistem akan otomatis membuat bucket saat upload pertama kali
2. Pastikan environment variables sudah dikonfigurasi dengan benar:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY` (penting untuk auto-create bucket)
3. Periksa koneksi internet dan Supabase credentials
4. Pastikan service role key memiliki permission untuk membuat bucket

### Error: "Upload failed" atau "Some files failed to upload"
1. Periksa koneksi internet
2. Pastikan file tidak melebihi 5MB
3. Pastikan format file didukung
4. Pastikan `SUPABASE_SERVICE_ROLE_KEY` sudah dikonfigurasi
5. Sistem menggunakan service role untuk bypass RLS policy

### Error: "Unauthorized"
1. Pastikan user sudah login
2. Periksa Supabase authentication
3. Periksa storage policies

## Migration dari Base64

Jika Anda memiliki data lama dengan base64:
1. Export data dari database
2. Upload gambar ke Supabase Storage
3. Update database dengan URL baru
4. Hapus kolom base64 lama (opsional)

## Performance Benefits

1. **Faster loading**: Gambar dimuat langsung dari CDN
2. **Reduced database size**: Tidak menyimpan base64 di database
3. **Better caching**: Browser dapat cache gambar secara efektif
4. **Scalability**: Supabase Storage dapat menangani traffic tinggi
5. **Cost effective**: Lebih murah untuk storage dan bandwidth

## Security Considerations

1. **File validation**: Hanya gambar yang diizinkan
2. **Size limits**: Maksimal 5MB per file
3. **Authentication**: Hanya user yang login yang dapat upload
4. **Public access**: Gambar dapat diakses publik (sesuai kebutuhan bisnis)
5. **Service Role**: Menggunakan service role key untuk bypass RLS policy

## RLS Policy Solution

Sistem ini menggunakan service role key untuk mengatasi masalah Row-Level Security (RLS):

### Why Service Role?
- **RLS Bypass**: Service role bypasses RLS policies
- **Bucket Creation**: Hanya service role yang bisa create bucket
- **File Upload**: Service role bisa upload tanpa RLS restrictions

### Security Note
- Service role key memiliki full access
- Hanya digunakan di server-side (API routes)
- Tidak di-expose ke client
- Tetap ada validasi file dan authentication
