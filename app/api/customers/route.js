import { NextResponse } from 'next/server';
import { supabaseServer } from '../../../lib/supabaseServer';
import { nomorWA } from '../../../lib/wa';
import { berhakHadiah, sisaMenujuHadiah } from '../../../lib/pelanggan';

export const dynamic = 'force-dynamic';

// Ringkasan yang dipakai layar kasir. Selalu lewat sini supaya bentuknya sama
// di pencarian maupun sesudah pendaftaran.
function ringkas(c) {
  if (!c) return null;
  return {
    ...c,
    berhak_hadiah: berhakHadiah(c),
    sisa_menuju_hadiah: sisaMenujuHadiah(c),
  };
}

// GET /api/customers?phone=08xx  -> cari satu pelanggan lewat nomor WA
// GET /api/customers?q=nama      -> cari lewat nama (cadangan, kalau nomor lupa)
export async function GET(req) {
  const db = supabaseServer();
  const url = new URL(req.url);
  const phone = url.searchParams.get('phone');
  const q = url.searchParams.get('q');

  if (phone) {
    const wa = nomorWA(phone);
    // Nomor yang belum utuh bukan error — kasir masih mengetik.
    if (!wa) return NextResponse.json({ customer: null, nomor_valid: false });

    const { data } = await db.from('customers').select('*').eq('phone', wa).maybeSingle();
    return NextResponse.json({ customer: ringkas(data), nomor_valid: true, phone: wa });
  }

  if (q && q.trim().length >= 2) {
    const { data } = await db.from('customers').select('*')
      .ilike('name', `%${q.trim()}%`).order('visit_count', { ascending: false }).limit(10);
    return NextResponse.json({ customers: (data || []).map(ringkas) });
  }

  return NextResponse.json({ customers: [] });
}

// POST /api/customers  { name, phone, birth_date? }  -> daftar pelanggan baru
export async function POST(req) {
  const db = supabaseServer();
  let b;
  try { b = await req.json(); } catch {
    return NextResponse.json({ error: 'Body tidak valid' }, { status: 400 });
  }

  const nama = String(b.name || '').trim();
  const wa = nomorWA(b.phone);
  if (!nama) return NextResponse.json({ error: 'Nama wajib diisi' }, { status: 400 });
  if (!wa) {
    return NextResponse.json(
      { error: 'Nomor WhatsApp tidak dikenali. Contoh yang benar: 081234567890' },
      { status: 400 }
    );
  }

  // Nomor yang sama tidak membuat pelanggan kedua — jejaknya harus menyatu,
  // itu inti dari menghitung kunjungan.
  const { data: ada } = await db.from('customers').select('*').eq('phone', wa).maybeSingle();
  if (ada) return NextResponse.json({ customer: ringkas(ada), sudah_ada: true });

  const { data, error } = await db.from('customers').insert({
    name: nama,
    phone: wa,
    birth_date: b.birth_date || null,
  }).select('*').single();

  if (error) return NextResponse.json({ error: 'Gagal menyimpan pelanggan' }, { status: 500 });
  return NextResponse.json({ customer: ringkas(data) });
}
