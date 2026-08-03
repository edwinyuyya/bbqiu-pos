import { NextResponse } from 'next/server';
import { supabaseServer } from '../../../lib/supabaseServer';
import { sendNotif } from '../../../lib/notify';
import { AREAS } from '../../../lib/waitingList';

export const dynamic = 'force-dynamic';

// Tanggal "hari ini" menurut WIB — supaya nomor antrian reset saat ganti hari
// di Solo, bukan saat ganti hari UTC (yang jatuh pukul 07:00 pagi).
function tanggalWIB() {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Jakarta' });
}

// GET /api/waiting-list?status=aktif -> daftar antrian untuk layar waiter
export async function GET(req) {
  const db = supabaseServer();
  const status = new URL(req.url).searchParams.get('status') || 'aktif';
  let q = db
    .from('waiting_list')
    .select('*')
    .eq('queue_date', tanggalWIB())
    .order('queue_no', { ascending: true });
  if (status === 'aktif') q = q.in('status', ['waiting', 'called']);
  else if (status !== 'all') q = q.eq('status', status);

  const { data, error } = await q;
  if (error) return NextResponse.json({ error: 'Gagal membaca antrian' }, { status: 500 });
  return NextResponse.json({ antrian: data || [] });
}

// POST /api/waiting-list  { customer_name, party_size, area_pref?, phone?, note?, device_key? }
// Publik (dipanggil dari halaman /antri hasil scan QR pintu masuk).
export async function POST(req) {
  const db = supabaseServer();
  let b;
  try { b = await req.json(); } catch {
    return NextResponse.json({ error: 'Body tidak valid' }, { status: 400 });
  }

  const nama = (b.customer_name || '').toString().trim().slice(0, 60);
  if (!nama) return NextResponse.json({ error: 'Nama wajib diisi' }, { status: 400 });

  const partySize = Math.min(50, Math.max(1, parseInt(b.party_size, 10) || 0));
  if (!partySize) return NextResponse.json({ error: 'Jumlah orang wajib diisi' }, { status: 400 });

  const areaPref = AREAS.includes(b.area_pref) ? b.area_pref : null;
  const phone = (b.phone || '').toString().replace(/[^0-9+]/g, '').slice(0, 20) || null;
  const note = (b.note || '').toString().slice(0, 200) || null;
  const deviceKey = (b.device_key || '').toString().slice(0, 64) || null;
  const hariIni = tanggalWIB();

  // Scan ulang dari HP yang sama: kembalikan antrian yang sudah ada,
  // jangan bikin nomor baru.
  if (deviceKey) {
    const { data: sudahAda } = await db
      .from('waiting_list')
      .select('*')
      .eq('device_key', deviceKey)
      .eq('queue_date', hariIni)
      .in('status', ['waiting', 'called'])
      .maybeSingle();
    if (sudahAda) return NextResponse.json({ ok: true, sudah_antri: true, entri: sudahAda });
  }

  // Nomor antrian harian berikutnya. Unique index (queue_date, queue_no)
  // yang jadi penjaga sebenarnya kalau dua orang mendaftar bersamaan —
  // makanya insert diulang beberapa kali saat bentrok.
  for (let percobaan = 0; percobaan < 5; percobaan += 1) {
    const { data: terakhir } = await db
      .from('waiting_list')
      .select('queue_no')
      .eq('queue_date', hariIni)
      .order('queue_no', { ascending: false })
      .limit(1)
      .maybeSingle();
    const nomor = (terakhir?.queue_no || 0) + 1;

    const { data, error } = await db
      .from('waiting_list')
      .insert({
        queue_date: hariIni,
        queue_no: nomor,
        customer_name: nama,
        phone,
        party_size: partySize,
        area_pref: areaPref,
        note,
        device_key: deviceKey,
      })
      .select()
      .single();

    if (!error) {
      sendNotif(
        `📝 *ANTRIAN BARU #${nomor}*\n${nama} · ${partySize} orang` +
        `${areaPref ? `\nArea: ${areaPref}` : ''}${note ? `\nCatatan: ${note}` : ''}`
      );
      return NextResponse.json({ ok: true, entri: data });
    }
    // 23505 = unique violation -> nomor keburu dipakai orang lain, ulangi
    if (error.code !== '23505') {
      return NextResponse.json({ error: 'Gagal menyimpan antrian' }, { status: 500 });
    }
  }

  return NextResponse.json({ error: 'Antrian sedang sibuk, coba lagi' }, { status: 503 });
}
