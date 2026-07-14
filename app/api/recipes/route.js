import { NextResponse } from 'next/server';
import { supabaseServer } from '../../../lib/supabaseServer';

export const dynamic = 'force-dynamic';

// GET /api/recipes?menu_item_id=xxx -> daftar bahan resep suatu menu
export async function GET(req) {
  const db = supabaseServer();
  const menuItemId = new URL(req.url).searchParams.get('menu_item_id');
  let q = db.from('recipe_items').select('*, inventory_items(name, unit, stock_qty, cost_price)').order('created_at', { ascending: true });
  if (menuItemId) q = q.eq('menu_item_id', menuItemId);
  const { data, error } = await q;
  if (error) return NextResponse.json({ error: 'Gagal membaca' }, { status: 500 });
  return NextResponse.json({ recipe: data || [] });
}

// POST /api/recipes  { menu_item_id, inventory_item_id, qty } -> tambah bahan ke resep
export async function POST(req) {
  const db = supabaseServer();
  let b;
  try { b = await req.json(); } catch { return NextResponse.json({ error: 'Body tidak valid' }, { status: 400 }); }
  if (!b.menu_item_id || !b.inventory_item_id) return NextResponse.json({ error: 'Menu dan bahan wajib' }, { status: 400 });
  const qty = Number(b.qty);
  if (!qty || qty <= 0) return NextResponse.json({ error: 'Qty wajib diisi' }, { status: 400 });
  const { data, error } = await db
    .from('recipe_items')
    .insert({ menu_item_id: b.menu_item_id, inventory_item_id: b.inventory_item_id, qty })
    .select('*, inventory_items(name, unit, stock_qty, cost_price)')
    .single();
  if (error) return NextResponse.json({ error: 'Gagal menyimpan' }, { status: 500 });
  return NextResponse.json({ ok: true, item: data });
}
