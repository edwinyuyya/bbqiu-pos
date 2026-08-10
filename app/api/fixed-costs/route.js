import { NextResponse } from 'next/server';
import { supabaseServer } from '../../../lib/supabaseServer';

export const dynamic = 'force-dynamic';

// Biaya tetap bulanan (gaji, sewa, langganan). Angkanya sensitif — dikelola
// dari halaman Owner, sedangkan kasir hanya melihat totalnya per hari.
export async function GET() {
  const db = supabaseServer();
  const [costs, setting] = await Promise.all([
    db.from('fixed_costs').select('*').order('created_at'),
    db.from('settings').select('value').eq('key', 'hari_buka_per_bulan').maybeSingle(),
  ]);
  const hariBuka = Math.max(1, Number(setting.data?.value) || 30);
  const rows = costs.data || [];
  const totalBulanan = rows.filter((r) => r.active)
    .reduce((s, r) => s + Number(r.amount_monthly || 0), 0);
  return NextResponse.json({
    costs: rows,
    hari_buka_per_bulan: hariBuka,
    total_bulanan: totalBulanan,
    per_hari: Math.round(totalBulanan / hariBuka),
  });
}

// POST { name, amount_monthly, note? }  -> tambah biaya tetap
// POST { hari_buka_per_bulan }          -> ubah jumlah hari buka
export async function POST(req) {
  const db = supabaseServer();
  let b;
  try { b = await req.json(); } catch {
    return NextResponse.json({ error: 'Body tidak valid' }, { status: 400 });
  }

  if (b.hari_buka_per_bulan !== undefined) {
    const n = Math.min(31, Math.max(1, parseInt(b.hari_buka_per_bulan, 10) || 0));
    if (!n) return NextResponse.json({ error: 'Hari buka harus 1–31' }, { status: 400 });
    await db.from('settings')
      .upsert({ key: 'hari_buka_per_bulan', value: String(n), updated_at: new Date().toISOString() });
    return NextResponse.json({ ok: true, hari_buka_per_bulan: n });
  }

  const name = (b.name || '').toString().trim().slice(0, 80);
  const amount = Number(b.amount_monthly);
  if (!name) return NextResponse.json({ error: 'Nama biaya wajib diisi' }, { status: 400 });
  if (!(amount > 0)) return NextResponse.json({ error: 'Nominal per bulan wajib diisi' }, { status: 400 });

  const { data, error } = await db.from('fixed_costs').insert({
    name, amount_monthly: amount,
    note: (b.note || '').toString().slice(0, 200) || null,
    active: true,
  }).select().single();
  if (error) return NextResponse.json({ error: 'Gagal menyimpan' }, { status: 500 });
  return NextResponse.json({ ok: true, cost: data });
}

// PATCH { id, active? , amount_monthly?, name? }
export async function PATCH(req) {
  const db = supabaseServer();
  let b;
  try { b = await req.json(); } catch {
    return NextResponse.json({ error: 'Body tidak valid' }, { status: 400 });
  }
  if (!b.id) return NextResponse.json({ error: 'id wajib' }, { status: 400 });
  const patch = {};
  if (b.active !== undefined) patch.active = !!b.active;
  if (b.name !== undefined) patch.name = String(b.name).trim().slice(0, 80);
  if (b.amount_monthly !== undefined) patch.amount_monthly = Math.max(0, Number(b.amount_monthly) || 0);
  const { error } = await db.from('fixed_costs').update(patch).eq('id', b.id);
  if (error) return NextResponse.json({ error: 'Gagal memperbarui' }, { status: 500 });
  return NextResponse.json({ ok: true });
}

// DELETE ?id=
export async function DELETE(req) {
  const db = supabaseServer();
  const id = new URL(req.url).searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'id wajib' }, { status: 400 });
  const { error } = await db.from('fixed_costs').delete().eq('id', id);
  if (error) return NextResponse.json({ error: 'Gagal menghapus' }, { status: 500 });
  return NextResponse.json({ ok: true });
}
