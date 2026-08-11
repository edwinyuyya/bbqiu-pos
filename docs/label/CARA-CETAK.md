# Label harga showcase chiller

Dua berkas siap dibawa ke percetakan sticker:

| Berkas | Ukuran label | Isi | Lembar A4 |
|---|---|---|---|
| `Label-Harga-90x55.pdf` | 90 × 55 mm | 59 label | 6 |
| `Label-Harga-60x40.pdf` | 60 × 40 mm | 59 label | 4 |

Ukuran 90×55 mm (seukuran kartu nama) untuk nampan besar dan mudah dibaca
dari sekitar satu meter. Ukuran 60×40 mm untuk nampan kecil.

## Yang perlu disebutkan ke percetakan

- **Bahan:** sticker vinyl, bukan sticker kertas. Chiller berembun; sticker
  kertas akan menggelembung dan lepas dalam beberapa hari.
- **Laminasi doff** supaya tidak memantulkan lampu chiller ke mata pelanggan
  dan tahan diseka lap basah.
- **Ukuran asli, jangan diperbesar/diperkecil** ("100%", "actual size").
  Kalau diskalakan, ukuran labelnya tidak lagi 90×55 mm.
- **Potong mengikuti garis abu-abu tipis** di tiap label (kiss cut kalau
  memungkinkan, supaya mudah dikelupas).

## Memperbarui saat harga berubah

Harga di berkas ini adalah salinan, bukan sambungan langsung ke sistem.
Kalau harga berubah:

1. Ekspor ulang daftar menunya ke `docs/label/menu.json`
   (nama, price, description, needs_cook_method, discount_percent).
2. Jalankan `node docs/buat-label-harga.mjs`.

Untuk mencetak beberapa label saja — misalnya satu menu yang harganya baru
naik — tidak perlu berkas ini. Buka **Admin → 🏷️ Label Harga**, centang
menunya, lalu tekan cetak.

Tampilan labelnya diambil dari blok CSS `Label harga untuk showcase chiller`
di `app/globals.css`, jadi halaman Admin dan PDF ini tidak akan pernah
berbeda bentuknya.
