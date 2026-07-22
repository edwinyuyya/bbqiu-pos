import { NextResponse } from 'next/server';
import { supabaseServer } from '../../../../lib/supabaseServer';

export const dynamic = 'force-dynamic';

function genCode(prefix) {
  return `${prefix}-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
}

// POST /api/stock-batches/repack  { batch_code, new_qty, note? }
// Tutup batch lama (mis. gelondongan yang sudah dipakai sebagian), cetak label
// baru dengan berat yang disesuaikan TAPI tanggal produksi/beli ASLI tetap
// dipertahankan (supaya urutan FIFO tidak rusak).
export async function POST(req) {
  const db = supabaseServer();
  let b;
  try { b = await req.json(); } catch { return NextResponse.json({ error: 'Body tidak valid' }, { status: 400 }); }
  const code = (b.batch_code || '').toString().trim();
  const newQty = Number(b.new_qty);
  if (!code) return NextResponse.json({ error: 'Kode batch wajib' }, { status: 400 });
  if (!newQty || newQty <= 0) return NextResponse.json({ error: 'Berat baru wajib diisi' }, { status: 400 });

  const { data: old, error } = await db
    .from('stock_batches')
    .select('*, inventory_items(id, stock_qty)')
    .eq('batch_code', code)
    .single();
  if (error || !old) return NextResponse.json({ error: 'Kode batch tidak ditemukan' }, { status: 404 });
  if (old.status !== 'active') return NextResponse.json({ error: 'Batch ini sudah tidak aktif' }, { status: 409 });
  if (newQty > Number(old.qty_remaining))
    return NextResponse.json({ error: `Berat baru tidak boleh lebih dari sisa saat ini (${old.qty_remaining} ${old.unit})` }, { status: 400 });

  const diff = Number(old.qty_remaining) - newQty;

  let newBatch = null;
  for (let i = 0; i < 3; i++) {
    const batch_code = genCode(old.source_type === 'penerimaan' ? 'DGG' : 'BMB');
    const { data, error: insErr } = await db.from('stock_batches').insert({
      inventory_item_id: old.inventory_item_id,
      batch_code,
      source_type: old.source_type,
      produced_date: old.produced_date, // TETAP tanggal asli
      initial_qty: newQty,
      qty_remaining: newQty,
      unit: old.unit,
      parent_batch_id: old.id,
      supplier: old.supplier,
      invoice_no: old.invoice_no,
      cost_price: old.cost_price,
      note: b.note || null,
    }).select().single();
    if (!insErr) { newBatch = data; break; }
    if (String(insErr.code) !== '23505') return NextResponse.json({ error: insErr.message }, { status: 500 });
  }
  if (!newBatch) return NextResponse.json({ error: 'Gagal membuat kode batch baru' }, { status: 500 });

  await db.from('stock_batches').update({ status: 'repacked', qty_remaining: 0 }).eq('id', old.id);

  if (diff > 0) {
    await db.from('inventory_items').update({
      stock_qty: Math.max(0, Number(old.inventory_items.stock_qty || 0) - diff),
    }).eq('id', old.inventory_item_id);
    await db.from('stock_movements').insert({
      item_id: old.inventory_item_id, type: 'out', qty: diff,
      note: `Repack: ${old.batch_code} -> ${newBatch.batch_code}`,
    });
  }

  return NextResponse.json({ ok: true, batch: newBatch });
}
