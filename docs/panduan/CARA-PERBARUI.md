# Cara memperbarui buku panduan

Isi buku ada di `bab/` — satu berkas HTML per bab. Ubah teksnya di sana,
lalu jalankan:

```
npm i -D playwright-core     # sekali saja
node docs/buat-panduan.mjs
```

Enam PDF akan dibuat ulang di folder ini.

## Kenapa dipecah per bab

Satu bab dipakai ulang oleh beberapa buku. Bab **Aturan Emas** muncul di
semua buku; bab **Gudang** muncul di buku Gudang dan buku Admin & Owner.
Karena sumbernya satu, panduan kasir tidak pernah bisa berbeda isinya
dengan panduan lengkap.

## Menambah atau memindahkan bab

Semua diatur di `docs/buat-panduan.mjs`:

- `BAB` — daftar bab yang tersedia, beserta judul dan lencana perannya.
- `BUKU` — buku apa saja yang dibuat, dan bab mana saja yang masuk.

Nomor bab **jangan ditulis di dalam berkas babnya**. Pakai penanda
`{{NO}}` pada judul; tiap buku menomori ulang sendiri sesuai urutannya.

## Nomor halaman di daftar isi

Dihitung otomatis dengan merender tiap bab lebih dulu, bukan ditebak dari
jumlah `<div class="page">` — bab yang isinya panjang meluber jadi dua
halaman cetak. Setelah semua PDF jadi, skrip mencocokkan jumlah halaman
hasil render dengan hitungan daftar isi; kalau meleset, skrip berhenti
dengan kode error dan menyebutkan buku mana yang salah.

## Kalau Chromium tidak ketemu

Isi `CHROME_PATH` dengan lokasi Chrome/Chromium di komputer Anda:

```
CHROME_PATH="/usr/bin/google-chrome" node docs/buat-panduan.mjs
```
