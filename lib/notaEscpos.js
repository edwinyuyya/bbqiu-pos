// Susunan struk pelanggan & struk dapur dalam perintah ESC/POS.
//
// Sengaja terpisah dari komponen React supaya isinya bisa diuji tanpa
// browser, dan supaya struk termal serta tampilan layar tidak saling
// menyalin susunan yang gampang beda sendiri.

import { Struk, LEBAR_58MM } from './escpos';
import { variantSuffix } from './variants';

function rupiah(n) { return 'Rp ' + Number(n || 0).toLocaleString('id-ID'); }

function waktuWIB(ts) {
  if (!ts) return '';
  return new Date(ts).toLocaleString('id-ID', {
    timeZone: 'Asia/Jakarta',
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

export function notaPelanggan({ order, items, merchant = 'BBQIU', persenPajak = 0 }) {
  const s = new Struk(LEBAR_58MM);

  s.rata(1).ukuran(0x11).tebal(true).baris(merchant).ukuran(0).tebal(false);
  s.baris('SOLO').rata(0);
  s.garis();

  s.duaKolom('No. Order', `#${order.order_no}`);
  s.duaKolom('Meja', String(order.table_number ?? '-'));
  s.duaKolom('Waktu', waktuWIB(order.created_at));
  if (order.customer_name) s.duaKolom('Nama', order.customer_name);
  s.garis();

  for (const it of items || []) {
    s.baris(`${it.name}${variantSuffix(it)}`);
    s.duaKolom(`  ${it.qty} x ${rupiah(it.price)}`, rupiah(it.qty * it.price));
    if (it.note) s.baris(`  * ${it.note}`);
  }

  if (!(items || []).length) {
    s.baris('(tidak ada item)');
  }

  s.garis();
  s.duaKolom('Subtotal', rupiah(order.subtotal));
  if (Number(order.discount) > 0) {
    s.duaKolom(`Diskon${order.promo_code ? ` (${order.promo_code})` : ''}`, `-${rupiah(order.discount)}`);
  }
  if (Number(order.tax) > 0) s.duaKolom(`PB1 ${persenPajak}%`, rupiah(order.tax));

  s.tebal(true).duaKolom('TOTAL', rupiah(order.total)).tebal(false);
  s.garis();

  s.duaKolom('Bayar', order.payment_method === 'qris' ? 'QRIS' : 'Kasir');
  s.duaKolom('Status', order.payment_status === 'paid' ? 'LUNAS' : 'BELUM BAYAR');
  s.garis();

  s.tengah('Terima kasih');
  s.tengah('Selamat menikmati!');
  s.kosong();
  s.tengah('- Nexora POS -');

  return s.selesai();
}

// Struk dapur: tanpa harga, nama menu dibesarkan supaya terbaca dari jarak
// satu meja kerja di dapur yang ramai.
//
// stations: [{ nama, batchNo?, kelompok: [[namaKategori, items], …] }]
// Semua station digabung jadi satu kiriman dengan potongan di antaranya —
// mengirim beberapa kali berturut-turut ke printer bluetooth sering membuat
// cetakan kedua terpotong karena sambungannya belum sempat siap.
export function strukDapur({ order, stations }) {
  const s = new Struk(LEBAR_58MM);

  (stations || []).forEach((st, i) => {
    s.rata(1).ukuran(0x11).tebal(true).baris(st.nama || 'DAPUR').ukuran(0).tebal(false).rata(0);
    s.garis();
    s.duaKolom(`#${order.order_no}`, `Meja ${order.table_number ?? '-'}`);
    s.duaKolom('Masuk', waktuWIB(order.created_at));
    if (st.batchNo > 1) s.tebal(true).baris(`PESANAN TAMBAHAN ke-${st.batchNo}`).tebal(false);
    s.duaKolom('Bayar', st.statusBayar || '-');
    s.garis();

    for (const [nama, daftar] of st.kelompok || []) {
      if (nama) s.tebal(true).baris(`>> ${String(nama).toUpperCase()}`).tebal(false);
      for (const it of daftar) {
        s.ukuran(0x01).baris(`${it.qty}x ${it.name}${variantSuffix(it)}`).ukuran(0);
        if (it.fry_first) s.baris('    [GORENG DULU]');
        if (it.note) s.baris(`    * ${it.note}`);
      }
    }

    s.garis();
    if (order.note) s.baris(`Catatan order: ${order.note}`);
    s.tengah(`--- ${st.nama} ---`);

    // Potong tiap station kecuali yang terakhir; yang terakhir dipotong oleh
    // selesai() di bawah.
    if (i < stations.length - 1) s.perintah(0x1b, 0x64, 4).perintah(0x1d, 0x56, 0x01);
  });

  return s.selesai();
}
