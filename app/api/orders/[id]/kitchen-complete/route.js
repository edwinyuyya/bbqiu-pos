import { NextResponse } from 'next/server';
import { supabaseServer } from '../../../../../lib/supabaseServer';

export const dynamic = 'force-dynamic';

// POST /api/orders/:id/kitchen-complete
// Tandai semua item order ini "served" sekaligus, lalu catat durasi
// (order masuk -> diklik selesai) ke log kinerja dapur.
export async function POST(_req, { params }) {
  const { id } = await params;
  const db = supabaseServer();

  const { data: order, error: oErr } = await db
    .from('orders')
    .select('id, order_no, table_number, created_at')
    .eq('id', id)
    .single();
  if (oErr || !order)
    return NextResponse.json({ error: 'Order tidak ditemukan' }, { status: 404 });

  const { data: items } = await db
    .from('order_items')
    .select('id, kitchen_status')
    .eq('order_id', id);

  const unserved = (items || []).filter((i) => i.kitchen_status !== 'served');
  if (unserved.length) {
    await db
      .from('order_items')
      .update({ kitchen_status: 'served' })
      .eq('order_id', id)
      .neq('kitchen_status', 'served');
  }

  const completedAt = new Date();
  const durationSec = Math.max(0, Math.round((completedAt - new Date(order.created_at)) / 1000));

  const { data: log, error: lErr } = await db
    .from('kitchen_perf_log')
    .insert({
      order_id: order.id,
      order_no: order.order_no,
      table_number: order.table_number,
      started_at: order.created_at,
      completed_at: completedAt.toISOString(),
      duration_sec: durationSec,
      item_count: (items || []).length,
    })
    .select()
    .single();
  if (lErr)
    return NextResponse.json({ error: 'Gagal mencatat log kinerja' }, { status: 500 });

  return NextResponse.json({ ok: true, log });
}
