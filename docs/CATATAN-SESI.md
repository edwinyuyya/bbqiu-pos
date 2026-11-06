# Catatan Sesi — BBQIU POS & Checklist

Ringkasan keputusan, temuan, dan pekerjaan yang belum selesai dari sesi
panjang Agustus–November 2026. Ditulis supaya tidak hilang bersama
percakapan.

> Repo ini **publik**. Tidak ada PIN, token, atau nomor pelanggan di
> dokumen ini — hanya penunjuk ke tempat penyimpanannya.

---

## 1. Jadwal operasional (dasar banyak keputusan di bawah)

| | |
|---|---|
| Hari buka | **Selasa – Minggu** (Senin tutup) |
| Prepare | **16.00** |
| Buka | **17.00** |
| Tutup | **24.00** |

Satu "hari operasional" membentang 16.00 sampai lewat tengah malam.
Apa pun sebelum **05.00** masih dihitung sebagai malam sebelumnya —
closing dikerjakan setelah tutup, jadi kirimannya jatuh di tanggal
kalender berikutnya.

---

## 2. POS BBQIU (repo ini)

Deploy: Vercel, proyek `bbqiu-pos`, dari GitHub `edwinyuyya/bbqiu-pos`
branch `main`. Database Supabase, project id `useaopckwgbkbeyyloil`.
PB1 **10%**.

### Yang dibangun di sesi ini

- **Split bill** (`app/api/orders/[id]/split/route.js`, `app/cashier/SplitBill.jsx`) —
  pisah per item ke bill baru yang berdiri sendiri, plus mode "bagi rata"
  yang hanya menghitung tanpa memecah tagihan. Kolom
  `orders.split_from_order_id` menentukan bill induk, supaya pesanan
  tambahan dari QR meja tidak menempel ke tagihan tamu yang sudah
  memisahkan diri.
- **Kompliment** (`app/api/order-items/[id]/comp/route.js`) — item tetap
  tercetak di nota dengan harga Rp 0, harga normalnya disimpan di
  `comp_price`. Stok tetap terpotong, dapur tetap menerima. Alasan wajib.
  Bill lunas ditolak. Dilaporkan ke Telegram saat itu juga dan masuk baris
  Kompliment di rekap harian.
- **Order manual wajib menempel ke pelanggan** — tombol lewati dihapus,
  tab langkah 2–4 dimatikan sampai pelanggan dipilih, dan `submit()`
  menolak tanpa pelanggan. Pemesanan tamu lewat QR meja TIDAK ikut
  berubah: kewajiban ini dipasang di layar kasir, bukan di API, karena
  layar tamu tidak punya form pendaftaran.
- **Kode promo sekali pakai benar-benar hangus** — jatah dikunci dengan
  compare-and-set sebelum diskon dihitung (dua kasir bersamaan tidak lagi
  bisa memakai kode yang sama), dan melepas kode berjatah tidak
  memulihkan jatahnya. Reset hanya lewat tombol di tab Promo admin.

### Kunci harga yang tidak boleh lepas

`menu_items.promo_eligible = false` mengunci menu dari **semua** kode
promo, sekarang dan yang dibuat nanti. Yang terkunci:

- 4 paket di Grill & Steamboat: Paket value set, value set berdua,
  value set ber4, Paket suki small
- Nasi (Rp 7.000) — masih duduk di kategori Grill & Steamboat
- Paket shaokao (kategori **Paket Shaokao**, dibuat di sesi ini)
- Kuah Mala & Original
- Take away (biaya bungkus, tanpa kategori)

Latar belakangnya: promo `bbqiuopen50` dulu memotong paket sebesar
**Rp 1.407.500** karena lingkupnya ditulis "semua kecuali Minuman" tanpa
membaca isi kategorinya. Daftar pengecualian per promo tidak cukup —
setiap promo baru harus ingat mengecualikannya lagi.

### Penjaga kode

