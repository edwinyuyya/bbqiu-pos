import { NextResponse } from 'next/server';
import { supabaseServer } from '../../../../lib/supabaseServer';
import { STATION_BAKARAN } from '../../../../lib/stations';

export const dynamic = 'force-dynamic';

// PATCH /api/order-items/:id
//  { kitchen_status } -> ubah status dapur (queued|printed|preparing|ready|served)
//  { advance_stage: true } -> selesai digoreng, pindahkan ke station bakaran
export async function PATCH(req, { params }) {
  const { id } = await params;
  const db = supabaseServer();
  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Body tidak valid' }, { status: 400 });
  }

  if (body.advance_stage) {
    // Syarat stage='goreng' membuat tombol aman ditekan dua kali: tekanan
    // kedua tidak cocok, jadi item tidak pernah melompat tahap.
    const { data, error } = await db
      .from('order_items')
      .update({ stage: 'bakar', station_id: STATION_BAKARAN, kitchen_status: 'preparing' })
      .eq('id', id)
      .eq('stage', 'goreng')
      .select()
      .maybeSingle();
    if (error) return NextResponse.json({ error: 'Gagal memperbarui' }, { status: 500 });
    // data null = sudah dipindahkan lebih dulu; anggap berhasil.
    return NextResponse.json({ ok: true, item: data, sudah_pindah: !data });
  }

  const allowed = ['queued', 'printed', 'preparing', 'ready', 'served'];
  if (!allowed.includes(body.kitchen_status))
    return NextResponse.json({ error: 'Status tidak valid' }, { status: 400 });

  const { data, error } = await db
    .from('order_items')
    .update({ kitchen_status: body.kitchen_status })
    .eq('id', id)
    .select()
    .single();
  if (error)
    return NextResponse.json({ error: 'Gagal memperbarui' }, { status: 500 });

  return NextResponse.json({ ok: true, item: data });
}
