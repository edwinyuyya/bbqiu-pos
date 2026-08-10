import { NextResponse } from 'next/server';
import { supabaseServer } from '../../../lib/supabaseServer';

export const dynamic = 'force-dynamic';

// GET /api/petty-cash -> saldo + riwayat terbaru
export async function GET() {
  const db = supabaseServer();
  const { data, error } = await db
    .from('petty_cash')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(100);
  if (error) return NextResponse.json({ error: 'Gagal membaca' }, { status: 500 });
  const rows = data || [];
  const balance = rows.reduce((s, r) => s + (r.type === 'in' ? Number(r.amount) : -Number(r.amount)), 0);
  return NextResponse.json({ balance, transactions: rows });
}

// Batas nominal yang mewajibkan foto nota.
// Memaksa foto untuk uang parkir Rp 2.000 hanya akan membuat staf malas
// mencatat sama sekali — dan pengeluaran yang tidak tercatat jauh lebih
// merugikan daripada nota kecil yang tidak berfoto. Pengeluaran besar tetap
// wajib berfoto.
const WAJIB_FOTO_MULAI = 50000;

// POST /api/petty-cash  { type:'in'|'out', amount, note, category, photo, created_by }
export async function POST(req) {
  const db = supabaseServer();
  let b;
  try { b = await req.json(); } catch { return NextResponse.json({ error: 'Body tidak valid' }, { status: 400 }); }
  const type = b.type === 'in' ? 'in' : 'out';
  const amount = Number(b.amount) || 0;
  if (amount <= 0) return NextResponse.json({ error: 'Nominal wajib diisi' }, { status: 400 });
  const photo = (b.photo && typeof b.photo === 'string' && b.photo.startsWith('data:image')) ? b.photo : null;
  if (type === 'out' && !photo && amount >= WAJIB_FOTO_MULAI)
    return NextResponse.json(
      { error: `Foto nota wajib untuk pengeluaran Rp ${WAJIB_FOTO_MULAI.toLocaleString('id-ID')} ke atas` },
      { status: 400 }
    );

  const { data, error } = await db
    .from('petty_cash')
    .insert({
      type,
      amount,
      note: (b.note || '').toString().slice(0, 300) || null,
      category: (b.category || '').toString().slice(0, 40) || null,
      photo,
      created_by: (b.created_by || '').toString().slice(0, 80) || null,
    })
    .select()
    .single();
  if (error) return NextResponse.json({ error: 'Gagal menyimpan' }, { status: 500 });
  return NextResponse.json({ ok: true, transaction: data });
}
