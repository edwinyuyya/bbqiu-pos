import { NextResponse } from 'next/server';
import { supabaseServer } from '../../../../lib/supabaseServer';

export const dynamic = 'force-dynamic';

// GET /api/stock-batches/:code -> detail batch + cek FIFO (batch lain lebih tua yg masih aktif)
export async function GET(_req, { params }) {
  const { code } = await params;
  const db = supabaseServer();

  const { data: batch, error } = await db
    .from('stock_batches')
    .select('*, inventory_items(id, name, unit, stock_qty)')
    .eq('batch_code', code)
    .single();
  if (error || !batch) return NextResponse.json({ error: 'Kode batch tidak ditemukan' }, { status: 404 });

  let olderBatches = [];
  let successorCode = null;

  if (batch.status === 'active') {
    const { data: older } = await db
      .from('stock_batches')
      .select('batch_code, produced_date, qty_remaining, created_at')
      .eq('inventory_item_id', batch.inventory_item_id)
      .eq('status', 'active')
      .neq('id', batch.id)
      .order('produced_date', { ascending: true })
      .order('created_at', { ascending: true });
    olderBatches = (older || []).filter(
      (o) => o.produced_date < batch.produced_date ||
        (o.produced_date === batch.produced_date && new Date(o.created_at) < new Date(batch.created_at))
    );
  } else if (batch.status === 'repacked') {
    const { data: child } = await db
      .from('stock_batches')
      .select('batch_code')
      .eq('parent_batch_id', batch.id)
      .maybeSingle();
    successorCode = child?.batch_code || null;
  }

  return NextResponse.json({
    batch,
    item: batch.inventory_items,
    fifo_blocked: olderBatches.length > 0,
    older_batches: olderBatches,
    successor_batch_code: successorCode,
  });
}
