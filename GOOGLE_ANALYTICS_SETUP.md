# Google Analytics Setup untuk Dashboard

## 📊 Overview
Dashboard ini sudah terintegrasi dengan Google Analytics API untuk menampilkan data analytics yang real. Jika tidak ada konfigurasi Google Analytics, dashboard akan menggunakan data mock.

## 🔧 Setup Google Analytics API

### 1. Buat Google Analytics Account
1. Kunjungi [Google Analytics](https://analytics.google.com/)
2. Buat account baru atau gunakan yang sudah ada
3. Buat property untuk website Anda
4. Catat **View ID** (biasanya format: 123456789)

### 2. Buat Service Account
1. Kunjungi [Google Cloud Console](https://console.cloud.google.com/)
2. Buat project baru atau pilih yang sudah ada
3. Aktifkan **Google Analytics API**
4. Buat **Service Account**:
   - Menu: IAM & Admin > Service Accounts
   - Klik "Create Service Account"
   - Beri nama: "analytics-dashboard"
   - Klik "Create and Continue"
   - Role: "Viewer"
   - Klik "Done"

### 3. Download Service Account Key
1. Klik service account yang baru dibuat
2. Tab "Keys" > "Add Key" > "Create new key"
3. Pilih "JSON"
4. Download file JSON

### 4. Berikan Akses ke Google Analytics
1. Buka Google Analytics
2. Admin > Property > Property Access Management
3. Tambahkan email service account (format: `analytics-dashboard@project.iam.gserviceaccount.com`)
4. Berikan role "Viewer"

### 5. Setup Environment Variables
Tambahkan ke file `.env.local`:

```env
# Google Analytics API
GOOGLE_ANALYTICS_CLIENT_EMAIL="analytics-dashboard@your-project.iam.gserviceaccount.com"
GOOGLE_ANALYTICS_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour private key from JSON file\n-----END PRIVATE KEY-----"
GOOGLE_ANALYTICS_VIEW_ID="123456789"
```

## 📈 Data yang Ditampilkan

### Analytics Overview
- **Total Pengunjung**: Jumlah pengunjung dalam 30 hari terakhir
- **Page Views**: Total halaman yang dilihat
- **Unique Visitors**: Pengunjung unik
- **Bounce Rate**: Persentase pengunjung yang langsung keluar

### Visitor Trend
- **7 Hari Terakhir**: Tren pengunjung dan page views per hari
- **Progress Bar**: Visualisasi tren dengan gradient

### Device Analytics
- **Desktop**: Pengunjung dari komputer
- **Mobile**: Pengunjung dari smartphone
- **Tablet**: Pengunjung dari tablet

### Top Pages
- **Halaman Terpopuler**: Halaman dengan views terbanyak
- **Growth Indicators**: Persentase pertumbuhan

## 🔄 Fallback System
Jika Google Analytics tidak tersedia atau gagal:
- Dashboard akan menggunakan data mock
- Tidak ada error yang muncul
- User experience tetap smooth

## 🚀 Deployment
Untuk production:
1. Setup Google Analytics di website production
2. Update environment variables di hosting platform
3. Pastikan service account memiliki akses yang tepat

## 📝 Troubleshooting

### Error: "Invalid credentials"
- Pastikan private key sudah benar (termasuk `\n`)
- Cek apakah service account email sudah ditambahkan ke Google Analytics

### Error: "View ID not found"
- Pastikan View ID sudah benar
- Cek apakah service account memiliki akses ke property tersebut

### Data tidak muncul
- Cek console untuk error
- Pastikan Google Analytics sudah tracking website
- Tunggu beberapa jam untuk data pertama kali muncul

## 🎯 Tips
- Gunakan Google Analytics 4 untuk data yang lebih akurat
- Setup goals dan events untuk tracking yang lebih detail
- Monitor bounce rate untuk optimasi UX
- Analisis device stats untuk responsive design 