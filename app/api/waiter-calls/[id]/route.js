import { NextResponse } from 'next/server';
import { supabaseServer } from '../../../../lib/supabaseServer';

export const dynamic = 'force-dynamic';

// PATCH /api/waiter-calls/:id  { status:'handled', handled_by? }
export async function PATCH(req, { params }) {
  const { id } = await params;
  const db = supabaseServer();
  let b;
  try { b = await req.json(); } catch { return NextResponse.json({ error: 'Body tidak valid' }, { status: 400 }); }
  if (b.status !== 'handled') return NextResponse.json({ error: 'status tidak dikenal' }, { status: 400 });

  const { data, error } = await db
    .from('waiter_calls')
    .update({ status: 'handled', handled_by: (b.handled_by || '').toString().slice(0, 80) || null, handled_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();
  if (error) return NextResponse.json({ error: 'Gagal memperbarui' }, { status: 500 });
  return NextResponse.json({ ok: true, call: data });
}
