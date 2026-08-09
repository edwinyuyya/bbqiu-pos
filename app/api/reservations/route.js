import { NextResponse } from 'next/server';
import { supabaseServer } from '../../../lib/supabaseServer';
import { sendNotif } from '../../../lib/notify';
import { STATUS, hariIniWIB, tokenReservasi } from '../../../lib/reservation';

export const dynamic = 'force-dynamic';

// GET /api/reservations?date=YYYY-MM-DD | ?upcoming=1
export async function GET(req) {
  const db = supabaseServer();
  const sp = new URL(req.url).searchParams;
  let q = db
    .from('reservations')
    .select('*, tables(table_number, area), orders(id, total, paid_amount, status)')
    .order('reserved_date', { ascending: true })
    .order('reserved_time', { ascending: true, nullsFirst: true });

  if (sp.get('date')) q = q.eq('reserved_date', sp.get('date'));
  else if (sp.get('upcoming')) q = q.gte('reserved_date', hariIniWIB()).eq('status', STATUS.BOOKED);

  const { data, error } = await q;
  if (error) return NextResponse.json({ error: 'Gagal membaca reservasi' }, { status: 500 });
  return NextResponse.json({ reservations: data || [] });
}

// POST /api/reservations -> staf membuat reservasi, hasilnya token untuk QR
export async function POST(req) {
  const db = supabaseServer();
  let b;
  try { b = await req.json(); } catch {
    return NextResponse.json({ error: 'Body tidak valid' }, { status: 400 });
  }

  const nama = (b.customer_name || '').toString().trim().slice(0, 80);
  if (!nama) return NextResponse.json({ error: 'Nama tamu wajib diisi' }, { status: 400 });
  if (!b.reserved_date) return NextResponse.json({ error: 'Tanggal wajib diisi' }, { status: 400 });
  if (b.reserved_date < hariIniWIB())
    return NextResponse.json({ error: 'Tanggal sudah lewat' }, { status: 400 });

  const partySize = Math.min(200, Math.max(1, parseInt(b.party_size, 10) || 0));
  if (!partySize) return NextResponse.json({ error: 'Jumlah orang wajib diisi' }, { status: 400 });

  const row = {
    token: tokenReservasi(),
    customer_name: nama,
    phone: (b.phone || '').toString().replace(/[^0-9+]/g, '').slice(0, 20) || null,
    party_size: partySize,
    reserved_date: b.reserved_date,
    reserved_time: b.reserved_time || null,
    table_id: b.table_id || null,
    area_pref: b.area_pref || null,
    note: (b.note || '').toString().slice(0, 300) || null,
    deposit_amount: Math.max(0, Number(b.deposit_amount) || 0),
    deposit_note: (b.deposit_note || '').toString().slice(0, 200) || null,
    deposit_at: Number(b.deposit_amount) > 0 ? new Date().toISOString() : null,
    created_by: (b.created_by || '').toString().slice(0, 80) || null,
    status: STATUS.BOOKED,
  };

  const { data, error } = await db.from('reservations').insert(row).select('*, tables(table_number, area)').single();
  if (error) return NextResponse.json({ error: 'Gagal menyimpan reservasi' }, { status: 500 });

  sendNotif(
    `📅 *RESERVASI BARU*\n${data.customer_name} · ${data.party_size} orang\n` +
    `${data.reserved_date}${data.reserved_time ? ` ${String(data.reserved_time).slice(0, 5)}` : ''}` +
    `${data.tables?.table_number ? `\nMeja ${data.tables.table_number}` : ''}` +
    `${data.deposit_amount > 0 ? `\nDP: Rp ${Number(data.deposit_amount).toLocaleString('id-ID')}` : ''}`
  );

  return NextResponse.json({ ok: true, reservation: data });
}
