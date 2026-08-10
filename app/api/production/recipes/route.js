import { NextResponse } from 'next/server';
import { supabaseServer } from '../../../../lib/supabaseServer';

export const dynamic = 'force-dynamic';

// POST /api/production/recipes  { output_item_id, input_item_id, qty }
// Tambah/ubah satu baris resep produksi.
export async function POST(req) {
  const db = supabaseServer();
  let b;
  try { b = await req.json(); } catch {
    return NextResponse.json({ error: 'Body tidak valid' }, { status: 400 });
  }

  const { output_item_id, input_item_id } = b;
  const qty = Number(b.qty);
  if (!output_item_id || !input_item_id)
    return NextResponse.json({ error: 'Bahan hasil & bahan mentah wajib dipilih' }, { status: 400 });
  if (output_item_id === input_item_id)
    return NextResponse.json({ error: 'Bahan hasil dan bahan mentah tidak boleh sama' }, { status: 400 });
  if (!(qty > 0))
    return NextResponse.json({ error: 'Takaran harus lebih dari 0' }, { status: 400 });

  // Cegah rantai berputar: A dibuat dari B, lalu B dibuat dari A.
  // Kalau lolos, satu produksi bisa memicu pengurangan tak berujung.
  const { data: balik } = await db
    .from('production_recipes')
    .select('id')
    .eq('output_item_id', input_item_id)
    .eq('input_item_id', output_item_id)
    .maybeSingle();
  if (balik)
    return NextResponse.json(
      { error: 'Tidak bisa: bahan mentah itu justru dibuat dari bahan hasil ini.' },
      { status: 400 }
    );

  const { data, error } = await db
    .from('production_recipes')
    .upsert(
      { output_item_id, input_item_id, qty },
      { onConflict: 'output_item_id,input_item_id' }
    )
    .select()
    .single();
  if (error) return NextResponse.json({ error: 'Gagal menyimpan resep produksi' }, { status: 500 });

  return NextResponse.json({ ok: true, recipe: data });
}

// DELETE /api/production/recipes?id=<id>
export async function DELETE(req) {
  const db = supabaseServer();
  const id = new URL(req.url).searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'id wajib' }, { status: 400 });
  const { error } = await db.from('production_recipes').delete().eq('id', id);
  if (error) return NextResponse.json({ error: 'Gagal menghapus' }, { status: 500 });
  return NextResponse.json({ ok: true });
}
