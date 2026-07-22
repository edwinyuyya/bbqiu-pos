import { NextResponse } from 'next/server';
import { supabaseServer } from '../../../lib/supabaseServer';
import { sendNotif } from '../../../lib/notify';

export const dynamic = 'force-dynamic';

// GET /api/waiter-calls?status=pending -> daftar panggilan (untuk staf)
export async function GET(req) {
  const db = supabaseServer();
  const status = new URL(req.url).searchParams.get('status') || 'pending';
  let q = db.from('waiter_calls').select('*').order('created_at', { ascending: true });
  if (status !== 'all') q = q.eq('status', status);
  const { data, error } = await q;
  if (error) return NextResponse.json({ error: 'Gagal membaca' }, { status: 500 });
  return NextResponse.json({ calls: data || [] });
}

// POST /api/waiter-calls  { table_id, table_number, reason? }
// Dipanggil dari halaman pelanggan (publik, tanpa PIN). Cegah spam: kalau
// meja itu masih punya panggilan pending, jangan buat baru.
export async function POST(req) {
  const db = supabaseServer();
  let b;
  try { b = await req.json(); } catch { return NextResponse.json({ error: 'Body tidak valid' }, { status: 400 }); }
  const tableId = b.table_id;
  const tableNumber = (b.table_number || '').toString().slice(0, 40);
  if (!tableId) return NextResponse.json({ error: 'Meja wajib' }, { status: 400 });

  const { data: existing } = await db
    .from('waiter_calls')
    .select('id')
    .eq('status', 'pending')
    .eq('table_id', tableId)
    .maybeSingle();
  if (existing) return NextResponse.json({ ok: true, already_pending: true });

  const reason = (b.reason || '').toString().slice(0, 200) || null;
  const { data, error } = await db
    .from('waiter_calls')
    .insert({ table_id: tableId, table_number: tableNumber, reason })
    .select()
    .single();
  if (error) return NextResponse.json({ error: 'Gagal menyimpan' }, { status: 500 });

  sendNotif(`🔔 *PANGGILAN WAITER*\nMeja ${tableNumber}${reason ? `\nAlasan: ${reason}` : ''}`);

  return NextResponse.json({ ok: true, call: data });
}
