# Rencana Bisnis — Wisata Spiritual & Ziarah

Dokumen kerja internal. Jangan dipublikasikan di website.

Semua angka di sini adalah **estimasi kisaran pasar Jogja & Jawa Tengah** yang
dipakai sebagai isi awal `data/paket.js`. Ganti dengan angka asli dari vendor
Anda sebelum website dipublikasikan.

---

## 1. Struktur biaya per perjalanan

Biaya dipisah jadi dua jenis, dan pemisahan inilah yang menentukan harga.

**Biaya tetap per keberangkatan** — besarnya sama, mau diisi 2 orang atau 15 orang:

| Pos | Estimasi |
|---|---|
| Innova + pengemudi (12 jam) | Rp 700.000 |
| HiAce + pengemudi (12 jam) | Rp 1.200.000 |
| Elf / bus medium (12 jam) | Rp 1.300.000 |
| BBM + tol + parkir (dalam DIY) | Rp 350.000 |
| BBM + tol + parkir (lintas Jateng) | Rp 600.000 |
| Pemandu pendamping | Rp 400.000 / hari |
| Pendamping spiritual biasa | Rp 750.000 / hari |
| Pendamping spiritual senior | Rp 1.500.000 / hari |
| Penghormatan juru kunci | Rp 150.000 – 300.000 per lokasi |
| Uborampe dasar bersama | Rp 150.000 – 250.000 |

**Biaya variabel per orang** — naik seiring jumlah peserta:

| Pos | Estimasi |
|---|---|
| Tiket masuk | Rp 10.000 – 25.000 per lokasi |
| Makan | Rp 35.000 – 45.000 per kali |
| Air mineral | Rp 10.000 |
| Asuransi perjalanan | Rp 15.000 per hari |
| Sewa busana adat (Imogiri) | Rp 30.000 |

> **Inilah alasan harga per kepala turun saat rombongan membesar.** Biaya tetap
> dibagi rata. Bukan karena layanan open trip lebih rendah mutunya — itu poin
> yang layak Anda jelaskan terus terang ke calon pelanggan.

---

## 2. Hitungan untung-rugi tiap paket

### Open Trip — titik impas ada di 10 orang

Rute 3 lokasi dalam DIY, kendaraan Elf, harga jual Rp 385.000 per orang.

```
Biaya tetap per keberangkatan
  Elf + pengemudi                      1.300.000
  BBM + tol + parkir                     400.000
  Pemandu pendamping                     400.000
  Juru kunci 3 lokasi @150.000           450.000
  Uborampe bersama                       200.000
                                     ------------
                                       2.750.000

Biaya variabel per orang
  Tiket 3 lokasi @15.000                  45.000
  Makan 1x                                35.000
  Air mineral                             10.000
  Asuransi                                15.000
                                     ------------
                                         105.000

Kontribusi per peserta = 385.000 - 105.000 = 280.000
TITIK IMPAS = 2.750.000 / 280.000 = 9,8  →  10 orang
```

| Terisi | Pemasukan | Biaya | Laba kotor |
|---|---|---|---|
| 8 orang | Rp 3.080.000 | Rp 3.590.000 | **–Rp 510.000** |
| 10 orang | Rp 3.850.000 | Rp 3.800.000 | Rp 50.000 |
| 12 orang | Rp 4.620.000 | Rp 4.010.000 | Rp 610.000 |
| 15 orang | Rp 5.775.000 | Rp 4.325.000 | **Rp 1.450.000** |

**Kesimpulan operasional:** jangan pernah memberangkatkan open trip di bawah 10
orang. Umumkan kuota minimal 10 sejak awal, dan sediakan opsi jadwal ulang bila
kuota tidak terpenuhi. Ini aturan yang paling sering dilanggar operator pemula,
dan paling cepat menghabiskan modal.

### Rombongan 8 orang — margin paling sehat

```
Pemasukan  8 × 720.000                 5.760.000
Biaya
  HiAce + pengemudi                    1.200.000
  BBM + tol + parkir                     400.000
  Pemandu                                400.000
  Juru kunci 4 lokasi                    600.000
  Tiket 8 × 4 × 15.000                   480.000
  Uborampe                               250.000
  Makan 8 × 2 × 40.000                   640.000
  Air + asuransi                         200.000
                                     ------------
                                       4.170.000
LABA KOTOR                             1.590.000   (27,6%)
```

### Private Berdua — margin paling tipis, dan itu disengaja

```
Pemasukan  2 × 1.450.000               2.900.000
Biaya
  Innova + pengemudi                     700.000
  BBM + tol + parkir                     350.000
  Pemandu                                400.000
  Juru kunci 3 lokasi                    450.000
  Tiket, makan, air, asuransi            310.000
  Uborampe dasar                         150.000
                                     ------------
                                       2.360.000
LABA KOTOR                               540.000   (18,6%)
```

**Peringatan.** Paket ini paling sering ditanyakan tapi paling tipis untungnya.
Tiga pilihan Anda:

1. **Naikkan ke Rp 1.750.000 per orang.** Pasar private umumnya tidak sensitif
   harga — mereka membeli keleluasaan, bukan kemurahan.
2. **Anda sendiri yang memandu** di tahun pertama. Menghemat Rp 400.000 dan
   sekaligus membangun hubungan langsung dengan pelanggan.
3. **Biarkan tipis sebagai pintu masuk.** Pelanggan private yang puas adalah
   sumber rujukan paling kuat, dan sebagian akan naik ke paket Laku Tirakat
   yang marginnya jauh lebih besar.

