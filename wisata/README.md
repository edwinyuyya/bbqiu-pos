# Website Wisata Spiritual & Ziarah

Website untuk usaha tour & travel wisata spiritual di Jogja dan Jawa Tengah.
Berdiri sendiri, terpisah dari sistem POS di folder induk — punya
`package.json`, dependensi, dan deploy sendiri.

**Stack:** Next.js 15 (App Router) + React 18. Tanpa basis data, tanpa
dependensi lain. Seluruh isi website ada di folder `data/` sebagai file
JavaScript biasa, jadi bisa diedit tanpa perlu paham React.

---

## Menjalankan di komputer sendiri

```bash
cd wisata
npm install
npm run dev
```

Buka http://localhost:3100

Port sengaja dibedakan (3100) supaya bisa berjalan bersamaan dengan POS di
port 3000.

---

## Yang harus diganti sebelum dipublikasikan

Ada tiga hal yang **wajib** diganti, semuanya di `data/site.js`:

| Isian | Sekarang | Ganti dengan |
|---|---|---|
| `whatsapp` | `6281234567890` | Nomor WA asli, format `62...` tanpa tanda + dan tanpa spasi |
| `url` | `https://lakujawa.id` | Domain asli setelah aktif |
| `instagram` | `lakujawa.id` | Nama akun IG asli |

Lalu yang sangat disarankan:

- **`nama` dan `tagline`** — ganti kalau sudah punya nama brand final.
- **Harga di `data/paket.js`** — angka sekarang adalah estimasi pasar, bukan
  angka asli Anda. Cara menghitung ulang ada di `docs/rencana-bisnis.md`.
- **`legalitas`** di `data/site.js` — isi setelah NIB terbit. Otomatis muncul
  di footer, dan ini pembeda besar di mata calon pelanggan yang takut ditipu.
- **Foto destinasi** — lihat `public/foto/BACA-DULU.md`.

---

## Peta file

```
wisata/
├── data/                  ← SEMUA ISI WEBSITE ADA DI SINI
│   ├── site.js              nama brand, kontak, WA, sosmed, janji layanan
│   ├── destinasi.js         10 destinasi: sejarah, laku, uborampe, adab
│   ├── paket.js             5 paket + tarif berjenjang + tambahan opsional
│   └── faq.js               tanya jawab, dikelompokkan
│
├── app/
│   ├── page.jsx             beranda
│   ├── destinasi/           daftar destinasi + halaman detail per lokasi
│   ├── paket/               harga lengkap + kalkulator biaya
│   ├── cara-kerja/          alur 6 langkah
│   ├── etika/               janji, yang kami tolak, tanda penipuan
│   ├── faq/                 tanya jawab
│   ├── components/          navigasi, footer, motif pengganti foto
│   └── globals.css          seluruh tampilan; warna dipusatkan di :root
│
├── public/foto/           ← taruh foto asli di sini
└── docs/
    ├── rencana-bisnis.md    hitungan margin, titik impas, legalitas, risiko
    └── konten-instagram.md  pilar konten, 30 hari pertama, iklan
```

---

## Cara mengedit yang paling sering diperlukan

**Menambah destinasi baru** — buka `data/destinasi.js`, salin satu blok objek
yang sudah ada, ganti isinya. Pastikan `slug` unik dan tanpa spasi. Halaman
barunya terbuat otomatis di `/destinasi/<slug>`.

**Mengubah harga** — buka `data/paket.js`, ubah angka di array `tarif`. Tabel
harga dan kalkulator di website otomatis ikut berubah.

**Menambah pertanyaan FAQ** — buka `data/faq.js`. Aturan praktis: pertanyaan
yang sudah tiga kali masuk ke WhatsApp, naikkan ke halaman ini.

**Mengubah warna** — buka `app/globals.css`, ubah nilai di blok `:root` paling
atas. Sekali ganti, seluruh website ikut.

---

## Deploy ke Vercel

Karena ini sub-folder dalam repo yang juga berisi POS, Vercel perlu diberi tahu
letaknya.

1. Buat project **baru** di Vercel (jangan pakai yang sudah ada untuk POS).
2. Pilih repo yang sama.
3. Di **Settings → General → Root Directory**, isi `wisata`.
4. Framework preset akan terdeteksi otomatis sebagai Next.js.
5. Deploy. Tidak ada environment variable yang perlu diisi.

Setelah domain aktif, jangan lupa perbarui `url` di `data/site.js` agar
`sitemap.xml` dan tautan berbagi menunjuk ke alamat yang benar.

---

## Yang sudah tersedia

- 10 halaman destinasi, masing-masing berisi riwayat, alasan orang datang, laku
  yang lazim, uborampe, adab lokasi, waktu terbaik, dan akses juru kunci
- 5 paket dengan tarif berjenjang — private berdua, rombongan 3–10, open trip
  12–15, laku tirakat bermalam, ziarah wali 3 hari
- Kalkulator biaya yang hasilnya bisa langsung dikirim ke WhatsApp tanpa
  mengetik ulang
- Seluruh tombol terhubung ke WhatsApp dengan pesan yang sudah terisi sesuai
  konteks halamannya
- Motif batik otomatis sebagai pengganti foto yang belum ada
- `sitemap.xml` dan `robots.txt` otomatis
- Data terstruktur FAQ agar pertanyaan bisa muncul langsung di hasil pencarian
  Google dan dikutip asisten AI
- Responsif sampai lebar 390px, sudah diperiksa tanpa scroll horizontal

## Yang belum ada, dan kapan sebaiknya dibuat

| Fitur | Buat kalau |
|---|---|
| Halaman testimoni | Sudah punya minimal 5 testimoni tertulis dengan izin |
| Jadwal open trip yang bisa diperbarui | Sudah rutin 2 keberangkatan per bulan |
| Formulir pemesanan dengan basis data | WhatsApp sudah kewalahan, biasanya di atas 30 pesan per hari |
| Pembayaran daring | Sudah ada badan usaha dan rekening perusahaan |
| Blog / artikel | Siap menulis rutin; bagus untuk SEO tapi butuh komitmen |

Jangan bangun semuanya sekarang. Setiap fitur yang tidak dipakai adalah beban
perawatan.
