import { NextResponse } from 'next/server';
import { supabaseServer } from '../../../../../lib/supabaseServer';
import { sendNotif } from '../../../../../lib/notify';
import { taxPercent } from '../../../../../lib/tax';

export const dynamic = 'force-dynamic';

const TAX_PERCENT = taxPercent();

// POST /api/order-items/:id/cancel  { reason, by }
// Batalkan SATU baris pesanan (mis. bahannya habis) tanpa membatalkan
// seluruh bill. Stok bahan yang sudah terpotong dikembalikan, dan total
// order dihitung ulang dari item yang tersisa.
export async function POST(req, { params }) {
  const { id } = await params;
  const db = supabaseServer();
  let body;
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: 'Body tidak valid' }, { status: 400 });
  }

  const reason = (body.reason || '').toString().trim().slice(0, 200);
  if (!reason) return NextResponse.json({ error: 'Alasan wajib diisi' }, { status: 400 });
  const by = (body.by || '').toString().trim().slice(0, 80) || null;

  const { data: item } = await db
    .from('order_items').select('*').eq('id', id).maybeSingle();
  if (!item) return NextResponse.json({ error: 'Item tidak ditemukan' }, { status: 404 });
  if (item.cancelled_at) return NextResponse.json({ ok: true, sudah_dibatalkan: true });

  const { data: order } = await db
    .from('orders').select('*').eq('id', item.order_id).maybeSingle();
  if (!order) return NextResponse.json({ error: 'Order tidak ditemukan' }, { status: 404 });
  if (['closed', 'cancelled'].includes(order.status))
    return NextResponse.json(
      { error: 'Bill sudah ditutup/dibatalkan — tidak bisa mengubah itemnya' },
      { status: 400 }
    );

  // 1) Tandai batal (tidak dihapus, supaya jejaknya tetap ada untuk audit)
  const { error: uErr } = await db
    .from('order_items')
    .update({
      cancelled_at: new Date().toISOString(),
      cancel_reason: reason,
      cancelled_by: by,
      kitchen_status: 'served', // keluar dari antrian dapur
    })
    .eq('id', id)
    .is('cancelled_at', null);
  if (uErr) return NextResponse.json({ error: 'Gagal membatalkan item' }, { status: 500 });

  // 2) Kembalikan stok bahan yang tadi terpotong resep
  if (item.menu_item_id) {
    const { data: resep } = await db
      .from('recipe_items')
      .select('qty, inventory_items(id, stock_qty)')
      .eq('menu_item_id', item.menu_item_id);
    for (const r of resep || []) {
      const inv = r.inventory_items;
      const kembali = Number(r.qty) * Number(item.qty);
      if (!inv || !kembali) continue;
      await db
        .from('inventory_items')
        .update({ stock_qty: Number(inv.stock_qty) + kembali })
        .eq('id', inv.id);
      await db.from('stock_movements').insert({
        item_id: inv.id,
        type: 'in',
        qty: kembali,
        note: `Batal item: ${item.name} (Order #${order.order_no}) — ${reason}`,
      });
    }

    // Sisa porsi harian ikut dikembalikan kalau menu ini memang dibatasi.
    const { data: menu } = await db
      .from('menu_items').select('daily_qty').eq('id', item.menu_item_id).maybeSingle();
    if (menu?.daily_qty != null) {
      await db
        .from('menu_items')
        .update({ daily_qty: Number(menu.daily_qty) + Number(item.qty) })
        .eq('id', item.menu_item_id);
    }
  }

  // 3) Hitung ulang total dari item yang masih hidup
  const { data: sisa } = await db
    .from('order_items')
    .select('price, qty')
    .eq('order_id', item.order_id)
    .is('cancelled_at', null);
  const subtotal = (sisa || []).reduce((s, l) => s + Number(l.price) * Number(l.qty), 0);
  const tax = Math.round((subtotal * TAX_PERCENT) / 100);
  await db
    .from('orders')
    .update({ subtotal, tax, total: subtotal + tax })
    .eq('id', item.order_id);

  // Pembatalan menyentuh uang — kabari pemilik seperti halnya void bill.
  sendNotif(
    `✖ *ITEM DIBATALKAN*\nOrder #${order.order_no} · Meja ${order.table_number}\n` +
    `${item.qty}× ${item.name}\nAlasan: ${reason}${by ? `\nOleh: ${by}` : ''}\n` +
    `Total baru: Rp ${(subtotal + tax).toLocaleString('id-ID')}`
  );

  return NextResponse.json({ ok: true, subtotal, tax, total: subtotal + tax });
}
