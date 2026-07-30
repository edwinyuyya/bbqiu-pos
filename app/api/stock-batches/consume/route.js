import { NextResponse } from 'next/server';
import { supabaseServer } from '../../../../lib/supabaseServer';

export const dynamic = 'force-dynamic';

// POST /api/stock-batches/consume  { batch_code, qty?, force?, note?, waste? }
// Pakai/ambil batch untuk dipakai. Cek FIFO: kalau ada batch item yang sama
// dengan tanggal produksi lebih awal & masih aktif, WARNING (bukan blokir) —
// kecuali force:true (dicatat sebagai override).
// waste:true -> dibuang/rusak (bukan dipakai resep), FIFO tidak relevan
// (barang fisik yang di-scan memang yang rusak), wajib isi note (alasan).
export async function POST(req) {
  const db = supabaseServer();
  let b;
  try { b = await req.json(); } catch { return NextResponse.json({ error: 'Body tidak valid' }, { status: 400 }); }
  const code = (b.batch_code || '').toString().trim();
  if (!code) return NextResponse.json({ error: 'Kode batch wajib' }, { status: 400 });
  const isWaste = !!b.waste;
  if (isWaste && !(b.note || '').toString().trim())
    return NextResponse.json({ error: 'Alasan wajib diisi' }, { status: 400 });

  const { data: batch, error } = await db
    .from('stock_batches')
    .select('*, inventory_items(id, name, unit, stock_qty)')
    .eq('batch_code', code)
    .single();
  if (error || !batch) return NextResponse.json({ error: 'Kode batch tidak ditemukan' }, { status: 404 });

  if (batch.status === 'repacked') {
    const { data: child } = await db.from('stock_batches').select('batch_code').eq('parent_batch_id', batch.id).maybeSingle();
    return NextResponse.json({ error: 'Batch ini sudah di-repack, gunakan label baru', successor_batch_code: child?.batch_code || null }, { status: 409 });
  }
  if (batch.status !== 'active') {
    return NextResponse.json({ error: 'Batch ini sudah tidak aktif' }, { status: 409 });
  }

  // Cek FIFO (dilewati untuk pembuangan/rusak — barang fisiknya sudah pasti yang di-scan)
  if (!b.force && !isWaste) {
    const { data: older } = await db
      .from('stock_batches')
      .select('batch_code, produced_date, qty_remaining, created_at')
      .eq('inventory_item_id', batch.inventory_item_id)
      .eq('status', 'active')
      .neq('id', batch.id)
      .order('produced_date', { ascending: true })
      .order('created_at', { ascending: true });
    const blocking = (older || []).filter(
      (o) => o.produced_date < batch.produced_date ||
        (o.produced_date === batch.produced_date && new Date(o.created_at) < new Date(batch.created_at))
    );
    if (blocking.length) {
      return NextResponse.json({ warning: true, older_batches: blocking }, { status: 409 });
    }
  }

  const consumeQty = b.qty !== undefined && b.qty !== '' ? Number(b.qty) : Number(batch.qty_remaining);
  if (!consumeQty || consumeQty <= 0 || consumeQty > Number(batch.qty_remaining))
    return NextResponse.json({ error: 'Qty tidak valid' }, { status: 400 });

  const newRemaining = Number(batch.qty_remaining) - consumeQty;
  const patch = { qty_remaining: newRemaining };
  if (isWaste) {
    patch.status = newRemaining <= 0 ? 'void' : 'active';
    if (newRemaining <= 0) { patch.void_reason = b.note; patch.voided_at = new Date().toISOString(); }
  } else {
    patch.status = newRemaining <= 0 ? 'depleted' : 'active';
    if (patch.status === 'depleted') patch.consumed_at = new Date().toISOString();
  }
  await db.from('stock_batches').update(patch).eq('id', batch.id);

  await db.from('inventory_items').update({
    stock_qty: Math.max(0, Number(batch.inventory_items.stock_qty || 0) - consumeQty),
  }).eq('id', batch.inventory_item_id);

  await db.from('stock_movements').insert({
    item_id: batch.inventory_item_id, type: isWaste ? 'waste' : 'out', qty: consumeQty,
    note: isWaste
      ? `Rusak/buang batch ${batch.batch_code}: ${b.note}`
      : `Pakai batch ${batch.batch_code}${b.force ? ` (FIFO override: ${b.note || '-'})` : ''}`,
  });

  return NextResponse.json({ ok: true, batch: { ...batch, ...patch } });
}
