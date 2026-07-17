import { NextResponse } from 'next/server';
import { supabaseServer } from '../../../lib/supabaseServer';

export const dynamic = 'force-dynamic';

const TAX_PERCENT = Number(process.env.NEXT_PUBLIC_TAX_PERCENT || 0);

// POST /api/orders  -> buat order baru dari keranjang pelanggan
export async function POST(req) {
  const db = supabaseServer();
  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Body tidak valid' }, { status: 400 });
  }

  const { token, customer_name, note, payment_method, items } = body || {};

  if (!token) return NextResponse.json({ error: 'Token meja wajib' }, { status: 400 });
  if (!Array.isArray(items) || items.length === 0)
    return NextResponse.json({ error: 'Keranjang kosong' }, { status: 400 });
  if (!['qris', 'cashier'].includes(payment_method))
    return NextResponse.json({ error: 'Metode bayar tidak valid' }, { status: 400 });

  // 1) Validasi meja
  const { data: table, error: tErr } = await db
    .from('tables')
    .select('id, table_number, active')
    .eq('token', token)
    .single();
  if (tErr || !table)
    return NextResponse.json({ error: 'Meja tidak ditemukan' }, { status: 404 });
  if (table.active === false)
    return NextResponse.json({ error: 'Meja tidak aktif' }, { status: 400 });

  // 2) Ambil menu otoritatif dari DB (harga & station dari server, bukan client)
  const ids = [...new Set(items.map((i) => i.menu_item_id))];
  const { data: menu, error: mErr } = await db
    .from('menu_items')
    .select('id, name, price, available, daily_qty, station_id, category_id, categories(station_id)')
    .in('id', ids);
  if (mErr)
    return NextResponse.json({ error: 'Gagal membaca menu' }, { status: 500 });

  const menuById = Object.fromEntries((menu || []).map((m) => [m.id, m]));

  // Gabungkan qty per menu (kalau client kirim baris terpisah untuk menu sama)
  const qtyByMenu = {};
  for (const it of items) {
    const q = Math.max(1, parseInt(it.qty, 10) || 1);
    qtyByMenu[it.menu_item_id] = (qtyByMenu[it.menu_item_id] || 0) + q;
  }

  const lineItems = [];
  for (const it of items) {
    const m = menuById[it.menu_item_id];
    if (!m || m.available === false)
      return NextResponse.json(
        { error: 'Ada menu yang tidak tersedia' },
        { status: 400 }
      );
    // Cegah oversell untuk menu berporsi terbatas
    if (m.daily_qty != null && qtyByMenu[m.id] > Number(m.daily_qty))
      return NextResponse.json(
        { error: `Porsi "${m.name}" tinggal ${Number(m.daily_qty)}. Kurangi jumlahnya.` },
        { status: 400 }
      );
    const qty = Math.max(1, parseInt(it.qty, 10) || 1);
    const station = m.station_id || m.categories?.station_id || null;
    lineItems.push({
      menu_item_id: m.id,
      name: m.name,
      price: Number(m.price),
      qty,
      note: (it.note || '').toString().slice(0, 200) || null,
      station_id: station,
      kitchen_status: 'queued',
    });
  }

  // 2b) Hitung kebutuhan bahan sesuai resep/BOM (untuk dipotong dari stok).
  // Mode "boleh minus": order TIDAK diblokir walau stok kurang; stok boleh negatif
  // dan akan muncul di alert stok menipis untuk direkonsiliasi.
  const { data: recipeRows } = await db
    .from('recipe_items')
    .select('menu_item_id, qty, inventory_items(id, name, unit, stock_qty)')
    .in('menu_item_id', ids);

  const neededByInv = {}; // inventory_item_id -> { need, name, unit, stock_qty }
  for (const r of recipeRows || []) {
    const orderedQty = qtyByMenu[r.menu_item_id] || 0;
    const inv = r.inventory_items;
    if (!orderedQty || !inv) continue;
    const need = Number(r.qty) * orderedQty;
    if (!neededByInv[inv.id]) neededByInv[inv.id] = { need: 0, name: inv.name, unit: inv.unit, stock_qty: Number(inv.stock_qty) };
    neededByInv[inv.id].need += need;
  }

  // 3) Hitung total
  const subtotal = lineItems.reduce((s, l) => s + l.price * l.qty, 0);
  const tax = Math.round((subtotal * TAX_PERCENT) / 100);
  const total = subtotal + tax;

  // 4) Insert order
  const { data: order, error: oErr } = await db
    .from('orders')
    .insert({
      table_id: table.id,
      table_number: table.table_number,
      status: 'open',
      payment_method,
      payment_status: 'unpaid',
      subtotal,
      tax,
      total,
      customer_name: (customer_name || '').toString().slice(0, 80) || null,
      note: (note || '').toString().slice(0, 300) || null,
    })
    .select()
    .single();
  if (oErr)
    return NextResponse.json({ error: 'Gagal membuat order' }, { status: 500 });

  // 5) Insert item
  const { error: iErr } = await db
    .from('order_items')
    .insert(lineItems.map((l) => ({ ...l, order_id: order.id })));
  if (iErr) {
    await db.from('orders').delete().eq('id', order.id);
    return NextResponse.json({ error: 'Gagal menyimpan item' }, { status: 500 });
  }

  // 6) Buat antrian cetak untuk dapur
  await db.from('print_jobs').insert({ order_id: order.id, status: 'pending' });

  // 7) Kurangi sisa porsi (menu berporsi terbatas). Auto-tutup saat 0.
  for (const m of menu || []) {
    if (m.daily_qty == null) continue;
    const ordered = qtyByMenu[m.id] || 0;
    if (!ordered) continue;
    const left = Math.max(0, Number(m.daily_qty) - ordered);
    const patch = { daily_qty: left };
    if (left <= 0) patch.available = false; // habis -> otomatis tutup
    await db.from('menu_items').update(patch).eq('id', m.id);
  }

  // 8) Potong stok bahan otomatis sesuai resep (BOM)
  const invIds = Object.keys(neededByInv);
  if (invIds.length) {
    for (const invId of invIds) {
      const n = neededByInv[invId];
      await db.from('inventory_items').update({ stock_qty: n.stock_qty - n.need }).eq('id', invId);
    }
    await db.from('stock_movements').insert(
      invIds.map((invId) => ({
        item_id: invId,
        type: 'out',
        qty: neededByInv[invId].need,
        note: `Resep otomatis: Order #${order.order_no}`,
      }))
    );
  }

  return NextResponse.json({ ok: true, order_id: order.id, order_no: order.order_no });
}