`eslint.config.mjs` dengan satu aturan yang benar-benar ditegakkan:
`no-undef`. `npm run lint`. Dipasang setelah dua kali kejadian yang sama:
`b.order_id` dan `menuHadiah` membuat seluruh pemesanan gagal di jam
ramai, dan `next build` tidak menangkap keduanya.

---

## 3. Checklist Pekerjaan BBQIU (sistem terpisah)

**Bukan bagian dari repo ini.** Google Apps Script murni — frontend
memakai `google.script.run`, jadi seluruh aplikasi disajikan oleh Apps
Script sendiri. **Tidak lewat Netlify.** (File HTML versi Netlify yang
memakai `fetch('/api/apps-script')` adalah port lama yang tidak dipakai.)

- Sheet `Database Checklist Pekerjaan Resto` + folder Drive
  `Foto Checklist Pekerjaan Resto` — dibuat otomatis saat pertama dipakai,
  id-nya disimpan di Script Properties.
- Isi: **3 fase, 23 area, 111 titik periksa.** Tiap titik wajib satu foto;
  watermark dibakar ke dalam gambar (jam, GPS + akurasi meter, cabang,
  PIC, fase, area, nama titik).
- Web app `ANYONE_ANONYMOUS`, `executeAs: USER_DEPLOYING`.

### Upgrade yang sudah dipasang

1. **Notifikasi & alarm** — laporan Telegram, sheet `Rekap Harian`, dan
   alarm untuk fase yang bolong. Pola pesan dibuat pelit: fase lengkap
   (maks 3×/hari), kejanggalan saja, dan **satu rekap wajib tiap malam**.
   Rekap wajib itu sengaja selalu dikirim — kalau alarm cuma bicara saat
   ada masalah, sunyi jadi ambigu antara "semua beres" dan "botnya mati".
2. **Loop approve/reject** — 4 kolom review di ujung sheet, tombol
   Setujui/Tolak, alasan wajib saat menolak, dan area yang ditolak muncul
   kembali di layar staf sebagai pekerjaan ulang (hilang sendiri setelah
   dikirim ulang).
3. **Penyesuaian jadwal** — batas jam **17 / 22 / 02**, Senin dilewati,
   dan `tanggalOperasional_()` untuk pergantian hari jam 05.00.

### Hal yang mudah salah saat memasang

- Tombol **Run** di editor Apps Script **tidak bisa mengirim argumen**.
  `setelAwal('token','chat','pin')` dijalankan tanpa nilai sama sekali
  sehingga tidak ada yang tersimpan, dan notifikasi diam total tanpa
  error. Isi Script Properties lewat **Project Settings**, atau pakai
  `setelAwalSaya()` yang nilainya ditulis di dalam fungsi.
- Setelah mengganti kode, **Deploy → Manage deployments → Edit → New
  version**. Trigger jalan di kode tersimpan terakhir, tapi web app jalan
  di versi yang di-deploy — melewatkan langkah ini membuat separuh fitur
  terlihat rusak.
- `diagnosaNotif()` melaporkan letak masalahnya (token tersimpan atau
  tidak, jumlah trigger, tanggal operasional, hari libur, batas jam).

### Belum masuk git

Kode Apps Script-nya **tidak ada di repo ini** — file kerjanya hilang
saat container sesi direstart. Yang hidup ada di proyek Apps Script
sendiri. Kalau mau diversikan: export proyeknya jadi JSON lalu simpan di
`docs/checklist-app/`.

### Perbedaan yang belum diputuskan

Area **"Dapur Belakang"** (4 item) vs **"Dishwasher"** (6 item, termasuk
*Grease trap bersih*). Revisi Dishwasher dulu hanya ada di frontend versi
Netlify sebagai tempelan sisi klien, tidak pernah masuk skema server.
Yang jalan sekarang: Dapur Belakang.

---

## 4. Temuan dari data

### Audit sistem, 10 September

