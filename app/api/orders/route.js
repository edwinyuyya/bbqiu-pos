import { NextResponse } from 'next/server';
import { supabaseServer } from '../../../lib/supabaseServer';
import { taxPercent } from '../../../lib/tax';
import { COOK_METHOD_IDS, DRINK_TEMP_IDS, SWEETNESS_IDS } from '../../../lib/variants';
import { recalcOrder } from '../../../lib/recalcOrder';
import { ORDER_TERJADWAL } from '../../../lib/reservation';

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

  // 1) Token bisa milik MEJA (pesanan biasa) atau milik RESERVASI (pra-pesanan).
  // Dibedakan sejak awal karena akibatnya jauh berbeda: pra-pesanan tidak
  // boleh menempel ke bill meja mana pun — kalau menempel, tamu yang sedang
  // duduk di meja itu akan ditagih makanan orang lain.
  const { data: reservasi } = await db
    .from('reservations')
    .select('id, status, customer_name, reserved_date, table_id')
    .eq('token', token)
    .maybeSingle();

  let table = null;
  if (!reservasi) {
    const { data: t, error: tErr } = await db
      .from('tables')
      .select('id, table_number, active')
      .eq('token', token)
      .single();
    if (tErr || !t)
      return NextResponse.json({ error: 'Meja tidak ditemukan' }, { status: 404 });
    if (t.active === false)
      return NextResponse.json({ error: 'Meja tidak aktif' }, { status: 400 });
    table = t;
  } else if (reservasi.status !== 'booked') {
    return NextResponse.json(
      { error: 'Reservasi ini sudah tidak berlaku untuk pra-pesanan.' },
      { status: 400 }
    );
  }

  // 2) Ambil menu otoritatif dari DB (harga & station dari server, bukan client)
  const ids = [...new Set(items.map((i) => i.menu_item_id))];
  const { data: menu, error: mErr } = await db
    .from('menu_items')
    .select('id, name, price, available, daily_qty, station_id, category_id, needs_cook_method, needs_drink_option, needs_fry_first, categories(name, station_id)')
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
    // Sebagian menu shao kao digoreng dulu sebelum dibakar. Dikerjakan di
    // station yang sama, jadi ini cuma keterangan proses yang ikut tercetak.
    const gorengDulu = !!m.needs_fry_first;
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
      fry_first: gorengDulu,
      category_name: m.categories?.name || null,
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
  // Pra-pesanan reservasi punya "bill"-nya sendiri berstatus 'scheduled' dan
  // TIDAK pernah menempel ke bill meja — meja belum tentu miliknya saat ini.
  let billBerjalan = null;
  if (reservasi) {
    const { data } = await db
      .from('orders')
      .select('*')
      .eq('reservation_id', reservasi.id)
      .eq('status', 'scheduled')
      .maybeSingle();
    billBerjalan = data || null;
  } else if (body.order_id) {
    // Kasir menekan "Tambah Pesanan" pada bill tertentu. Di sini billnya sudah
    // ditunjuk, jadi jangan menebak-nebak lagi — termasuk kalau billnya sudah
    // ditandai lunas. Tamu yang sudah bayar lalu memesan lagi tetap harus
    // menempel ke bill yang sama; membuat bill kedua diam-diam membuat kasir
    // menagih dua kali dan meja terlihat punya dua tagihan.
    const { data } = await db
      .from('orders')
      .select('*')
      .eq('id', body.order_id)
      .in('status', ['open', 'preparing', 'served'])
      .maybeSingle();
    if (!data) {
      return NextResponse.json(
        { error: 'Bill yang dituju sudah ditutup atau dibatalkan. Buat order baru.' },
        { status: 409 },
      );
    }
    if (data.table_id !== table.id) {
      return NextResponse.json({ error: 'Bill ini bukan milik meja tersebut.' }, { status: 400 });
    }
    billBerjalan = data;
  } else {
    const { data } = await db
      .from('orders')
      .select('*')
      .eq('table_id', table.id)
      .in('status', ['open', 'preparing', 'served'])
      .neq('payment_status', 'paid')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    billBerjalan = data || null;
  }

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
      // Pra-pesanan tetap 'scheduled' sampai tamunya benar-benar datang.
      status: billBerjalan.status === 'served' ? 'open' : billBerjalan.status,
    };
    // Bill yang sudah lunas lalu ditambahi pesanan: totalnya naik, tapi
    // uangnya belum diterima untuk selisihnya. Kalau statusnya dibiarkan
    // "Lunas", kasir akan menutup bill tanpa menagih tambahannya. Jadi
    // dikembalikan ke belum-bayar, dengan uang yang sudah masuk disimpan di
    // paid_amount supaya yang perlu ditagih hanya selisihnya.
    if (billBerjalan.payment_status === 'paid') {
      patch.payment_status = 'unpaid';
      patch.paid_amount = Number(billBerjalan.paid_amount || billBerjalan.total || 0);
    }

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
        // Pra-pesanan belum punya meja pasti — mejanya ditentukan saat tamu
        // datang. Statusnya 'scheduled' supaya tidak masuk dapur & kasir.
        table_id: reservasi ? null : table.id,
        table_number: reservasi ? null : table.table_number,
        reservation_id: reservasi ? reservasi.id : null,
        status: reservasi ? ORDER_TERJADWAL : 'open',
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
  // Pra-pesanan belum dicetak ke dapur — struknya baru dibuat saat tamu datang.
  if (!reservasi) {
    await db.from('print_jobs').insert({ order_id: order.id, status: 'pending', batch_no: batchNo });
  }

  // Hitung ulang lewat jalur yang sama dengan promo & pembatalan item, supaya
  // diskon per menu langsung terpasang dan tidak ada dua rumus total.
  await recalcOrder(db, order.id);

  // 7) Kurangi sisa porsi (menu berporsi terbatas). Auto-tutup saat 0.
  for (const m of reservasi ? [] : (menu || [])) {
    if (m.daily_qty == null) continue;
    const ordered = qtyByMenu[m.id] || 0;
    if (!ordered) continue;
    const left = Math.max(0, Number(m.daily_qty) - ordered);
    const patch = { daily_qty: left };
    if (left <= 0) patch.available = false; // habis -> otomatis tutup
    await db.from('menu_items').update(patch).eq('id', m.id);
  }

  // 8) Potong stok bahan otomatis sesuai resep (BOM).
  // Pra-pesanan dilewati: bahannya belum dipakai, dan tamunya bisa batal.
  const invIds = reservasi ? [] : Object.keys(neededByInv);
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
