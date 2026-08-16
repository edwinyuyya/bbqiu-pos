// Label QR meja sebagai perintah ESC/POS.
//
// Jalur cetak browser (window.print) tidak bisa diandalkan untuk printer
// bluetooth 58mm — dan bahkan ketika berhasil, printer menskalakan halaman
// sehingga QR mengecil. Di sini QR dikirim sebagai raster: satu titik di
// perintah sama dengan satu titik di kertas, jadi ukurannya pasti.

import { Struk, LEBAR_58MM } from './escpos';

// 58mm pada 203dpi = 384 titik yang benar-benar tercetak.
export const TITIK_58MM = 384;

function tulisLabel(s, { merchant, tableNumber, modul, size, link, skala }) {
  // Skala sebesar mungkin yang masih muat di 384 titik, disisakan 16 titik
  // (2mm) di tiap sisi sebagai zona sunyi. Dihitung, bukan ditebak, supaya
  // QR yang modulnya lebih banyak (link panjang) tidak jadi kepenuhan.
  const dipakai = skala || Math.max(2, Math.floor((TITIK_58MM - 32) / size));

  s.rata(1);
  s.ukuran(0x00).tebal(true).baris(merchant).tebal(false);
  s.ukuran(0x11).tebal(true).baris(`MEJA ${tableNumber}`).tebal(false).ukuran(0x00);
  s.baris('Scan: panggil waiter');
  s.baris('& lihat pesanan');
  s.kosong();

  s.qr(modul, size, dipakai, TITIK_58MM);

  s.kosong();
  if (link) s.baris(link);
  s.rata(0);
  return s;
}

export function strukLabelMeja({ merchant = 'BBQIU', tableNumber, modul, size, link = '', skala }) {
  const s = new Struk(LEBAR_58MM);
  tulisLabel(s, { merchant, tableNumber, modul, size, link, skala });
  return s.selesai();
}

// Semua meja dalam SATU kiriman.
//
// Mengirim 18 perintah cetak berturut-turut ke printer bluetooth hampir selalu
// menyisakan cetakan yang terpotong: sambungannya belum siap saat kiriman
// berikutnya datang. Digabung jadi satu, dipisah maju kertas + potong.
export function strukLabelMejaBanyak(daftar, merchant = 'BBQIU') {
  const s = new Struk(LEBAR_58MM);
  daftar.forEach((m, i) => {
    tulisLabel(s, { merchant, ...m });
    if (i < daftar.length - 1) s.perintah(0x1b, 0x64, 4).perintah(0x1d, 0x56, 0x01);
  });
  return s.selesai();
}
