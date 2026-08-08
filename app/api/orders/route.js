import { NextResponse } from 'next/server';
import { supabaseServer } from '../../../lib/supabaseServer';
import { taxPercent } from '../../../lib/tax';
import { COOK_METHOD_IDS, DRINK_TEMP_IDS, SWEETNESS_IDS } from '../../../lib/variants';
import { STATION_GORENG } from '../../../lib/stations';

export const dynamic = 'force-dynamic';

const TAX_PERCENT = taxPercent();

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
    .select('id, name, price, available, daily_qty, station_id, category_id, needs_cook_method, needs_drink_option, needs_fry_first, categories(station_id)')
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
    // Menu shao kao digoreng dulu, baru dibakar. Baris pesanannya masuk ke
    // station Goreng lebih dulu; setelah ditandai selesai di sana, barulah
    // pindah sendiri ke station Bakaran.
    const stationAkhir = m.station_id || m.categories?.station_id || null;
    const duaTahap = !!m.needs_fry_first;
    const station = duaTahap ? STATION_GORENG : stationAkhir;
    const cookMethod = COOK_METHOD_IDS.includes(it.cook_method) ? it.cook_method : null;
    if (m.needs_cook_method && !cookMethod)
      return NextResponse.json(
        { error: `Pilih Grill atau Steamboat untuk "${m.name}".` },
        { status: 400 }
      );
    const drinkTemp = DRINK_TEMP_IDS.includes(it.drink_temp) ? it.drink_temp : null;
    const sweetness = SWEETNESS_IDS.includes(it.sweetness) ? it.sweetness : null;
    if (m.needs_drink_option && (!drinkTemp || !sweetness))
      return NextResponse.json(
        { error: `Pilih es/panas dan tingkat manis untuk "${m.name}".` },
        { status: 400 }
      );
    lineItems.push({
      menu_item_id: m.id,
      name: m.name,
      price: Number(m.price),
      qty,
      note: (it.note || '').toString().slice(0, 200) || null,
      station_id: station,
      kitchen_status: 'queued',
      cook_method: cookMethod,
      drink_temp: drinkTemp,
      sweetness,
      stage: duaTahap ? 'goreng' : null,
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

  // 3) Kalau meja ini masih punya bill berjalan yang BELUM dibayar, pesanan
  // baru menempel ke bill itu sebagai tambahan — bukan bikin bill sendiri.
  // Bill yang sudah lunas sengaja tidak diutak-atik: menambah item ke sana
  // akan membuat jumlah yang sudah dibayar tidak lagi cocok dengan totalnya.
  const { data: billBerjalan } = await db
    .from('orders')
    .select('*')
    .eq('table_id', table.id)
    .in('status', ['open', 'preparing', 'served'])
    .neq('payment_status', 'paid')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  const tambahanSubtotal = lineItems.reduce((s, l) => s + l.price * l.qty, 0);
  let order;
  let batchNo = 1;

  if (billBerjalan) {
    // Gelombang berikutnya untuk bill yang sama.
    const { data: batchTerakhir } = await db
      .from('order_items')
      .select('batch_no')
      .eq('order_id', billBerjalan.id)
      .order('batch_no', { ascending: false })
      .limit(1)
      .maybeSingle();
    batchNo = Number(batchTerakhir?.batch_no || 1) + 1;

    const { error: iErr } = await db
      .from('order_items')
      .insert(lineItems.map((l) => ({ ...l, order_id: billBerjalan.id, batch_no: batchNo })));
    if (iErr)
      return NextResponse.json({ error: 'Gagal menyimpan item tambahan' }, { status: 500 });

    // Total dihitung ulang dari SELURUH item hidup, bukan ditambahkan ke
    // total lama — supaya tetap benar walau ada item yang dibatalkan.
    const { data: semua } = await db
      .from('order_items')
      .select('price, qty')
      .eq('order_id', billBerjalan.id)
      .is('cancelled_at', null);
    const subtotalBaru = (semua || []).reduce((s, l) => s + Number(l.price) * Number(l.qty), 0);
    const taxBaru = Math.round((subtotalBaru * TAX_PERCENT) / 100);

    const patch = {
      subtotal: subtotalBaru,
      tax: taxBaru,
      total: subtotalBaru + taxBaru,
      payment_method, // pelanggan boleh ganti cara bayar untuk total barunya
      status: billBerjalan.status === 'served' ? 'open' : billBerjalan.status,
    };
    if (!billBerjalan.customer_name && customer_name)
      patch.customer_name = customer_name.toString().slice(0, 80);
    if (note) {
      const lama = billBerjalan.note ? `${billBerjalan.note}\n` : '';
      patch.note = `${lama}[Tambahan ${batchNo}] ${note}`.slice(0, 300);
    }

    const { data: updated, error: uErr } = await db
      .from('orders').update(patch).eq('id', billBerjalan.id).select().single();
    if (uErr) return NextResponse.json({ error: 'Gagal memperbarui bill' }, { status: 500 });
    order = updated;
  } else {
    const tax = Math.round((tambahanSubtotal * TAX_PERCENT) / 100);
    const { data: baru, error: oErr } = await db
      .from('orders')
      .insert({
        table_id: table.id,
        table_number: table.table_number,
        status: 'open',
        payment_method,
        payment_status: 'unpaid',
        subtotal: tambahanSubtotal,
        tax,
        total: tambahanSubtotal + tax,
        customer_name: (customer_name || '').toString().slice(0, 80) || null,
        note: (note || '').toString().slice(0, 300) || null,
      })
      .select()
      .single();
    if (oErr)
      return NextResponse.json({ error: 'Gagal membuat order' }, { status: 500 });

    const { error: iErr } = await db
      .from('order_items')
      .insert(lineItems.map((l) => ({ ...l, order_id: baru.id, batch_no: 1 })));
    if (iErr) {
      await db.from('orders').delete().eq('id', baru.id);
      return NextResponse.json({ error: 'Gagal menyimpan item' }, { status: 500 });
    }
    order = baru;
  }

  // Antrian cetak dapur dicatat per gelombang, supaya struk tambahan hanya
  // memuat pesanan barunya saja.
  await db.from('print_jobs').insert({ order_id: order.id, status: 'pending', batch_no: batchNo });

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
