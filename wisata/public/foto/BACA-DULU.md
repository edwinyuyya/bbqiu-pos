# Cara memasang foto destinasi

Selama folder ini kosong, website menampilkan motif batik buatan sebagai
pengganti foto. Halaman tetap terlihat utuh, jadi Anda tidak perlu terburu-buru.

## Langkahnya

1. Taruh file foto di folder ini, misalnya `parangkusumo-1.jpg`.
2. Buka `data/destinasi.js`, cari destinasi yang dimaksud.
3. Isi array `foto`-nya:

```js
foto: ['/foto/parangkusumo-1.jpg', '/foto/parangkusumo-2.jpg'],
```

Foto pertama otomatis jadi gambar besar di bagian atas halaman. Sisanya muncul
sebagai galeri di bawah.

## Ukuran yang disarankan

- Gambar utama: 1600 × 900 piksel (perbandingan 16:9)
- Galeri: 800 × 600 piksel
- Kompres dulu sebelum diunggah, usahakan di bawah 300 KB per file.
  Bisa lewat squoosh.app, gratis dan tanpa perlu memasang apa pun.

## Video

Unggah ke YouTube lebih dulu, lalu salin ID videonya saja ke `data/destinasi.js`:

```
https://youtube.com/watch?v=AbCdEf123   →   video: 'AbCdEf123',
```

Video ikut ditampilkan di halaman destinasi, di bawah bagian riwayat.

## Hak pakai foto

Pakai foto hasil jepretan sendiri. Mengambil foto dari Google atau akun orang
lain berisiko teguran hak cipta, dan untuk usaha yang menjual kepercayaan,
ketahuan memakai foto orang lain adalah kerugian yang tidak sebanding.