Rekomendasi: gabungkan nomor 1 dan 2 di enam bulan pertama.

---

## 3. Titik impas bulanan

Perkiraan biaya tetap bulanan di awal:

| Pos | Per bulan |
|---|---|
| Domain + hosting (Vercel gratis, domain .id) | Rp 25.000 |
| Iklan Instagram / Meta | Rp 1.500.000 |
| Pulsa, internet, administrasi | Rp 400.000 |
| Cadangan pembatalan & risiko | Rp 500.000 |
| **Total** | **Rp 2.425.000** |

Untuk menutupnya, cukup salah satu dari:

- 2 open trip terisi 15 orang (laba Rp 2.900.000), atau
- 2 rombongan 8 orang (laba Rp 3.180.000), atau
- 1 Laku Tirakat 2 orang + 1 open trip penuh.

Artinya: **empat sampai enam keberangkatan sebulan sudah membuat usaha ini
sehat** — asalkan open trip tidak pernah berangkat di bawah kuota.

---

## 4. Urutan membangun, dari modal paling kecil

Tidak perlu semua sekaligus. Urutan ini menekan modal awal.

**Bulan 1–2 — modal hampir nol**
- Publikasikan website ini (Vercel gratis, domain sekitar Rp 200.000/tahun).
- Buka akun Instagram, isi 12 unggahan pertama sebelum beriklan.
- Belum punya kendaraan sendiri: sewa per trip. Jangan beli apa pun.
- Jalankan 2 open trip percobaan dengan harga promosi, isi teman dan keluarga.
  Tujuannya bukan untung, tapi mendapat foto, video, dan testimoni asli.

**Bulan 3–4 — mulai berbayar**
- Ganti seluruh motif batik di website dengan foto asli hasil trip percobaan.
- Mulai iklan Instagram dengan anggaran kecil, Rp 50.000 per hari.
- Urus NIB lewat OSS (gratis, online). Tampilkan di footer website — pembeda
  besar di mata calon pelanggan yang takut ditipu.

**Bulan 5–6 — perkuat kepercayaan**
- Kumpulkan minimal 10 testimoni tertulis dengan izin publikasi.
- Buat halaman testimoni di website.
- Pertimbangkan bergabung dengan asosiasi (ASITA/ASPPI) bila hendak menggarap
  rombongan kantor dan instansi.

**Modal awal realistis: Rp 3–5 juta**, sebagian besar untuk iklan dan domain.

---

## 5. Legalitas & risiko

**Yang perlu diurus, berurutan:**

1. **NIB lewat OSS** — gratis, online, KBLI 79111 (Aktivitas Agen Perjalanan
   Wisata) atau 79121 (Aktivitas Biro Perjalanan Wisata). Ini yang paling
   penting, dan paling murah.
2. **Rekening atas nama badan usaha**, bukan rekening pribadi. Ini pembeda
   yang langsung terasa oleh calon pelanggan yang pernah ditipu.
3. **Asuransi perjalanan** per peserta. Ada penyedia yang menjual per orang per
   hari, tidak perlu polis tahunan.
4. **Perjanjian tertulis dengan setiap vendor** — pengemudi, pendamping,
   penginapan. Cukup satu halaman, tapi tertulis.

**Risiko terbesar, berurutan dari yang paling mungkin terjadi:**

| Risiko | Cara menekan |
|---|---|
| Open trip tidak memenuhi kuota | Kuota minimal diumumkan sejak awal; opsi jadwal ulang; jangan nekat berangkat |
| Peserta cedera di destinasi berat | Penyaringan kesehatan tertulis; asuransi; batalkan bila cuaca buruk |
| Cuaca / status gunung naik | Pantau BPPTKG sampai H-1; siapkan rute cadangan; kebijakan pengembalian penuh |
| Vendor mendadak batal | Punya minimal dua pilihan untuk tiap pos |
| Reputasi rusak karena satu insiden | Jangan pernah menjanjikan hasil; dokumentasikan semua kesepakatan |
| Peserta datang dalam krisis berat | Tolak dengan halus, sarankan pendampingan yang tepat — ini juga melindungi Anda secara hukum |

**Catatan hukum yang perlu Anda pegang.** Selama Anda menjual *jasa perjalanan*
— transport, pendampingan, akses, perlengkapan — posisi Anda jelas sebagai biro
perjalanan. Yang membuat pelaku usaha sejenis terjerat pidana adalah saat mereka
menjual *hasil*: janji kaya, sembuh, atau menang perkara. Itu masuk penipuan
menurut Pasal 378 KUHP, dan tidak terlindungi oleh dalih apa pun. Halaman
`/etika` di website ini adalah pernyataan publik Anda soal batas itu — pegang
konsisten, termasuk saat ada tawaran uang besar.

---

## 6. Menghitung ulang harga sendiri

Rumus yang dipakai `data/paket.js`:

```
Harga per orang = (Biaya tetap / jumlah peserta) + Biaya variabel per orang + Margin

Margin yang disarankan:
  Open trip      25 – 30%
  Rombongan      25 – 30%
  Private        30 – 40%   (naikkan, jangan ikuti angka contoh)
  Laku Tirakat   35 – 45%   (waktu dan tanggung jawab jauh lebih besar)
```

Sesudah menghitung, bulatkan ke atas ke kelipatan Rp 25.000 supaya enak dibaca,
lalu masukkan ke array `tarif` di `data/paket.js`. Kalkulator di website
otomatis ikut berubah.
