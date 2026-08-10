import { NextResponse } from 'next/server';
import { supabaseServer } from '../../../../lib/supabaseServer';

export const dynamic = 'force-dynamic';

// Menu yang paling sering dipesan, untuk ditaruh paling atas di layar kasir.
//
// Dihitung dari penjualan sungguhan, bukan daftar yang diatur manual: menu
// laris berubah sendiri mengikuti musim dan promo, dan tidak ada yang akan
// ingat memperbarui daftar manual saat sedang ramai.
//
// GET /api/menu/laris?hari=30&jumlah=12
export async function GET(req) {
  const db = supabaseServer();
  const url = new URL(req.url);
  const hari = Math.min(180, Math.max(1, parseInt(url.searchParams.get('hari'), 10) || 30));
  const jumlah = Math.min(40, Math.max(1, parseInt(url.searchParams.get('jumlah'), 10) || 12));

  const sejak = new Date(Date.now() - hari * 86400000).toISOString();

  const { data, error } = await db
    .from('order_items')
    .select('menu_item_id, qty, created_at, cancelled_at, orders!inner(status)')
    .gte('created_at', sejak)
    .is('cancelled_at', null)
    .neq('orders.status', 'cancelled')
    .limit(20000);

  if (error) return NextResponse.json({ laris: [] });

  const per = new Map();
  for (const r of data || []) {
    if (!r.menu_item_id) continue;
    per.set(r.menu_item_id, (per.get(r.menu_item_id) || 0) + Number(r.qty || 0));
  }

  const laris = [...per.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, jumlah)
    .map(([menu_item_id, qty]) => ({ menu_item_id, qty }));

  return NextResponse.json({ laris, hari });
}
