import { NextResponse } from 'next/server';
import { supabaseServer } from '../../../../lib/supabaseServer';

export const dynamic = 'force-dynamic';

// DELETE /api/recipes/:id -> hapus 1 baris bahan resep
export async function DELETE(_req, { params }) {
  const { id } = await params;
  const db = supabaseServer();
  const { error } = await db.from('recipe_items').delete().eq('id', id);
  if (error) return NextResponse.json({ error: 'Gagal menghapus' }, { status: 500 });
  return NextResponse.json({ ok: true });
}
