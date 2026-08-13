import { taxPercent } from './tax';
import { hitungDiskon } from './promo';

const TAX_PERCENT = taxPercent();

// Hitung ulang SELURUH angka sebuah bill dari isinya, lalu simpan.
//
// Semua jalur yang mengubah isi bill memakai fungsi ini — pesanan baru,
// pesanan tambahan, pembatalan item, pemasangan/pelepasan kode promo.
// Kalau tiap jalur menghitung sendiri, cepat atau lambat salah satunya
// menyimpang dan tagihan pelanggan jadi salah.
//
// promoOverride:
//   undefined -> pakai promo yang sudah menempel di bill (kalau ada)
//   null      -> lepas promo
//   {promo}   -> pasang promo ini
export async function recalcOrder(db, orderId, promoOverride = undefined) {
  const { data: order } = await db
    .from('orders').select('id, promo_id').eq('id', orderId).maybeSingle();
  if (!order) return null;

  let promo = null;
  if (promoOverride === undefined) {
    if (order.promo_id) {
      const { data } = await db.from('promos').select('*').eq('id', order.promo_id).maybeSingle();
      promo = data || null;
    }
  } else {
    promo = promoOverride;
  }

  const { data: baris } = await db
    .from('order_items')
    .select('id, price, qty, cancelled_at, menu_item_id')
    .eq('order_id', orderId);

  // Kategori & diskon menu diambil dari master, bukan disalin ke baris order:
  // admin boleh mengubah diskon menu sampai bill ditutup.
  const menuIds = [...new Set((baris || []).map((b) => b.menu_item_id).filter(Boolean))];
  let menuById = {};
  if (menuIds.length) {
    const { data: menu } = await db
      .from('menu_items')
      .select('id, category_id, discount_percent, promo_eligible')
      .in('id', menuIds);
    menuById = Object.fromEntries((menu || []).map((m) => [m.id, m]));
  }

  const items = (baris || []).map((b) => ({
    id: b.id,
    price: b.price,
    qty: b.qty,
    cancelled_at: b.cancelled_at,
    menu_item_id: b.menu_item_id || null,
    category_id: menuById[b.menu_item_id]?.category_id || null,
    discount_percent: menuById[b.menu_item_id]?.discount_percent || 0,
    promo_eligible: menuById[b.menu_item_id]?.promo_eligible !== false,
  }));

  const hasil = hitungDiskon(items, promo, TAX_PERCENT);

  for (const r of hasil.rincian) {
    await db
      .from('order_items')
      .update({ discount: r.potong, discount_note: r.catatan })
      .eq('id', r.id);
  }

  await db
    .from('orders')
    .update({
      subtotal: hasil.subtotal,
      discount: hasil.diskon,
      tax: hasil.pajak,
      total: hasil.total,
      promo_code: promo ? promo.code : null,
      promo_id: promo ? promo.id : null,
    })
    .eq('id', orderId);

  return hasil;
}
