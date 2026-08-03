import { NextResponse } from 'next/server';
import { supabaseServer } from '../../../../lib/supabaseServer';
import { sendNotif } from '../../../../lib/notify';
import {
  durasiMejaMenit,
  estimasiMenit,
  mejaCocok,
  posisiDalamAntrian,
} from '../../../../lib/waitingList';

export const dynamic = 'force-dynamic';

// GET /api/waiting-list/[id] -> status satu antrian (halaman pelanggan, publik).
// Mengembalikan posisi & estimasi yang sudah dihitung server, supaya HP
// pelanggan tidak perlu tahu isi seluruh antrian orang lain.
export async function GET(_req, { params }) {
  const { id } = await params;
  const db = supabaseServer();

  const { data: entri, error } = await db
    .from('waiting_list').select('*').eq('id', id).maybeSingle();
  if (error) return NextResponse.json({ error: 'Gagal membaca' }, { status: 500 });
  if (!entri) return NextResponse.json({ error: 'Antrian tidak ditemukan' }, { status: 404 });

  let meja = null;
  if (entri.table_id) {
    const { data } = await db
      .from('tables').select('table_number, area').eq('id', entri.table_id).maybeSingle();
    meja = data;
  }

  // Sudah selesai/dibatalkan: tidak perlu hitung posisi lagi.
  if (entri.status !== 'waiting') {
    return NextResponse.json({ entri, meja, posisi: null, estimasi_menit: null });
  }

  const [{ data: daftar }, { data: tables }, { data: orderOpen }, { data: orderTutup }] =
    await Promise.all([
      db.from('waiting_list').select('*')
        .eq('queue_date', entri.queue_date)
        .in('status', ['waiting', 'called'])
        .order('queue_no', { ascending: true }),
      db.from('tables').select('id, table_number, area, seats, active'),
      db.from('orders').select('table_id, created_at').eq('status', 'open'),
      db.from('orders').select('created_at, closed_at')
        .not('closed_at', 'is', null)
        .order('closed_at', { ascending: false })
        .limit(200),
    ]);

  const durasi = durasiMejaMenit(orderTutup);
  const posisi = posisiDalamAntrian(daftar || [], entri, tables || []);
  const terpakai = {};
  for (const o of orderOpen || []) if (o.table_id) terpakai[o.table_id] = o.created_at;

  const estimasi = posisi == null ? null : estimasiMenit({
    posisi,
    meja: mejaCocok(tables || [], {
      partySize: entri.party_size, areaPref: entri.area_pref,
    }),
    mejaTerpakai: terpakai,
    durasiMenit: durasi,
  });

  return NextResponse.json({ entri, meja, posisi, estimasi_menit: estimasi });
}

// PATCH /api/waiting-list/[id]  { status, table_id? }
// Dipakai layar waiter: panggil / tandai duduk / tidak datang / batal.
export async function PATCH(req, { params }) {
  const { id } = await params;
  const db = supabaseServer();
  let b;
  try { b = await req.json(); } catch {
    return NextResponse.json({ error: 'Body tidak valid' }, { status: 400 });
  }

  const status = b.status;
  if (!['called', 'seated', 'no_show', 'cancelled', 'waiting'].includes(status))
    return NextResponse.json({ error: 'Status tidak dikenal' }, { status: 400 });

  const patch = { status };
  const sekarang = new Date().toISOString();
  if (status === 'called') {
    if (!b.table_id) return NextResponse.json({ error: 'Pilih meja dulu' }, { status: 400 });
    patch.table_id = b.table_id;
    patch.called_at = sekarang;
  }
  if (status === 'seated') { patch.seated_at = sekarang; patch.closed_at = sekarang; }
  if (status === 'no_show' || status === 'cancelled') patch.closed_at = sekarang;
  if (status === 'waiting') { patch.table_id = null; patch.called_at = null; patch.closed_at = null; }

  const { data, error } = await db
    .from('waiting_list').update(patch).eq('id', id).select().single();
  if (error) return NextResponse.json({ error: 'Gagal memperbarui' }, { status: 500 });

  if (status === 'called') {
    const { data: meja } = await db
      .from('tables').select('table_number').eq('id', b.table_id).maybeSingle();
    sendNotif(
      `🪑 *ANTRIAN #${data.queue_no} DIPANGGIL*\n${data.customer_name} · ${data.party_size} orang` +
      `\nMeja ${meja?.table_number || '-'}`
    );
  }

  return NextResponse.json({ ok: true, entri: data });
}