Sekitar **50%** dari yang dirancang benar-benar dipakai. Polanya: semua
yang menyangkut uang berjalan hampir sempurna, semua yang menuntut staf
menekan sesuatu di tengah pelayanan mati.

- **Kitchen Display berhenti dipakai 24 Agustus** — 71–91% item ditandai
  selesai sampai 23 Agustus, lalu 2–18%. Tidak ada yang menyadarinya
  selama lebih dari dua minggu. Penyebabnya di lapangan, bukan teknis.
- **Cetak struk dapur otomatis 8%** — 384 dari 417 perintah cetak
  menggantung. Praktis tidak pernah hidup.
- **Tutup kasir harian 3×** seumur sistem, terakhir 10 Agustus.
- **23,7% nilai penjualan tanpa resep** → stok tidak terpotong.
  Terbesar: Paket value set ber4. Ini sebab utama stok minus.
- Kas kecil dan panggil waiter sehat (semua panggilan tertangani).

### Omzet

| Bulan | Hari jualan | Bill | Omzet | Rata/hari | Bill/hari |
|---|---|---|---|---|---|
| Agustus | 21 | 149 | Rp 27.605.050 | Rp 1.314.526 | 7,1 |
| September | 26 | 131 | Rp 30.669.650 | Rp 1.179.602 | 5,0 |
| Oktober | 27 | 125 | Rp 27.759.358 | Rp 1.028.124 | 4,6 |

Oktober lebih rendah dari September **meski harinya lebih banyak**
(−9,5% total, −12,8% per hari). Tiga bulan berturut-turut rata-rata
harian menurun. Oktober: 100% lunas, 2 bill dibatalkan (Rp 224.400),
diskon sebulan hanya Rp 33.000.

**Penyebabnya jumlah tamu, bukan besar belanja.** Rata per bill bertahan
Rp 222rb–234rb; bill per hari jatuh 7,1 → 5,0 → 4,6.

### Hari terlemah (Oktober penuh)

| Hari | Rata omzet | Bill/hari |
|---|---|---|
| Jumat | Rp 502.467 | 3,0 |
| Kamis | Rp 510.176 | 2,6 |
| Selasa | Rp 732.045 | 4,8 |
| Rabu | Rp 1.016.670 | 3,5 |
| Minggu | Rp 1.356.014 | 4,0 |
| **Sabtu** | **Rp 2.055.447** | **9,6** |

**Jumat ambruk** — periode 19 Agu–7 Okt masih Rp 1.086.000, di Oktober
tinggal Rp 502.000. Sabtu menyumbang **37% omzet sebulan dari 5 hari**;
ketergantungan itu sendiri risiko.

### Jam operasi menurut data

Order berjalan 14.00–22.00, puncak 19.00. Hanya **satu** bill seumur
sistem yang masuk setelah tengah malam.

### QR meja

Terbukti pernah dipakai tamu — 20 panggilan waiter dari HP tamu, 8
tampak tamu sungguhan (satu mengetik "minta tisu" dan menunggu 21 menit;
dua tamu pada 10 Agustus menunggu 59 dan 32 menit). Tapi: **meja 1, 2,
dan 3 saja** yang pernah discan. **Meja 4–18 nol, selamanya** — ketiga
belas meja itu dibuat 16 Agustus dengan token baru, dan stikernya
kemungkinan besar belum pernah dipasang. Stiker lama (AC 1, Outdoor 4,
dst.) sudah mati karena mejanya dinonaktifkan.

### Program pelanggan

Wajib-daftar aktif 8 September. Sebelumnya 1–8 September **0 dari 34
bill** terdaftar; sesudahnya langsung 100%. Tapi sampai 10 September
**semua pelanggan masih visit_count = 1** — belum ada pelanggan berulang,
jadi belum ada satu hadiah pun keluar. Hanya 5 dari 37 mengisi tanggal
lahir, sehingga notifikasi ulang tahun hampir tanpa bahan.

