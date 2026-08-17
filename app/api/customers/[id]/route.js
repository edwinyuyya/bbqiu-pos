import { NextResponse } from 'next/server';
import { supabaseServer } from '../../../../lib/supabaseServer';
import { berhakHadiah, sisaMenujuHadiah, ulangTahunDalam } from '../../../../lib/pelanggan';

export const dynamic = 'force-dynamic';

// GET /api/customers/:id -> profil + jejak: riwayat order, menu favorit, kunjungan
export async function GET(_req, { params }) {
  const { id } = await params;
  const db = supabaseServer();

  const { data: c } = await db.from('customers').select('*').eq('id', id).maybeSingle();
  if (!c) return NextResponse.json({ error: 'Pelanggan tidak ditemukan' }, { status: 404 });

  const { data: orders } = await db
    .from('orders')
    .select('id, order_no, table_number, status, payment_status, total, created_at')
    .eq('customer_id', id)
    .neq('status', 'cancelled')
    .order('created_at', { ascending: false })
    .limit(20);

  const ids = (orders || []).map((o) => o.id);
  let favorit = [];
  let totalBelanja = 0;
  if (ids.length) {
    const { data: items } = await db
      .from('order_items')
      .select('name, qty, order_id')
      .in('order_id', ids)
      .is('cancelled_at', null);

    const per = {};
    for (const it of items || []) {
      per[it.name] = (per[it.name] || 0) + Number(it.qty || 0);
    }
    favorit = Object.entries(per)
      .map(([nama, porsi]) => ({ nama, porsi }))
      .sort((a, b) => b.porsi - a.porsi)
      .slice(0, 8);

    totalBelanja = (orders || []).reduce((s, o) => s + Number(o.total || 0), 0);
  }

  return NextResponse.json({
    customer: {
      ...c,
      berhak_hadiah: berhakHadiah(c),
      sisa_menuju_hadiah: sisaMenujuHadiah(c),
      ulang_tahun: ulangTahunDalam(c.birth_date, 30),
    },
    orders: orders || [],
    favorit,
    total_belanja: totalBelanja,
  });
}

// PATCH /api/customers/:id -> perbaiki data, atau tandai hadiah sudah diambil
export async function PATCH(req, { params }) {
  const { id } = await params;
  const db = supabaseServer();
  let b;
  try { b = await req.json(); } catch {
    return NextResponse.json({ error: 'Body tidak valid' }, { status: 400 });
  }

  const patch = {};
  if (typeof b.name === 'string' && b.name.trim()) patch.name = b.name.trim();
  if (b.birth_date !== undefined) patch.birth_date = b.birth_date || null;
  if (b.note !== undefined) patch.note = b.note || null;

  // Menandai hadiah terpakai. Sengaja hanya bisa maju, tidak bisa dibatalkan
  // lewat jalur ini — hadiah sekali seumur pelanggan tidak boleh bisa diputar
  // ulang dari layar kasir.
  if (b.klaim_hadiah) {
    const { data: c } = await db.from('customers').select('reward_claimed_at').eq('id', id).maybeSingle();
    if (c?.reward_claimed_at) {
      return NextResponse.json({ error: 'Hadiah pelanggan ini sudah pernah diambil.' }, { status: 409 });
    }
    patch.reward_claimed_at = new Date().toISOString();
    patch.reward_item = String(b.klaim_hadiah);
  }

  if (!Object.keys(patch).length) {
    return NextResponse.json({ error: 'Tidak ada yang diubah' }, { status: 400 });
  }

  const { data, error } = await db.from('customers').update(patch).eq('id', id).select('*').single();
  if (error) return NextResponse.json({ error: 'Gagal menyimpan' }, { status: 500 });
  return NextResponse.json({ customer: data });
}
