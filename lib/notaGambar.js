// Menggambar nota jadi berkas gambar (JPEG) di browser.
//
// KENAPA GAMBAR, BUKAN LAMPIRAN PDF LEWAT wa.me:
// tautan wa.me hanya bisa membawa TEKS. Tidak ada cara mengirim lampiran
// lewat click-to-chat, sebagus apa pun berkasnya dibuat. Satu-satunya jalan
// tanpa API berbayar adalah membuat berkasnya di HP kasir lalu menyerahkannya
// ke lembar "bagikan" bawaan Android (Web Share), yang menaruh WhatsApp
// sebagai salah satu tujuan. Dari sana berkasnya benar-benar terkirim sebagai
// lampiran, bukan teks.
//
// Digambar sendiri di canvas, bukan memotret halaman: tidak butuh pustaka
// tambahan, hasilnya tajam berapa pun kerapatan layar tabletnya, dan tidak
// ikut terpengaruh tema gelap/terang aplikasi.

import { variantSuffix } from './variants';

const L = 640;          // lebar gambar (px)
const TEPI = 40;        // margin kiri-kanan
const ISI = L - TEPI * 2;

function rupiah(n) { return 'Rp ' + Number(n || 0).toLocaleString('id-ID'); }

function waktuWIB(iso) {
  if (!iso) return '';
  try {
    return new Date(iso).toLocaleString('id-ID', {
      timeZone: 'Asia/Jakarta',
      day: '2-digit', month: 'long', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  } catch { return ''; }
}

// Susun dulu daftar perintah gambarnya, baru dihitung tingginya. Kalau tinggi
// kanvas ditebak di muka, nota panjang terpotong di bawah — dan yang terpotong
// justru bagian totalnya.
function susun({ order, items, merchant, persenPajak }) {
  const b = [];
  const hidup = (items || []).filter((it) => !it.cancelled_at);

  b.push({ t: 'tengah', teks: merchant, ukuran: 34, tebal: true });
  b.push({ t: 'tengah', teks: 'SOLO', ukuran: 15, warna: '#666' });
  b.push({ t: 'jarak', h: 10 });
  b.push({ t: 'garis' });
  b.push({ t: 'dua', kiri: 'No. Nota', kanan: `#${order.order_no}` });
  b.push({ t: 'dua', kiri: 'Meja', kanan: String(order.table_number ?? '-') });
  b.push({ t: 'dua', kiri: 'Waktu', kanan: waktuWIB(order.created_at) });
  if (order.customer_name) b.push({ t: 'dua', kiri: 'Nama', kanan: order.customer_name });
  b.push({ t: 'garis' });

  for (const it of hidup) {
    b.push({ t: 'kiri', teks: `${it.name}${variantSuffix(it)}`, tebal: true });
    b.push({
      t: 'dua',
      kiri: `   ${it.qty} × ${rupiah(it.price)}`,
      kanan: rupiah(Number(it.price) * Number(it.qty)),
    });
    if (Number(it.discount) > 0) {
      b.push({
        t: 'dua',
        kiri: `   diskon ${it.discount_note || ''}`.trimEnd(),
        kanan: `− ${rupiah(it.discount)}`,
        warna: '#15803d',
      });
    }
    if (it.note) b.push({ t: 'kiri', teks: `   * ${it.note}`, ukuran: 15, warna: '#555' });
  }
  if (!hidup.length) b.push({ t: 'kiri', teks: '(tidak ada item)', warna: '#666' });

  b.push({ t: 'garis' });
  b.push({ t: 'dua', kiri: 'Subtotal', kanan: rupiah(order.subtotal) });
  if (Number(order.discount) > 0) {
    b.push({
      t: 'dua',
      kiri: `Diskon${order.promo_code ? ` (${order.promo_code})` : ''}`,
      kanan: `− ${rupiah(order.discount)}`,
      warna: '#15803d',
    });
  }
  if (Number(order.tax) > 0) b.push({ t: 'dua', kiri: `PB1 ${persenPajak}%`, kanan: rupiah(order.tax) });
  b.push({ t: 'dua', kiri: 'TOTAL', kanan: rupiah(order.total), ukuran: 26, tebal: true });
  b.push({ t: 'garis' });
  b.push({
    t: 'dua',
    kiri: 'Status',
    kanan: order.payment_status === 'paid' ? 'LUNAS' : 'BELUM BAYAR',
    tebal: true,
    warna: order.payment_status === 'paid' ? '#15803d' : '#b45309',
  });
  b.push({ t: 'jarak', h: 14 });
  b.push({ t: 'tengah', teks: 'Terima kasih sudah makan di BBQIU', ukuran: 17 });
  b.push({ t: 'tengah', teks: 'Sampai jumpa lagi!', ukuran: 15, warna: '#666' });

  return b;
}

const TINGGI_BARIS = (u) => Math.round(u * 1.45);

export function gambarNota({ order, items, merchant = 'BBQIU', persenPajak = 0 }) {
  const baris = susun({ order, items, merchant, persenPajak });

  let tinggi = TEPI;
  for (const x of baris) {
    if (x.t === 'jarak') tinggi += x.h;
    else if (x.t === 'garis') tinggi += 18;
    else tinggi += TINGGI_BARIS(x.ukuran || 19);
  }
  tinggi += TEPI;

  const c = document.createElement('canvas');
  c.width = L;
  c.height = Math.ceil(tinggi);
  const g = c.getContext('2d');

  g.fillStyle = '#ffffff';
  g.fillRect(0, 0, c.width, c.height);
  g.textBaseline = 'top';

  const font = (u, tebal) =>
    `${tebal ? '700 ' : ''}${u}px -apple-system, "Segoe UI", Roboto, Arial, sans-serif`;

  let y = TEPI;
  for (const x of baris) {
    if (x.t === 'jarak') { y += x.h; continue; }
    if (x.t === 'garis') {
      g.strokeStyle = '#d8d8d8';
      g.lineWidth = 1;
      g.beginPath();
      g.moveTo(TEPI, y + 8.5);
      g.lineTo(L - TEPI, y + 8.5);
      g.stroke();
      y += 18;
      continue;
    }

    const u = x.ukuran || 19;
    g.font = font(u, x.tebal);
    g.fillStyle = x.warna || '#111111';

    // Dipakai baris kiri maupun kolom kiri: apa pun yang lebih lebar dari
    // ruangnya dipotong, bukan dibiarkan menembus tepi kertas.
    const potong = (teks, maks) => {
      if (g.measureText(teks).width <= maks) return teks;
      let t = teks;
      while (t.length > 1 && g.measureText(`${t}…`).width > maks) t = t.slice(0, -1);
      return `${t}…`;
    };

    if (x.t === 'tengah') {
      g.textAlign = 'center';
      g.fillText(x.teks, L / 2, y);
    } else if (x.t === 'dua') {
      g.textAlign = 'left';
      // Kolom kiri dipotong kalau kepanjangan supaya TIDAK PERNAH menabrak
      // angka di kanan. Nominal yang tertimpa teks adalah nota yang tidak bisa
      // dipertanggungjawabkan.
      const lebarKanan = g.measureText(x.kanan).width;
      g.fillText(potong(x.kiri, ISI - lebarKanan - 16), TEPI, y);
      g.textAlign = 'right';
      g.fillText(x.kanan, L - TEPI, y);
    } else {
      g.textAlign = 'left';
      g.fillText(potong(x.teks, ISI), TEPI, y);
    }
    y += TINGGI_BARIS(u);
  }

  return c;
}

export function nulisBlob(canvas, mime = 'image/jpeg', mutu = 0.92) {
  return new Promise((resolve) => canvas.toBlob(resolve, mime, mutu));
}