---

## 5. Belum selesai

### Perlu keputusan pemilik

- **Tanya dapur apa yang terjadi 24 Agustus.** 15% sistem berhenti
  dipakai dalam semalam; penyebabnya di lapangan.
- **Resep untuk 4 paket.** Rp 9,6 juta penjualan tanpa potong stok.
- **Opname ulang.** Terakhir 11 Agustus. 36 bahan bersaldo minus.
- **Cetak ulang stiker QR meja 3–18.**
- **Laporan harian POS mistimed.** Cron `30 14 * * *` UTC = 21.30 WIB,
  dikirim saat resto masih buka 2,5 jam lagi. Jam 22 ke atas (±4,3%
  omzet) selalu masuk laporan hari berikutnya. Usulan: `0 18 * * *` UTC
  (01.00 WIB). **Belum dikerjakan, menunggu persetujuan.**
- **Isi `seats` meja 1–18** — queue tidak bisa menyaring kapasitas.
- 84+ bahan tanpa `cost_price`; gramasi resep dari Excel belum
  diterapkan; 7 baris inventory `Maincourse `/`Shaokao ` nyasar.
- **PIN Stok, Dapur, dan Waiter sama.** Waiter bisa membuka halaman Stok
  berisi harga pokok dan data supplier.
- **Promo menganggur.** `yuyya25` dan `slc25` belum pernah sekali pun
  dipakai; tidak ada promo berjalan sejak 17 Agustus. Hari terlemah
  Jumat–Kamis adalah sasaran yang jelas.

### Kandidat upgrade checklist

1. **Dashboard mulai melambat** — `getOwnerDashboard` membaca seluruh
   sheet lalu menyaring di memori. ±114 baris/hari ≈ 41.000 baris/tahun
   akan menabrak batas waktu Apps Script.
2. **Draf tersimpan di HP** — kiriman gagal karena sinyal lemah berarti
   puluhan foto hilang dan harus difoto ulang.
3. **Beban 111 foto/hari.** Preopening sendiri 49 foto. Saran: wajib foto
   hanya untuk area berisiko (toilet, selasar WC, mushola, grease trap),
   sisanya cukup centang. Ini risiko terbesar checklist ditinggalkan
   seperti Kitchen Display.

---

## 6. Di mana barangnya

| Hal | Tempat |
|---|---|
| Kode POS | repo ini, `main` + `claude/fnb-barcode-qr-ordering-sipjps` |
| Deploy POS | Vercel `bbqiu-pos` |
| Database POS | Supabase `useaopckwgbkbeyyloil` |
| Kode Checklist | proyek Apps Script (belum diversikan di git) |
| Data Checklist | Google Sheet + folder Drive di akun resto |
| **Semua PIN POS** | Google Doc **"Pin pos bbqiu"** di Drive |
| PIN Checklist | Script Properties `OWNER_PIN` |
| Token Telegram | Vercel env `TELEGRAM_BOT_TOKEN` / `TELEGRAM_CHAT_ID`, dan Script Properties di Apps Script |
| Demo jualan — resto | https://claude.ai/artifact/SRSY7nGqX4AS3U1XpS5Xxv |
| Demo jualan — umum | https://claude.ai/artifact/5znBZMdPMYKadBcyT3BktH |

Kedua demo masih **privat**. Supaya calon pembeli bisa membukanya, ubah
lewat menu Share di halaman itu. Nomor kontak di penutupnya masih
placeholder `[isi nomor WhatsApp Anda di sini]`.

Demo umum memuat 5 template: Resto & Kafe dan Teknisi Lapangan diambil
dari checklist yang dipakai di lapangan (yang teknisi dari
`CHECKLIST_SERVICE_BERKALA` dan `CHECKLIST_PEMASANGAN_AC` Rejeki Utama
AC); tiga lainnya bertanda contoh template.
