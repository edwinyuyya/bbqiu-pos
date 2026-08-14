import { NextResponse } from 'next/server';
import { supabaseServer } from '../../../../lib/supabaseServer';

export const dynamic = 'force-dynamic';

// Bill yang masih jalan di satu meja — sama dengan definisi yang dipakai
// kasir saat memindah meja dan saat menandai meja terisi.
const STATUS_HIDUP = ['open', 'preparing', 'served'];

// GET /api/meja/[token] -> daftar pesanan meja ini, TANPA HARGA.
//
// Harga dibuang di server, bukan disembunyikan di tampilan: kalau hanya
// tidak dirender, angkanya tetap terbaca di respons jaringan. Tagihan resmi
// tetap keluar dari kasir.
export async function GET(_req, { params }) {
  const { token } = await params;
  const db = supabaseServer();

  const { data: table } = await db
    .from('tables')
    .select('id, table_number, active')
    .eq('token', token)
    .single();

  if (!table) return NextResponse.json({ error: 'Meja tidak ditemukan' }, { status: 404 });
  if (table.active === false) return NextResponse.json({ error: 'Meja tidak aktif' }, { status: 410 });

  // Kalau satu meja punya lebih dari satu bill hidup, yang terbaru yang
  // ditampilkan — itu yang paling mungkin milik tamu yang sedang duduk.
  const { data: order } = await db
    .from('orders')
    .select('id, order_no, status, created_at')
    .eq('table_id', table.id)
    .in('status', STATUS_HIDUP)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  let items = [];
  if (order) {
    const { data: rows } = await db
      .from('order_items')
      .select('id, name, qty, note, kitchen_status, cook_method, drink_temp, sweetness, created_at')
      .eq('order_id', order.id)
      .is('cancelled_at', null)
      .order('created_at', { ascending: true });
    items = rows || [];
  }

  return NextResponse.json({
    table: { id: table.id, table_number: table.table_number },
    order: order ? { order_no: order.order_no, status: order.status, created_at: order.created_at } : null,
    items,
  });
}
