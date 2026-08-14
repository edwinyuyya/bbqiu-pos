# F&B Order System (mirip ESB)

Sistem order F&B berbasis **QR di meja**, dengan pilihan **bayar QRIS langsung**
atau **bayar di kasir**, plus **routing cetak dapur ke 3 station** (Shaokao,
Maincourse, Bar Minuman) dari **1 printer**.

> Status: foundation / MVP — dibangun "sambil berjalan". Lihat **Roadmap** di bawah.

## Dua versi tersedia
| Versi | Folder | Backend | Cocok untuk |
|-------|--------|---------|-------------|
| **Next.js + Supabase** | root (`app/`) | Postgres (Supabase) | Deploy ke Vercel, butuh internet |
| **Google Apps Script + Sheets** | [`gas/`](gas/README.md) | Google Spreadsheet (Drive) | Gratis, dikelola via akun Google, butuh internet |

Dokumen di bawah ini untuk versi **Next.js + Supabase**. Untuk versi Google
Apps Script (backend Google Sheets, storage Google Drive), lihat
[`gas/README.md`](gas/README.md).

## Stack
- Next.js 15 (App Router) + React 18
- Supabase (Postgres)
- `qrcode` untuk generate QR meja & QRIS

## Fitur saat ini
- **Pelanggan**: scan barcode meja → `/meja/[token]` → hanya dua hal: panggil
  waiter (tombol cepat atau tulis permintaan) dan lihat daftar pesanan yang
  sudah masuk, **tanpa harga**. Pemesanan dilakukan kasir.
- **Pesan mandiri** (`/menu/[token]`): alur pelanggan memilih menu sendiri —
  sekarang dipakai lewat tautan reservasi, bukan dari barcode meja.
- **QRIS**: QR pembayaran digenerate otomatis (mode statis/mock; siap diganti
  payment gateway). Pelanggan konfirmasi "sudah bayar".
- **Kasir** (`/cashier`): lihat bill aktif, tandai lunas, tutup/batalkan bill,
  cetak ulang struk dapur.
- **Input Order kasir**: dua langkah — pilih meja lalu pilih menu. Meja yang
  billnya belum ditutup tidak bisa dipilih. Setelah order jadi, barcode meja
  bisa langsung dicetak (`/cashier/barcode/[orderId]`) lengkap dengan nomor
  meja dan nomor pesanan.
- **Kitchen Display** (`/kitchen`): tiket masuk per station, auto-refresh,
  tandai item `ready`/`served`, filter per station.
- **Cetak dapur 1 printer → 3 station** (`/kitchen/print/[orderId]`): satu
  dokumen berisi struk terpisah per station dengan penanda potong di antaranya.
  Item otomatis dirouting ke station-nya (dari menu atau kategori).
- **Admin** (`/admin`): kelola meja + generate/cetak QR meja, kelola menu &
  assign station.

## Setup
1. Buat project di [supabase.com](https://supabase.com).
2. Jalankan isi `schema.sql` di **Supabase → SQL Editor** (membuat tabel +
   3 station + contoh menu + meja 1–18).
   - Database yang sudah jalan dengan layout meja lama (Outdoor/AC/VIP):
     jalankan `supabase/meja-1-18.sql` untuk pindah ke penomoran 1–18,
     lalu cetak ulang QR meja.
3. Salin `env.example` → `.env.local` dan isi:
   - `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `NEXT_PUBLIC_BASE_URL` (mis. `https://restoran.vercel.app`) — agar link QR absolut
   - `NEXT_PUBLIC_MERCHANT_NAME`, `NEXT_PUBLIC_TAX_PERCENT`
   - (opsional) `SUPABASE_SERVICE_ROLE_KEY`, `NEXT_PUBLIC_QRIS_STATIC`
4. Install & jalankan:
   ```bash
   npm install
   npm run dev
   ```
5. Buka `/admin` → cetak QR meja → tempel di meja. Pelanggan scan untuk
   memanggil waiter dan memantau pesanannya.

## Alur data
```
Kasir: /cashier → Input Order  ──>  POST /api/orders
   (1. pilih meja, 2. pilih menu)     │  (hitung total di server,
                                      │   routing station per item,
                                      │   buat print_job)
                                      ▼
   /order/[id]  <── status & pembayaran ──  orders + order_items
        │
        ├── QRIS: tampilkan QR, konfirmasi bayar
        └── Kasir: tunjukkan #order di kasir (/cashier)

Pelanggan scan barcode meja  ──>  /meja/[token]
        ├── panggil waiter / tulis permintaan  ──>  POST /api/waiter-calls
        └── lihat pesanan tanpa harga          ──>  GET  /api/meja/[token]

Dapur: /kitchen  ──>  /kitchen/print/[orderId]
        (1 dokumen, 3 struk station: Shaokao / Maincourse / Bar)
```

## Routing station
Setiap `menu_items` punya `station_id` (atau diwarisi dari `categories.station_id`).
Saat order dibuat, tiap `order_items` menyimpan `station_id`-nya. Halaman cetak
mengelompokkan item per station menjadi struk terpisah — sehingga **satu printer
dapur** mencetak tiket untuk **tiga station** sekaligus, masing-masing dengan
penanda potong.

## Roadmap (sambil berjalan)
- Integrasi payment gateway nyata (Midtrans/Xendit) + webhook konfirmasi QRIS.
- Cetak otomatis via printer thermal (ESC/POS) / print server, bukan dialog browser.
- Realtime via Supabase Realtime (ganti polling).
- Autentikasi staf (kasir/dapur/admin) + peran.
- Laporan penjualan & rekap per station/shift.
- Tambah pesanan ke bill yang sama (multi-round per meja).
