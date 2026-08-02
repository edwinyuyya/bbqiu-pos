import { supabaseServer } from '../../../lib/supabaseServer';
import MenuClient from './MenuClient';
import { taxPercent } from '../../../lib/tax';

export const dynamic = 'force-dynamic';

export default async function MenuPage({ params }) {
  const { token } = await params;
  const db = supabaseServer();

  const { data: table } = await db
    .from('tables')
    .select('id, table_number, active')
    .eq('token', token)
    .single();

  if (!table) {
    return (
      <div className="container-sm" style={{ paddingTop: 48 }}>
        <div className="card">
          <h1 className="title">QR tidak valid</h1>
          <p className="muted">
            Meja tidak ditemukan. Silakan minta bantuan staf untuk QR yang benar.
          </p>
        </div>
      </div>
    );
  }

  if (table.active === false) {
    return (
      <div className="container-sm" style={{ paddingTop: 48 }}>
        <div className="card">
          <h1 className="title">Meja tidak aktif</h1>
          <p className="muted">Meja ini sedang dinonaktifkan. Hubungi staf.</p>
        </div>
      </div>
    );
  }

  // Ambil menu + kategori (urut), hanya yang tersedia
  const { data: categories } = await db
    .from('categories')
    .select('id, name, station_id, sort_order')
    .order('sort_order', { ascending: true });

  const { data: items } = await db
    .from('menu_items')
    .select('id, category_id, name, description, price, station_id, image_url, daily_qty, available, needs_cook_method, needs_drink_option, sort_order')
    .eq('available', true)
    .order('sort_order', { ascending: true });

  // Sisa porsi berdasarkan stok bahan riil (resep qty vs stock_qty terkini) —
  // dikombinasikan (diambil yang paling kecil) dengan daily_qty manual kalau ada.
  const menuIds = (items || []).map((i) => i.id);
  let stockLimitByMenu = {};
  if (menuIds.length) {
    const { data: recipeRows } = await db
      .from('recipe_items')
      .select('menu_item_id, qty, inventory_items(stock_qty)')
      .in('menu_item_id', menuIds);
    for (const r of recipeRows || []) {
      const need = Number(r.qty);
      if (!need || need <= 0) continue;
      const canMake = Math.floor(Number(r.inventory_items?.stock_qty || 0) / need);
      const cur = stockLimitByMenu[r.menu_item_id];
      stockLimitByMenu[r.menu_item_id] = cur === undefined ? canMake : Math.min(cur, canMake);
    }
  }
  const itemsWithStock = (items || []).map((i) => ({
    ...i,
    stock_limit: stockLimitByMenu[i.id] !== undefined ? stockLimitByMenu[i.id] : null,
  }));

  return (
    <MenuClient
      token={token}
      table={table}
      categories={categories || []}
      items={itemsWithStock}
      taxPercent={taxPercent()}
      merchant={process.env.NEXT_PUBLIC_MERCHANT_NAME || 'Restoran'}
    />
  );
}
