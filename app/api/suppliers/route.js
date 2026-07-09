import { NextResponse } from 'next/server';
import { supabaseServer } from '../../../lib/supabaseServer';

export const dynamic = 'force-dynamic';

// GET /api/suppliers -> daftar supplier terdaftar
export async function GET() {
  const db = supabaseServer();
  const { data, error } = await db.from('suppliers').select('*').order('name', { ascending: true });
  if (error) return NextResponse.json({ error: 'Gagal membaca' }, { status: 500 });
  return NextResponse.json({ suppliers: data || [] });
}

// POST /api/suppliers -> tambah supplier baru ke daftar terdaftar
export async function POST(req) {
  const db = supabaseServer();
  let b;
  try { b = await req.json(); } catch { return NextResponse.json({ error: 'Body tidak valid' }, { status: 400 }); }
  const name = (b.name || '').toString().trim();
  if (!name) return NextResponse.json({ error: 'Nama supplier wajib' }, { status: 400 });
  const { data, error } = await db
    .from('suppliers')
    .insert({ name, contact: (b.contact || '').toString().trim() || null })
    .select()
    .single();
  if (error) {
    if (String(error.code) === '23505') return NextResponse.json({ error: 'Supplier sudah terdaftar' }, { status: 409 });
    return NextResponse.json({ error: 'Gagal menyimpan' }, { status: 500 });
  }
  return NextResponse.json({ ok: true, supplier: data });
}
