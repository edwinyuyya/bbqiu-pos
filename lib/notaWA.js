// Menyusun nota sebagai teks WhatsApp.
//
// Bukan gambar dan bukan PDF: tamu membacanya langsung di gelembung chat,
// tanpa mengunduh apa pun, dan tetap terbaca di HP kentang. Tautan ke nota
// lengkap ditaruh di bawah untuk yang mau versi resminya.

import { variantSuffix } from './variants';

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

export function notaTeksWA({ order, items, merchant = 'BBQIU', persenPajak = 0, tautan = '' }) {
  const b = [];
  b.push(`*${merchant}*`);
  b.push(`Nota #${order.order_no} · Meja ${order.table_number ?? '-'}`);
  b.push(waktuWIB(order.created_at));
  if (order.customer_name) b.push(`Nama: ${order.customer_name}`);
  b.push('');

  const hidup = (items || []).filter((it) => !it.cancelled_at);
  for (const it of hidup) {
    b.push(`${it.qty}× ${it.name}${variantSuffix(it)}`);
    // Potongan ditulis di barisnya sendiri. Satu angka diskon di bawah membuat
    // tamu mengira seluruh isi nota ikut dipotong — dan yang meladeni
    // perdebatannya adalah waiter yang tidak memegang bill.
    b.push(`    ${rupiah(Number(it.price) * Number(it.qty))}`);
    if (Number(it.discount) > 0) {
      const ket = String(it.discount_note || '').trim();
      b.push(`    diskon${ket ? ` ${ket}` : ''} −${rupiah(it.discount)}`);
    }
  }
  if (!hidup.length) b.push('(tidak ada item)');

  b.push('');
  b.push(`Subtotal: ${rupiah(order.subtotal)}`);
  if (Number(order.discount) > 0) {
    b.push(`Diskon${order.promo_code ? ` (${order.promo_code})` : ''}: −${rupiah(order.discount)}`);
  }
  if (Number(order.tax) > 0) b.push(`PB1 ${persenPajak}%: ${rupiah(order.tax)}`);
  b.push(`*TOTAL: ${rupiah(order.total)}*`);
  b.push(order.payment_status === 'paid' ? 'Status: LUNAS ✅' : 'Status: BELUM BAYAR');

  if (tautan) {
    b.push('');
    b.push(`Nota lengkap: ${tautan}`);
  }
  b.push('');
  b.push('Terima kasih sudah makan di BBQIU 🙏');

  return b.join('\n');
}
