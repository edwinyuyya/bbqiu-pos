import { NextResponse } from 'next/server';
import { supabaseServer } from '../../../../lib/supabaseServer';
import { sendNotif } from '../../../../lib/notify';
import { STATUS } from '../../../../lib/reservation';

export const dynamic = 'force-dynamic';

// PATCH /api/reservations/:id
//   { status: 'seated', table_id }  -> tamu datang: pra-pesanan jadi bill hidup
//   { status: 'cancelled' | 'no_show' }
//   { table_id }                    -> pindah rencana meja
//   { deposit_amount, deposit_note }-> catat DP
export async function PATCH(req, { params }) {
  const { id } = await params;
  const db = supabaseServer();
  let b;
  try { b = await req.json(); } catch {
    return NextResponse.json({ error: 'Body tidak valid' }, { status: 400 });
  }

  const { data: resv } = await db
    .from('reservations').select('*').eq('id', id).maybeSingle();
  if (!resv) return NextResponse.json({ error: 'Reservasi tidak ditemukan' }, { status: 404 });

  const patch = {};
  const sekarang = new Date().toISOString();

  if (b.table_id !== undefined) patch.table_id = b.table_id || null;
  if (b.deposit_amount !== undefined) {
    patch.deposit_amount = Math.max(0, Number(b.deposit_amount) || 0);
    patch.deposit_note = (b.deposit_note || '').toString().slice(0, 200) || null;
    patch.deposit_at = patch.deposit_amount > 0 ? sekarang : null;
  }

  if (b.status) {
    if (![STATUS.BOOKED, STATUS.SEATED, STATUS.CANCELLED, STATUS.NO_SHOW].includes(b.status))
      return NextResponse.json({ error: 'Status tidak dikenal' }, { status: 400 });
    patch.status = b.status;
    if (b.status === STATUS.SEATED) patch.seated_at = sekarang;
    if ([STATUS.CANCELLED, STATUS.NO_SHOW].includes(b.status)) patch.closed_at = sekarang;
  }

  // Tamu datang: meja ditentukan SEKARANG, bukan saat booking. Kalau meja
  // rencananya sedang dipakai, staf boleh menunjuk meja lain dan pra-pesanan
  // ikut pindah — inilah alasan meja tidak pernah dikunci sejak awal.
  if (b.status === STATUS.SEATED) {
    const mejaId = b.table_id || resv.table_id;
    if (!mejaId)
      return NextResponse.json({ error: 'Tentukan meja dulu sebelum menandai datang' }, { status: 400 });

    const { data: meja } = await db
      .from('tables').select('id, table_number').eq('id', mejaId).maybeSingle();
    if (!meja) return NextResponse.json({ error: 'Meja tidak ditemukan' }, { status: 404 });
    patch.table_id = mejaId;

    // Pra-pesanan (kalau ada) dihidupkan jadi bill berjalan di meja itu.
    const { data: praPesan } = await db
      .from('orders')
      .select('id, total, paid_amount')
      .eq('reservation_id', resv.id)
      .eq('status', 'scheduled')
      .maybeSingle();

    if (praPesan) {
      const dp = Math.max(Number(resv.deposit_amount || 0), Number(praPesan.paid_amount || 0));
      const lunas = dp >= Number(praPesan.total || 0) && Number(praPesan.total || 0) > 0;
      await db
        .from('orders')
        .update({
          status: 'open',
          table_id: meja.id,
          table_number: meja.table_number,
          paid_amount: dp,
          // Dapur baru melihat pesanan setelah lunas — DP saja belum cukup.
          payment_status: lunas ? 'paid' : 'unpaid',
          paid_at: lunas ? sekarang : null,
        })
        .eq('id', praPesan.id);
      await db.from('print_jobs').insert({ order_id: praPesan.id, status: 'pending', batch_no: 1 });
    }
  }

  const { data, error } = await db
    .from('reservations').update(patch).eq('id', id)
    .select('*, tables(table_number, area)').single();
  if (error) return NextResponse.json({ error: 'Gagal memperbarui' }, { status: 500 });

  if (b.status === STATUS.SEATED) {
    sendNotif(
      `🪑 *RESERVASI DATANG*\n${data.customer_name} · ${data.party_size} orang\n` +
      `Meja ${data.tables?.table_number || '-'}`
    );
  }

  return NextResponse.json({ ok: true, reservation: data });
}

// DELETE /api/reservations/:id -> hapus reservasi yang belum datang
export async function DELETE(_req, { params }) {
  const { id } = await params;
  const db = supabaseServer();

  const { data: resv } = await db
    .from('reservations').select('id, status').eq('id', id).maybeSingle();
  if (!resv) return NextResponse.json({ error: 'Reservasi tidak ditemukan' }, { status: 404 });
  if (resv.status === STATUS.SEATED)
    return NextResponse.json(
      { error: 'Tamu sudah datang — batalkan lewat bill-nya di Kasir' },
      { status: 400 }
    );

  // Pra-pesanan yang belum jadi bill ikut dibuang; belum pernah menyentuh
  // dapur maupun stok, jadi aman dihapus.
  await db.from('orders').delete().eq('reservation_id', id).eq('status', 'scheduled');
  await db.from('reservations').delete().eq('id', id);
  return NextResponse.json({ ok: true });
}
