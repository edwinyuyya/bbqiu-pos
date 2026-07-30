import { NextResponse } from 'next/server';
import { supabaseServer } from '../../../../lib/supabaseServer';

export const dynamic = 'force-dynamic';

// Awal hari WIB (UTC+7) dalam ISO
function startOfTodayWIB() {
  const now = new Date();
  const wib = new Date(now.getTime() + 7 * 3600 * 1000);
  const y = wib.getUTCFullYear(), m = wib.getUTCMonth(), d = wib.getUTCDate();
  return new Date(Date.UTC(y, m, d, 0, 0, 0) - 7 * 3600 * 1000).toISOString();
}

// GET /api/spv/summary
// Ringkasan operasional untuk peran SPV — SENGAJA tidak menghitung
// HPP/margin/harga beli bahan (itu domain Owner/Admin), fokus ke
// pantauan operasional: order aktif, kinerja dapur, stok menipis,
// dan rusak/susut (qty saja, tanpa nilai rupiah).
export async function GET() {
  const db = supabaseServer();
  const startISO = startOfTodayWIB();

  const { data: orders } = await db
    .from('orders')
    .select('id, order_no, table_number, status, payment_method, payment_status, total, created_at')
    .in('status', ['open', 'preparing', 'served'])
    .order('created_at', { ascending: true });

  const { data: perfRaw } = await db
    .from('kitchen_perf_log')
    .select('order_no, table_number, duration_sec, item_count, completed_at')
    .gte('completed_at', startISO)
    .order('completed_at', { ascending: false });
  const perfList = perfRaw || [];
  const avgDurationSec = perfList.length
    ? Math.round(perfList.reduce((s, p) => s + Number(p.duration_sec), 0) / perfList.length)
    : 0;
  const slowest = [...perfList].sort((a, b) => b.duration_sec - a.duration_sec).slice(0, 5);
  const kitchenPerf = {
    count: perfList.length,
    avg_duration_sec: avgDurationSec,
    slowest: slowest.map((p) => ({
      order_no: p.order_no, table_number: p.table_number,
      duration_sec: p.duration_sec, item_count: p.item_count, at: p.completed_at,
    })),
  };

  const { data: inv } = await db
    .from('inventory_items')
    .select('id, name, unit, stock_qty, min_stock')
    .order('name');
  const lowStock = (inv || []).filter((i) => Number(i.stock_qty) <= Number(i.min_stock));

  // Rusak/susut hari ini — qty saja per bahan, TANPA nilai rupiah (harga beli
  // tetap rahasia Owner/Admin).
  const { data: wasteRaw } = await db
    .from('stock_movements')
    .select('qty, note, created_at, inventory_items(name, unit)')
    .gte('created_at', startISO)
    .eq('type', 'waste')
    .order('created_at', { ascending: false })
    .limit(50);
  const wasteList = (wasteRaw || []).map((w) => ({
    name: w.inventory_items?.name || '-',
    unit: w.inventory_items?.unit || '',
    qty: Number(w.qty),
    note: w.note,
    at: w.created_at,
  }));

  return NextResponse.json({
    orders: orders || [],
    kitchen_perf: kitchenPerf,
    low_stock: lowStock,
    waste: wasteList,
  });
}
