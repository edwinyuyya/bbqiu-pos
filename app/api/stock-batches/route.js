import { NextResponse } from 'next/server';
import { supabaseServer } from '../../../lib/supabaseServer';

export const dynamic = 'force-dynamic';

function todayWIB() {
  const wib = new Date(Date.now() + 7 * 3600 * 1000);
  return `${wib.getUTCFullYear()}-${String(wib.getUTCMonth() + 1).padStart(2, '0')}-${String(wib.getUTCDate()).padStart(2, '0')}`;
}

function genCode(prefix) {
  return `${prefix}-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
}

// Insert satu baris batch dengan retry kalau batch_code bentrok (sangat jarang).
async function insertBatchWithRetry(db, prefix, row) {
  for (let i = 0; i < 3; i++) {
    const batch_code = genCode(prefix);
    const { data, error } = await db.from('stock_batches').insert({ ...row, batch_code }).select().single();
    if (!error) return data;
    if (String(error.code) !== '23505') throw new Error(error.message);
  }
  throw new Error('Gagal membuat kode batch unik');
}

// GET /api/stock-batches?item_id=&status=active -> daftar batch, urut FIFO (tertua dulu)
export async function GET(req) {
  const db = supabaseServer();
  const url = new URL(req.url);
  const itemId = url.searchParams.get('item_id');
  const status = url.searchParams.get('status') || 'active';
  let q = db
    .from('stock_batches')
    .select('*, inventory_items(name, unit, category)')
    .order('produced_date', { ascending: true })
    .order('created_at', { ascending: true });
  if (status !== 'all') q = q.eq('status', status);
  if (itemId) q = q.eq('inventory_item_id', itemId);
  const { data, error } = await q;
  if (error) return NextResponse.json({ error: 'Gagal membaca' }, { status: 500 });
  return NextResponse.json({ batches: data || [] });
}

// POST /api/stock-batches
//   { action:'produce', inventory_item_id, produced_date, qty_per_pack, pack_count, note? }
//   { action:'receive_lot', inventory_item_id, produced_date, qty, supplier?, invoice_no?, cost_price?, note? }
export async function POST(req) {
  const db = supabaseServer();
  let b;
  try { b = await req.json(); } catch { return NextResponse.json({ error: 'Body tidak valid' }, { status: 400 }); }

  if (b.action === 'produce') {
    const { inventory_item_id, produced_date, note } = b;
    const qtyPerPack = Number(b.qty_per_pack);
    const packCount = Math.max(1, parseInt(b.pack_count, 10) || 1);
    if (!inventory_item_id || !qtyPerPack || qtyPerPack <= 0)
      return NextResponse.json({ error: 'Bahan & qty per pack wajib diisi' }, { status: 400 });
    const date = produced_date || todayWIB();

    const { data: item } = await db.from('inventory_items').select('id, unit, stock_qty').eq('id', inventory_item_id).single();
    if (!item) return NextResponse.json({ error: 'Bahan tidak ditemukan' }, { status: 404 });

    const batches = [];
    for (let i = 0; i < packCount; i++) {
      const batch = await insertBatchWithRetry(db, 'BMB', {
        inventory_item_id,
        source_type: 'produksi',
        produced_date: date,
        initial_qty: qtyPerPack,
        qty_remaining: qtyPerPack,
        unit: item.unit,
        note: note || null,
      });
      batches.push(batch);
    }
    const total = qtyPerPack * packCount;
    await db.from('stock_movements').insert({
      item_id: inventory_item_id, type: 'in', qty: total,
      note: `Produksi: ${packCount} pack x ${qtyPerPack} ${item.unit}`,
    });
    await db.from('inventory_items').update({
      stock_qty: Number(item.stock_qty || 0) + total,
      received_date: date,
      batch_tracked: true,
    }).eq('id', inventory_item_id);

    return NextResponse.json({ ok: true, batches });
  }

  if (b.action === 'receive_lot') {
    const { inventory_item_id, produced_date, supplier, invoice_no, note } = b;
    const qty = Number(b.qty);
    if (!inventory_item_id || !qty || qty <= 0)
      return NextResponse.json({ error: 'Bahan & qty wajib diisi' }, { status: 400 });
    const date = produced_date || todayWIB();

    const { data: item } = await db.from('inventory_items').select('id, unit, stock_qty, cost_price').eq('id', inventory_item_id).single();
    if (!item) return NextResponse.json({ error: 'Bahan tidak ditemukan' }, { status: 404 });

    const costPrice = b.cost_price !== undefined && b.cost_price !== '' ? Number(b.cost_price) : Number(item.cost_price || 0);
    const batch = await insertBatchWithRetry(db, 'DGG', {
      inventory_item_id,
      source_type: 'penerimaan',
      produced_date: date,
      initial_qty: qty,
      qty_remaining: qty,
      unit: item.unit,
      supplier: supplier || null,
      invoice_no: invoice_no || null,
      cost_price: costPrice || null,
      note: note || null,
    });
    await db.from('stock_movements').insert({
      item_id: inventory_item_id, type: 'in', qty, cost: costPrice * qty,
      note: `Terima gelondongan${supplier ? ` dari ${supplier}` : ''}`,
    });
    const patch = { stock_qty: Number(item.stock_qty || 0) + qty, received_date: date, batch_tracked: true };
    if (costPrice) patch.cost_price = costPrice;
    await db.from('inventory_items').update(patch).eq('id', inventory_item_id);

    return NextResponse.json({ ok: true, batch });
  }

  return NextResponse.json({ error: 'action tidak dikenal' }, { status: 400 });
}
